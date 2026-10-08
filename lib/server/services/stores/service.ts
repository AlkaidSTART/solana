import { randomBytes, randomUUID } from "node:crypto";

import { z } from "zod";

import type { ActorContext } from "@/lib/server/auth/types";
import { supportHoursSchema } from "@/lib/server/services/tenants/service";
import { writeAuditEvent } from "@/lib/server/audit/service";
import { getRuntimeConfig } from "@/lib/server/config/env";
import { withDatabase, withTransaction, type TransactionSql } from "@/lib/server/db/client";
import { ApiError } from "@/lib/server/http/errors";
import type { RequestContext } from "@/lib/server/http/request";
import { executeIdempotent } from "@/lib/server/idempotency/service";
import { createOperationInTransaction, enqueueOutboxInTransaction } from "@/lib/server/operations/service";
import { encryptSecret } from "@/lib/server/security/secrets";
import { sha256Hex } from "@/lib/server/security/digests";
import { normalizeWooCommerceBaseUrl } from "@/lib/server/integrations/woocommerce/core";

const nameSchema = z.string().trim().min(1).max(120).refine(noControlCharacters, {
  message: "Store name cannot contain control characters",
});
const timezoneSchema = z.string().trim().min(1).max(64).refine(isValidTimezone, {
  message: "Timezone must be a valid IANA timezone",
});

export const createStoreSchema = z.object({
  name: nameSchema,
  platform: z.literal("woocommerce"),
  baseUrl: z.string().trim().min(1).max(2048),
  timezone: timezoneSchema,
  supportHours: supportHoursSchema.optional(),
}).strict();

export const updateStoreSchema = z.object({
  name: nameSchema.optional(),
  timezone: timezoneSchema.optional(),
  supportHours: supportHoursSchema.optional(),
}).strict().refine((input) => Object.keys(input).length > 0, {
  message: "At least one store field must be provided",
});

export const storeCredentialsSchema = z.object({
  consumerKey: z.string().trim().min(1).max(512),
  consumerSecret: z.string().min(1).max(1024),
  webhookSecret: z.string().min(1).max(1024),
}).strict();

export const syncStoreSchema = z.object({
  scope: z.enum(["products", "orders", "all"]),
  since: z.string().datetime({ offset: true }).optional(),
}).strict();

export const deleteStoreSchema = z.object({
  confirmationName: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(1).max(500).refine(noControlCharacters, {
    message: "Reason cannot contain control characters",
  }),
}).strict();

export type CreateStoreInput = z.output<typeof createStoreSchema>;
export type UpdateStoreInput = z.output<typeof updateStoreSchema>;
export type StoreCredentialsInput = z.output<typeof storeCredentialsSchema>;
export type SyncStoreInput = z.output<typeof syncStoreSchema>;
export type DeleteStoreInput = z.output<typeof deleteStoreSchema>;

