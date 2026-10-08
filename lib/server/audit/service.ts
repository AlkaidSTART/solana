import { randomUUID } from "node:crypto";

import { ApiError } from "@/lib/server/http/errors";
import type { ActorContext } from "@/lib/server/auth/types";
import { withTransaction, type TransactionSql } from "@/lib/server/db/client";

const SENSITIVE_KEY_PATTERN = /(?:token|otp|secret|password|authorization|cookie|message(?:body|content|text)?|phone|address|email|wallet|signature|private.?key)/i;
const MAX_METADATA_DEPTH = 4;
const MAX_METADATA_ENTRIES = 25;
const MAX_METADATA_BYTES = 4096;
const SAFE_METADATA_STRING = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

export interface AuditEventInput {
  actor?: Pick<ActorContext, "userId" | "tenantId"> | null;
  tenantId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function writeAuditEvent(event: AuditEventInput, transaction?: TransactionSql): Promise<void> {
  if (!/^[a-z][a-z0-9_.:-]{1,127}$/.test(event.action)) {
    throw new ApiError(400, "INVALID_AUDIT_ACTION", "Audit action is invalid");
  }
  if (event.metadata !== undefined) {
    assertSafeMetadata(event.metadata);
    if (Buffer.byteLength(JSON.stringify(event.metadata), "utf8") > MAX_METADATA_BYTES) {
      throw invalidMetadata();
    }
  }
  if (event.actor && event.tenantId && event.actor.tenantId !== event.tenantId) {
    throw new ApiError(400, "INVALID_AUDIT_TENANT", "Audit tenant does not match the actor tenant");
  }

  if (transaction) {
    await insertAuditEvent(transaction, event);
  } else {
    await withTransaction((sql) => insertAuditEvent(sql, event));
  }
}

async function insertAuditEvent(transaction: TransactionSql, event: AuditEventInput): Promise<void> {
  await transaction`
    INSERT INTO audit_events (
      id, tenant_id, actor_user_id, action, resource_type, resource_id, request_id, metadata, created_at
    ) VALUES (
      ${randomUUID()}, ${event.actor?.tenantId ?? event.tenantId ?? null}, ${event.actor?.userId ?? null}, ${event.action},
      ${event.resourceType ?? null}, ${event.resourceId ?? null}, ${event.requestId ?? null},
      ${JSON.stringify(event.metadata ?? {})}::jsonb, now()
    )
  `;
}

function assertSafeMetadata(value: unknown, depth = 0): void {
  if (depth > MAX_METADATA_DEPTH) {
    throw invalidMetadata();
  }
  if (value === null || typeof value === "boolean") {
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw invalidMetadata();
    }
    return;
  }
  if (typeof value === "string") {
    if (!SAFE_METADATA_STRING.test(value)) {
      throw invalidMetadata();
    }
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_METADATA_ENTRIES) {
      throw invalidMetadata();
    }
    for (const entry of value) {
      assertSafeMetadata(entry, depth + 1);
    }
    return;
  }
  if (typeof value !== "object") {
    throw invalidMetadata();
  }
  const prototype = Object.getPrototypeOf(value) as unknown;
  if (prototype !== Object.prototype && prototype !== null) {
    throw invalidMetadata();
  }

  for (const [key, entry] of Object.entries(value)) {
    if (Object.keys(value).length > MAX_METADATA_ENTRIES) throw invalidMetadata();
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      throw new ApiError(400, "SENSITIVE_AUDIT_FIELD", "Sensitive fields cannot be written to audit metadata");
    }
    if (!SAFE_METADATA_STRING.test(key)) throw invalidMetadata();
    assertSafeMetadata(entry, depth + 1);
  }
}

function invalidMetadata(): ApiError {
  return new ApiError(400, "INVALID_AUDIT_METADATA", "Audit metadata must contain small JSON-safe values");
}
