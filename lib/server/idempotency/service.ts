import { randomUUID } from "node:crypto";
import type postgres from "postgres";

import { ApiError } from "@/lib/server/http/errors";
import type { SessionContext } from "@/lib/server/auth/types";
import { canonicalJsonDigest } from "@/lib/server/security/digests";
import { getDatabase, withTransaction } from "@/lib/server/db/client";

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export interface IdempotentResponse<T> {
  status: number;
  body: T;
}

export function createPayloadDigest(payload: unknown): string {
  return canonicalJsonDigest(payload);
}

export async function executeIdempotent<T>(
  actor: Pick<SessionContext, "userId" | "tenantId">,
  operation: string,
  key: string,
  payload: unknown,
  executeDatabaseOperation: (transaction: postgres.TransactionSql) => Promise<IdempotentResponse<T>>,
): Promise<IdempotentResponse<T>> {
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new ApiError(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must contain 8 to 128 safe characters");
  }

  if (!/^[a-z][a-z0-9_.:-]{1,127}$/.test(operation)) {
    throw new ApiError(400, "INVALID_OPERATION", "Operation identifier is invalid");
  }

  const payloadDigest = createPayloadDigest(payload);
  if (!getDatabase()) {
    throw new ApiError(503, "DATABASE_UNAVAILABLE", "Idempotent execution requires the database", {
      retryable: true,
    });
  }

  return withTransaction(async (transaction) => {
    await transaction`
      DELETE FROM idempotency_records
      WHERE tenant_id IS NOT DISTINCT FROM ${actor.tenantId}
        AND actor_user_id IS NOT DISTINCT FROM ${actor.userId}
        AND operation = ${operation}
        AND idempotency_key = ${key}
        AND expires_at <= now()
    `;
    const inserted = await transaction<{ id: string }[]>`
      INSERT INTO idempotency_records (
        id, tenant_id, actor_user_id, operation, idempotency_key,
        payload_digest, state, response_status, response_body, created_at, updated_at, expires_at
      )
      VALUES (
        ${randomUUID()}, ${actor.tenantId}, ${actor.userId}, ${operation}, ${key},
        ${payloadDigest}, 'pending', NULL, NULL, now(), now(), now() + interval '24 hours'
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    if (inserted.length === 0) {
      const existingRows = await transaction<{
        payload_digest: string;
        state: string;
        response_status: number | null;
        response_body: unknown;
      }[]>`
        SELECT payload_digest, state, response_status, response_body
        FROM idempotency_records
        WHERE tenant_id IS NOT DISTINCT FROM ${actor.tenantId}
          AND actor_user_id IS NOT DISTINCT FROM ${actor.userId}
          AND operation = ${operation}
          AND idempotency_key = ${key}
        FOR UPDATE
      `;
      const existing = existingRows[0];

      if (!existing) {
        throw new ApiError(503, "IDEMPOTENCY_STATE_UNAVAILABLE", "Idempotency record could not be resolved", {
          retryable: true,
        });
      }

      if (existing.payload_digest !== payloadDigest) {
        throw new ApiError(409, "IDEMPOTENCY_KEY_REUSED", "Idempotency-Key was already used with a different request");
      }

      if (existing.state !== "completed" || existing.response_status === null) {
        throw new ApiError(503, "IDEMPOTENCY_IN_PROGRESS", "The matching request is still being processed", {
          retryable: true,
        });
      }

      return { status: existing.response_status, body: existing.response_body as T };
    }

    // This callback may only write through this transaction (including its outbox); perform network/provider calls after commit.
    const result = await executeDatabaseOperation(transaction);
    if (!Number.isInteger(result.status) || result.status < 200 || result.status > 599) {
      throw new ApiError(500, "IDEMPOTENCY_RESPONSE_INVALID", "Idempotent operation returned an invalid HTTP status");
    }
    const serialized = JSON.stringify(result.body);
    if (serialized === undefined) {
      throw new ApiError(500, "IDEMPOTENCY_RESPONSE_INVALID", "Idempotent operation returned a non-serializable result");
    }

    await transaction`
      UPDATE idempotency_records
      SET state = 'completed', response_status = ${result.status}, response_body = ${serialized}::jsonb, updated_at = now()
      WHERE id = ${inserted[0]?.id}
    `;

    return result;
  });
}