export interface StoreView {
  id: string;
  name: string;
  platform: "woocommerce";
  baseUrl: string;
  timezone: string;
  supportHours: z.output<typeof supportHoursSchema>;
  status: "draft" | "active" | "disabled";
  connectionStatus: "unconfigured" | "pending" | "verified" | "failed";
  version: number;
  hasCredentials: boolean;
  lastSyncStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedStore extends StoreView {
  webhookEndpoint: string;
}

export interface StorePage {
  items: StoreView[];
  pageInfo: { nextCursor: string | null; hasNextPage: boolean };
}

export interface AcceptedStoreOperation {
  operationId: string;
  status: "queued";
  statusUrl: string;
}

interface StoreRecord {
  id: string;
  tenant_id: string;
  name: string;
  platform: "woocommerce";
  base_url: string;
  timezone: string;
  support_hours: unknown;
  status: StoreView["status"];
  connection_status: StoreView["connectionStatus"];
  version: number;
  has_credentials: boolean;
  last_sync_status: string | null;
  created_at: Date;
  updated_at: Date;
}

interface StoreCursor {
  createdAt: string;
  id: string;
}

export async function listStores(
  actor: ActorContext,
  options: { status: StoreView["status"] | null; cursor: string | null },
): Promise<StorePage> {
  const cursor = options.cursor ? decodeCursor(options.cursor) : null;
  const storeIds = actor.role === "Agent" ? actor.storeIds : null;
  const pageSize = 50;
  const rows = await withDatabase((database) => database<StoreRecord[]>`
    SELECT s.id, s.tenant_id, s.name, s.platform, s.base_url, s.timezone, s.support_hours,
      s.status, s.connection_status, s.version,
      EXISTS (SELECT 1 FROM integration_credentials c
        WHERE c.tenant_id = s.tenant_id AND c.store_id = s.id AND c.revoked_at IS NULL) AS has_credentials,
      (SELECT o.status FROM operations o
        WHERE o.tenant_id = s.tenant_id AND o.operation_type = 'store.sync'
          AND o.input ->> 'storeId' = s.id
        ORDER BY o.created_at DESC LIMIT 1) AS last_sync_status,
      s.created_at, s.updated_at
    FROM stores s
    WHERE s.tenant_id = ${actor.tenantId}
      AND (${options.status}::text IS NULL OR s.status = ${options.status})
      AND (${storeIds}::text[] IS NULL OR s.id = ANY(${storeIds}))
      AND (${cursor?.createdAt ?? null}::timestamptz IS NULL
        OR (s.created_at, s.id) < (${cursor?.createdAt ?? null}::timestamptz, ${cursor?.id ?? null}::text))
    ORDER BY s.created_at DESC, s.id DESC
    LIMIT ${pageSize + 1}
  `);
  const hasNextPage = rows.length > pageSize;
  const pageRows = rows.slice(0, pageSize);
  const lastRow = pageRows.at(-1);

  return {
    items: pageRows.map(toStoreView),
    pageInfo: {
      hasNextPage,
      nextCursor: hasNextPage && lastRow ? encodeCursor({
        createdAt: lastRow.created_at.toISOString(),
        id: lastRow.id,
      }) : null,
    },
  };
}

export async function getStore(actor: ActorContext, storeId: string): Promise<StoreView> {
  const rows = await withDatabase((database) => database<StoreRecord[]>`
    SELECT s.id, s.tenant_id, s.name, s.platform, s.base_url, s.timezone, s.support_hours,
      s.status, s.connection_status, s.version,
      EXISTS (SELECT 1 FROM integration_credentials c
        WHERE c.tenant_id = s.tenant_id AND c.store_id = s.id AND c.revoked_at IS NULL) AS has_credentials,
      (SELECT o.status FROM operations o
        WHERE o.tenant_id = s.tenant_id AND o.operation_type = 'store.sync'
          AND o.input ->> 'storeId' = s.id
        ORDER BY o.created_at DESC LIMIT 1) AS last_sync_status,
      s.created_at, s.updated_at
    FROM stores s
    WHERE s.id = ${storeId} AND s.tenant_id = ${actor.tenantId}
    LIMIT 1
  `);
  const row = rows[0];
  if (!row || (actor.role === "Agent" && !actor.storeIds.includes(storeId))) {
    throw storeNotFound();
  }
  return toStoreView(row);
}

export async function createStore(
  actor: ActorContext,
  input: CreateStoreInput,
  requestContext: RequestContext,
): Promise<CreatedStore> {
  const baseUrl = normalizeWooCommerceBaseUrl(input.baseUrl, process.env.NODE_ENV !== "production");
  if (!baseUrl) {
    throw new ApiError(422, "INVALID_STORE_URL", "Store URL must use HTTPS");
  }

  return withTransaction(async (transaction) => {
    const storeId = randomUUID();
    const endpointId = randomBytes(32).toString("base64url");
    const supportHours = input.supportHours ?? {};
    const rows = await transaction<StoreRecord[]>`
      INSERT INTO stores (
        id, tenant_id, name, platform, base_url, timezone, support_hours, status,
        connection_status, version, credential_version, created_by_user_id, created_at, updated_at
      ) VALUES (
        ${storeId}, ${actor.tenantId}, ${input.name}, 'woocommerce', ${baseUrl}, ${input.timezone},
        ${JSON.stringify(supportHours)}::jsonb, 'draft', 'unconfigured', 1, 0, ${actor.userId}, now(), now()
      )
      RETURNING id, tenant_id, name, platform, base_url, timezone, support_hours, status,
        connection_status, version, false AS has_credentials, NULL::text AS last_sync_status, created_at, updated_at
    `;
    const store = rows[0];
    if (!store) {
      throw new ApiError(503, "STORE_CREATE_UNAVAILABLE", "Store could not be created", { retryable: true });
    }

    await transaction`
      INSERT INTO woo_webhook_endpoints (id, tenant_id, store_id, endpoint_id_hash, credential_version, created_at)
      VALUES (${randomUUID()}, ${actor.tenantId}, ${storeId}, ${sha256Hex(endpointId)}, 0, now())
    `;
    await writeAuditEvent({
      actor,
      action: "store.created",
      resourceType: "store",
      resourceId: storeId,
      requestId: requestContext.requestId,
      metadata: { platform: "woocommerce" },
    }, transaction);

    return {
      ...toStoreView(store),
      webhookEndpoint: `/api/v1/webhooks/woocommerce/${endpointId}`,
    };
  });
}

export function parseStoreIfMatch(value: string): number {
  const match = /^"([1-9]\d*)"$/.exec(value.trim());
  const versionText = match?.[1];
  const version = versionText ? Number(versionText) : Number.NaN;
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new ApiError(400, "INVALID_IF_MATCH", "If-Match must contain the current quoted store version");
  }
  return version;
}

