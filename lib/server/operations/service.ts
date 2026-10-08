import { randomUUID } from "node:crypto";
import type { TransactionSql } from "@/lib/server/db/client";
import { ApiError } from "@/lib/server/http/errors";
import { canonicalJsonDigest } from "@/lib/server/security/digests";

const MAX_OPERATION_JSON_BYTES = 64 * 1024;
const OPERATION_TYPE_PATTERN = /^[a-z][a-z0-9_.:-]{1,127}$/;
const OUTBOX_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export interface CreateOperationInput {
  tenantId: string | null;
  requestedByUserId: string | null;
  type: string;
  input: unknown;
}

export interface OperationSnapshot {
  id: string;
  tenantId: string | null;
  requestedByUserId: string | null;
  operationType: string;
  status: "queued";
  input: unknown;
  createdAt: string;
}

export interface EnqueueOutboxInput {
  deduplicationKey: string;
  tenantId: string | null;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: unknown;
}

export interface EnqueuedOutboxEvent {
  id: string;
  deduplicated: boolean;
}

interface OperationRow {
  id: string;
  tenant_id: string | null;
  requested_by_user_id: string | null;
  operation_type: string;
  input: unknown;
  created_at: Date;
}

interface OutboxRow {
  id: string;
  tenant_id: string | null;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: unknown;
}

export function validateOperationType(type: string): string {
  if (!OPERATION_TYPE_PATTERN.test(type)) {
    throw new ApiError(400, "INVALID_OPERATION", "Operation type is invalid");
  }

  return type;
}

export function validateOutboxDeduplicationKey(key: string): string {
  if (!OUTBOX_KEY_PATTERN.test(key)) {
    throw new ApiError(400, "INVALID_IDEMPOTENCY_KEY", "Outbox deduplication key must contain 8 to 128 safe characters");
  }

  return key;
}

export function serializeOperationInput(input: unknown): string {
  return serializeBoundedJson(input, "INVALID_OPERATION_INPUT", "Operation input");
}

export async function createOperationInTransaction(
  transaction: TransactionSql,
  operation: CreateOperationInput,
): Promise<OperationSnapshot> {
  const type = validateOperationType(operation.type);
  const serializedInput = serializeOperationInput(operation.input);
  const operationId = randomUUID();
  const rows = await transaction<OperationRow[]>`
    INSERT INTO operations (
      id, tenant_id, requested_by_user_id, operation_type, status, input, created_at, updated_at
    )
    VALUES (
      ${operationId}, ${operation.tenantId}, ${operation.requestedByUserId}, ${type}, 'queued',
      ${serializedInput}::jsonb, now(), now()
    )
    RETURNING id, tenant_id, requested_by_user_id, operation_type, input, created_at
  `;
  const row = rows[0];

  if (!row) {
    throw new ApiError(503, "OPERATION_STATE_UNAVAILABLE", "Operation could not be persisted", { retryable: true });
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    requestedByUserId: row.requested_by_user_id,
    operationType: row.operation_type,
    status: "queued",
    input: row.input,
    createdAt: row.created_at.toISOString(),
  };
}

export async function enqueueOutboxInTransaction(
  transaction: TransactionSql,
  event: EnqueueOutboxInput,
): Promise<EnqueuedOutboxEvent> {
  validateOutboxDeduplicationKey(event.deduplicationKey);
  validateOperationType(event.eventType);
  validateOperationType(event.aggregateType);
  validateAggregateId(event.aggregateId);
  const serializedPayload = serializeBoundedJson(event.payload, "INVALID_OUTBOX_PAYLOAD", "Outbox payload");
  const eventDigest = canonicalJsonDigest({
    tenantId: event.tenantId,
    eventType: event.eventType,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    payload: event.payload,
  });
  const rows = await transaction<{ id: string }[]>`
    INSERT INTO outbox_events (
      id, deduplication_key, tenant_id, event_type, aggregate_type, aggregate_id, payload, created_at, updated_at
    )
    VALUES (
      ${randomUUID()}, ${event.deduplicationKey}, ${event.tenantId}, ${event.eventType},
      ${event.aggregateType}, ${event.aggregateId}, ${serializedPayload}::jsonb, now(), now()
    )
    ON CONFLICT (deduplication_key) DO NOTHING
    RETURNING id
  `;
  const inserted = rows[0];

  if (inserted) {
    return { id: inserted.id, deduplicated: false };
  }

  const existingRows = await transaction<OutboxRow[]>`
    SELECT id, tenant_id, event_type, aggregate_type, aggregate_id, payload
    FROM outbox_events
    WHERE deduplication_key = ${event.deduplicationKey}
    FOR UPDATE
  `;
  const existing = existingRows[0];

  if (!existing) {
    throw new ApiError(503, "OUTBOX_STATE_UNAVAILABLE", "Outbox event could not be resolved", { retryable: true });
  }

  const existingDigest = canonicalJsonDigest({
    tenantId: existing.tenant_id,
    eventType: existing.event_type,
    aggregateType: existing.aggregate_type,
    aggregateId: existing.aggregate_id,
    payload: existing.payload,
  });

  if (existingDigest !== eventDigest) {
    throw new ApiError(409, "IDEMPOTENCY_KEY_REUSED", "Outbox deduplication key was already used for a different event");
  }

  return { id: existing.id, deduplicated: true };
}

function validateAggregateId(aggregateId: string): void {
  if (!aggregateId || aggregateId.length > 255 || /[\u0000-\u001f\u007f]/.test(aggregateId)) {
    throw new ApiError(400, "INVALID_AGGREGATE_ID", "Outbox aggregate ID is invalid");
  }
}

function serializeBoundedJson(value: unknown, code: string, label: string): string {
  try {
    canonicalJsonDigest(value);
    const serialized = JSON.stringify(value);
    if (serialized === undefined || Buffer.byteLength(serialized, "utf8") > MAX_OPERATION_JSON_BYTES) {
      throw new TypeError("Payload is not bounded JSON");
    }
    return serialized;
  } catch {
    throw new ApiError(400, code, `${label} must be valid JSON no larger than 64 KiB`);
  }
}