export async function updateStore(
  actor: ActorContext,
  storeId: string,
  expectedVersion: number,
  input: UpdateStoreInput,
  requestContext: RequestContext,
): Promise<StoreView> {
  return withTransaction(async (transaction) => {
    const rows = await transaction<StoreRecord[]>`
      SELECT s.id, s.tenant_id, s.name, s.platform, s.base_url, s.timezone, s.support_hours,
        s.status, s.connection_status, s.version,
        EXISTS (SELECT 1 FROM integration_credentials c
          WHERE c.tenant_id = s.tenant_id AND c.store_id = s.id AND c.revoked_at IS NULL) AS has_credentials,
        (SELECT o.status FROM operations o
          WHERE o.tenant_id = s.tenant_id AND o.operation_type = 'store.sync'
            AND o.input ->> 'storeId' = s.id
          ORDER BY o.created_at DESC LIMIT 1) AS last_sync_status,
        s.created_at, s.updated_at
      FROM stores s
      WHERE s.id = ${storeId} AND s.tenant_id = ${actor.tenantId}
      FOR UPDATE OF s
    `;
    const current = rows[0];
    if (!current || (actor.role === "Agent" && !actor.storeIds.includes(storeId))) {
      throw storeNotFound();
    }
    if (current.version !== expectedVersion) {
      throw new ApiError(409, "VERSION_CONFLICT", "Store was changed by another request", {
        details: { expectedVersion, currentVersion: current.version },
      });
    }
    if (current.status === "disabled") {
      throw new ApiError(409, "STORE_DISABLED", "Disabled stores cannot be changed");
    }

    const updated = await transaction<StoreRecord[]>`
      UPDATE stores
      SET name = coalesce(${input.name ?? null}, name),
          timezone = coalesce(${input.timezone ?? null}, timezone),
          support_hours = coalesce(${input.supportHours ? JSON.stringify(input.supportHours) : null}::jsonb, support_hours),
          version = version + 1,
          updated_at = now()
      WHERE id = ${storeId} AND tenant_id = ${actor.tenantId} AND version = ${expectedVersion}
      RETURNING id, tenant_id, name, platform, base_url, timezone, support_hours, status,
        connection_status, version,
        EXISTS (SELECT 1 FROM integration_credentials c WHERE c.store_id = stores.id AND c.revoked_at IS NULL) AS has_credentials,
        (SELECT o.status FROM operations o WHERE o.tenant_id = stores.tenant_id
          AND o.operation_type = 'store.sync' AND o.input ->> 'storeId' = stores.id
          ORDER BY o.created_at DESC LIMIT 1) AS last_sync_status,
        created_at, updated_at
    `;
    const store = updated[0];
    if (!store) {
      throw new ApiError(409, "VERSION_CONFLICT", "Store was changed by another request");
    }

    await writeAuditEvent({
      actor,
      action: "store.updated",
      resourceType: "store",
      resourceId: storeId,
      requestId: requestContext.requestId,
      metadata: { fields: Object.keys(input).sort(), version: store.version },
    }, transaction);
    return toStoreView(store);
  });
}

export async function putStoreCredentials(
  actor: ActorContext,
  storeId: string,
  input: StoreCredentialsInput,
  requestContext: RequestContext,
): Promise<{ storeId: string; hasCredentials: true; credentialVersion: number; version: number }> {
  const encryptionKey = getRuntimeConfig().security.credentialEncryptionKey;
  if (!encryptionKey) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Credential encryption is not configured", { retryable: true });
  }

  let encrypted: { consumerKey: string; consumerSecret: string; webhookSecret: string };
  try {
    encrypted = {
      consumerKey: encryptSecret(input.consumerKey, encryptionKey),
      consumerSecret: encryptSecret(input.consumerSecret, encryptionKey),
      webhookSecret: encryptSecret(input.webhookSecret, encryptionKey),
    };
  } catch {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Credential encryption is not available", { retryable: true });
  }

  return withTransaction(async (transaction) => {
    const stores = await transaction<{ id: string; status: StoreView["status"]; version: number; credential_version: number }[]>`
      SELECT id, status, version, credential_version
      FROM stores
      WHERE id = ${storeId} AND tenant_id = ${actor.tenantId}
      FOR UPDATE
    `;
    const store = stores[0];
    if (!store) {
      throw storeNotFound();
    }
    if (store.status === "disabled") {
      throw new ApiError(409, "STORE_DISABLED", "Disabled stores cannot accept credentials");
    }

    const credentialVersion = store.credential_version + 1;
    await transaction`
      UPDATE integration_credentials
      SET revoked_at = now()
      WHERE tenant_id = ${actor.tenantId} AND store_id = ${storeId} AND revoked_at IS NULL
    `;
    await transaction`
      INSERT INTO integration_credentials (
        id, tenant_id, store_id, credential_version, consumer_key_ciphertext,
        consumer_secret_ciphertext, webhook_secret_ciphertext, created_at
      ) VALUES (
        ${randomUUID()}, ${actor.tenantId}, ${storeId}, ${credentialVersion}, ${encrypted.consumerKey},
        ${encrypted.consumerSecret}, ${encrypted.webhookSecret}, now()
      )
    `;
    await transaction`
      UPDATE stores
      SET credential_version = ${credentialVersion}, connection_status = 'unconfigured',
          verified_at = NULL, version = version + 1, updated_at = now()
      WHERE id = ${storeId} AND tenant_id = ${actor.tenantId}
    `;
    await transaction`
      UPDATE woo_webhook_endpoints
      SET credential_version = ${credentialVersion}, revoked_at = NULL
      WHERE store_id = ${storeId} AND tenant_id = ${actor.tenantId}
    `;
    await writeAuditEvent({
      actor,
      action: "store.credentials_rotated",
      resourceType: "store",
      resourceId: storeId,
      requestId: requestContext.requestId,
      metadata: { credentialVersion },
    }, transaction);

    return {
      storeId,
      hasCredentials: true,
      credentialVersion,
      version: store.version + 1,
    };
  });
}

export async function requestStoreVerification(
  actor: ActorContext,
  storeId: string,
  idempotencyKey: string,
  requestContext: RequestContext,
): Promise<AcceptedStoreOperation> {
  const result = await executeIdempotent(actor, "store.verify", idempotencyKey, { storeId }, async (transaction) => {
    const store = await getStoreForWrite(transaction, actor, storeId);
    if (store.status === "disabled") {
      throw new ApiError(409, "STORE_DISABLED", "Disabled stores cannot be verified");
    }
    if (store.credential_version < 1 || !store.has_credentials) {
      throw new ApiError(422, "STORE_CREDENTIALS_REQUIRED", "Store credentials must be configured before verification");
    }

    const operation = await createOperationInTransaction(transaction, {
      tenantId: actor.tenantId,
      requestedByUserId: actor.userId,
      type: "store.verify",
      input: { storeId, credentialVersion: store.credential_version },
    });
    await transaction`
      UPDATE stores
      SET connection_status = 'pending', version = version + 1, updated_at = now()
      WHERE id = ${storeId} AND tenant_id = ${actor.tenantId}
    `;
    await enqueueOutboxInTransaction(transaction, {
      deduplicationKey: `store.verify:${sha256Hex(`${storeId}:${idempotencyKey}`)}`,
      tenantId: actor.tenantId,
      eventType: "store.verify.requested",
      aggregateType: "store",
      aggregateId: storeId,
      payload: { operationId: operation.id, credentialVersion: store.credential_version },
    });
    await writeAuditEvent({
      actor,
      action: "store.verification_requested",
      resourceType: "store",
      resourceId: storeId,
      requestId: requestContext.requestId,
      metadata: { operationId: operation.id },
    }, transaction);

    return {
      status: 202,
      body: {
        operationId: operation.id,
        status: "queued" as const,
        statusUrl: `/api/v1/operations/${operation.id}`,
      },
    };
  });
  return result.body;
}

export async function requestStoreSync(
  actor: ActorContext,
  storeId: string,
  input: SyncStoreInput,
  idempotencyKey: string,
  requestContext: RequestContext,
): Promise<AcceptedStoreOperation> {
  const result = await executeIdempotent(actor, "store.sync", idempotencyKey, { storeId, ...input }, async (transaction) => {
    const store = await getStoreForWrite(transaction, actor, storeId);
    if (store.status === "disabled") {
      throw new ApiError(409, "STORE_DISABLED", "Disabled stores cannot be synchronized");
    }
    if (!store.has_credentials) {
      throw new ApiError(422, "STORE_CREDENTIALS_REQUIRED", "Store credentials must be configured before synchronization");
    }

    const operation = await createOperationInTransaction(transaction, {
      tenantId: actor.tenantId,
      requestedByUserId: actor.userId,
      type: "store.sync",
      input: {
        storeId,
        scope: input.scope,
        initialImport: store.status === "draft",
        createReminderTasks: false,
        ...(input.since ? { since: input.since } : {}),
      },
    });
    await enqueueOutboxInTransaction(transaction, {
      deduplicationKey: `store.sync:${sha256Hex(`${storeId}:${idempotencyKey}`)}`,
      tenantId: actor.tenantId,
      eventType: "store.sync.requested",
      aggregateType: "store",
      aggregateId: storeId,
      payload: {
        operationId: operation.id,
        scope: input.scope,
        initialImport: store.status === "draft",
        createReminderTasks: false,
        ...(input.since ? { since: input.since } : {}),
      },
    });
    await writeAuditEvent({
      actor,
      action: "store.sync_requested",
      resourceType: "store",
      resourceId: storeId,
      requestId: requestContext.requestId,
      metadata: { operationId: operation.id, scope: input.scope },
    }, transaction);

    return {
      status: 202,
      body: {
        operationId: operation.id,
        status: "queued" as const,
        statusUrl: `/api/v1/operations/${operation.id}`,
      },
    };
  });
  return result.body;
}

export async function disableStore(
  actor: ActorContext,
  storeId: string,
  input: DeleteStoreInput,
  idempotencyKey: string,
  requestContext: RequestContext,
): Promise<{ id: string; status: "disabled" }> {
  const result = await executeIdempotent(actor, "store.unlink", idempotencyKey, { storeId, ...input }, async (transaction) => {
    const stores = await transaction<{ id: string; name: string; status: StoreView["status"]; version: number }[]>`
      SELECT id, name, status, version
      FROM stores
      WHERE id = ${storeId} AND tenant_id = ${actor.tenantId}
      FOR UPDATE
    `;
    const store = stores[0];
    if (!store) {
      throw storeNotFound();
    }
    if (store.name !== input.confirmationName) {
      throw new ApiError(422, "STORE_CONFIRMATION_MISMATCH", "Confirmation name does not match this store");
    }
    if (store.status === "disabled") {
      return { status: 200, body: { id: storeId, status: "disabled" as const } };
    }

    await transaction`
      UPDATE stores
      SET status = 'disabled', connection_status = 'unconfigured', verified_at = NULL,
          version = version + 1, updated_at = now()
      WHERE id = ${storeId} AND tenant_id = ${actor.tenantId}
    `;
    await transaction`
      UPDATE integration_credentials SET revoked_at = now()
      WHERE tenant_id = ${actor.tenantId} AND store_id = ${storeId} AND revoked_at IS NULL
    `;
    await transaction`
      UPDATE woo_webhook_endpoints SET revoked_at = now()
      WHERE tenant_id = ${actor.tenantId} AND store_id = ${storeId} AND revoked_at IS NULL
    `;
    await transaction`
      UPDATE store_grants SET revoked_at = now()
      WHERE tenant_id = ${actor.tenantId} AND store_id = ${storeId} AND revoked_at IS NULL
    `;
    await transaction`
      UPDATE operations
      SET status = 'cancelled', error_code = 'STORE_UNLINKED', completed_at = now(), updated_at = now()
      WHERE tenant_id = ${actor.tenantId}
        AND status = 'queued'
        AND input ->> 'storeId' = ${storeId}
    `;
    await enqueueOutboxInTransaction(transaction, {
      deduplicationKey: `store.unlink:${sha256Hex(`${storeId}:${idempotencyKey}`)}`,
      tenantId: actor.tenantId,
      eventType: "store.unlinked",
      aggregateType: "store",
      aggregateId: storeId,
      payload: { storeId, reasonDigest: sha256Hex(input.reason) },
    });
    await writeAuditEvent({
      actor,
      action: "store.unlinked",
      resourceType: "store",
      resourceId: storeId,
      requestId: requestContext.requestId,
      metadata: { reasonDigest: sha256Hex(input.reason), version: store.version + 1 },
    }, transaction);

    return { status: 200, body: { id: storeId, status: "disabled" as const } };
  });
  return result.body;
}

async function getStoreForWrite(
  transaction: TransactionSql,
  actor: ActorContext,
  storeId: string,
): Promise<{ status: StoreView["status"]; connection_status: StoreView["connectionStatus"]; credential_version: number; has_credentials: boolean }> {
  const rows = await transaction<{
    status: StoreView["status"];
    connection_status: StoreView["connectionStatus"];
    credential_version: number;
    has_credentials: boolean;
  }[]>`
    SELECT s.status, s.connection_status, s.credential_version,
      EXISTS (SELECT 1 FROM integration_credentials c
        WHERE c.tenant_id = s.tenant_id AND c.store_id = s.id AND c.revoked_at IS NULL) AS has_credentials
    FROM stores s
    WHERE s.id = ${storeId} AND s.tenant_id = ${actor.tenantId}
    FOR UPDATE OF s
  `;
  const store = rows[0];
  if (!store) {
    throw storeNotFound();
  }
  return store;
}

function toStoreView(record: StoreRecord): StoreView {
  const supportHours = supportHoursSchema.safeParse(record.support_hours);
  if (!supportHours.success) {
    throw new ApiError(500, "STORE_CONFIGURATION_INVALID", "Store configuration is invalid");
  }

  return {
    id: record.id,
    name: record.name,
    platform: record.platform,
    baseUrl: record.base_url,
    timezone: record.timezone,
    supportHours: supportHours.data,
    status: record.status,
    connectionStatus: record.connection_status,
    version: record.version,
    hasCredentials: record.has_credentials,
    lastSyncStatus: record.last_sync_status,
    createdAt: new Date(record.created_at).toISOString(),
    updatedAt: new Date(record.updated_at).toISOString(),
  };
}

export function parseStoreStatus(value: string | null): StoreView["status"] | null {
  if (value === null) {
    return null;
  }
  if (value === "draft" || value === "active" || value === "disabled") {
    return value;
  }
  throw new ApiError(400, "INVALID_STATUS_FILTER", "Store status filter is invalid");
}

function encodeCursor(cursor: StoreCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(value: string): StoreCursor {
  if (!/^[A-Za-z0-9_-]{1,512}$/.test(value)) {
    throw new ApiError(400, "INVALID_CURSOR", "Store cursor is invalid");
  }
  try {
    const decoded = Buffer.from(value, "base64url");
    if (decoded.toString("base64url") !== value) {
      throw new TypeError("Non-canonical cursor");
    }
    const parsed: unknown = JSON.parse(decoded.toString("utf8"));
    const cursor = z.object({
      createdAt: z.string().datetime({ offset: true }),
      id: z.string().min(1).max(128),
    }).strict().safeParse(parsed);
    if (!cursor.success) {
      throw new TypeError("Invalid cursor payload");
    }
    return cursor.data;
  } catch {
    throw new ApiError(400, "INVALID_CURSOR", "Store cursor is invalid");
  }
}

function noControlCharacters(value: string): boolean {
  return !/[\u0000-\u001f\u007f]/.test(value);
}

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function storeNotFound(): ApiError {
  return new ApiError(404, "NOT_FOUND", "Store was not found");
}
