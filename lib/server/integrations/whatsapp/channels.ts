import { randomUUID } from "node:crypto";

import { z } from "zod";

import type { ActorContext } from "@/lib/server/auth/types";
import { requireRole } from "@/lib/server/auth/roles";
import { writeAuditEvent } from "@/lib/server/audit/service";
import { getRuntimeConfig } from "@/lib/server/config/env";
import { ApiError } from "@/lib/server/http/errors";
import type { RequestContext } from "@/lib/server/http/request";
import { withDatabase, type TransactionSql } from "@/lib/server/db/client";
import { executeIdempotent } from "@/lib/server/idempotency/service";
import { encryptSecret } from "@/lib/server/security/secrets";
import { hmacSha256Hex, safeEqual } from "@/lib/server/security/digests";

const assetIdSchema = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_.:-]+$/);
const accessTokenSchema = z.string().trim().min(20).max(4096);
const phoneSchema = z.string().trim().regex(/^\+[1-9]\d{7,14}$/);

export const createChannelSchema = z.object({
  phoneNumberId: assetIdSchema,
  businessAccountId: assetIdSchema,
  displayPhoneNumber: phoneSchema,
  accessToken: accessTokenSchema,
}).strict();

export const rotateCredentialsSchema = z.object({ accessToken: accessTokenSchema }).strict();

export const testMessageSchema = z.object({
  templateId: z.string().uuid(),
  testRecipient: phoneSchema,
  variables: z.record(z.string(), z.string().max(512)).optional().default({}),
}).strict();
export const deleteChannelSchema = z.object({
  confirmationPhoneNumber: phoneSchema,
  reason: z.string().trim().min(3).max(256),
}).strict();

interface ChannelRow {
  id: string;
  tenant_id: string;
  store_id: string;
  provider: string;
  phone_number_id: string;
  business_account_id: string;
  display_phone_last4: string;
  status: string;
  verification_evidence: unknown;
  last_webhook_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface TemplateRow {
  id: string;
  provider_template_id: string | null;
  name: string;
  locale: string;
  category: string;
  status: string;
  approval_evidence: unknown;
  last_synced_at: Date | null;
  updated_at: Date;
}

export interface ChannelView {
  id: string;
  storeId: string;
  provider: "whatsapp_cloud_api";
  phoneNumberId: string;
  businessAccountId: string;
  phoneNumberMasked: string;
  status: string;
  verificationEvidence: unknown;
  lastWebhookAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueuedChannelOperation {
  operationId: string;
  channelId: string;
  status: "queued";
  operationType: string;
}

export interface TemplateView {
  id: string;
  providerTemplateId: string | null;
  name: string;
  locale: string;
  category: string;
  status: string;
  approvalEvidence: unknown;
  lastSyncedAt: string | null;
  updatedAt: string;
}

export async function listChannels(
  actor: ActorContext,
  filters: { storeId?: string; status?: string },
): Promise<ChannelView[]> {
  const storeId = filters.storeId ?? null;
  const status = filters.status ?? null;
  return withDatabase(async (sql) => {
    const rows = await sql<ChannelRow[]>`
      SELECT id, tenant_id, store_id, provider, phone_number_id, business_account_id,
        display_phone_last4, status, verification_evidence, last_webhook_at, created_at, updated_at
      FROM channels
      WHERE tenant_id = ${actor.tenantId}
        AND (${storeId}::text IS NULL OR store_id = ${storeId})
        AND (${status}::text IS NULL OR status = ${status})
        AND (${actor.role !== "Agent"} OR store_id = ANY(${actor.storeIds}))
      ORDER BY updated_at DESC, id DESC
    `;
    return rows.map(toChannelView);
  });
}

export async function getChannel(actor: ActorContext, channelId: string): Promise<ChannelView> {
  const rows = await withDatabase((sql) => sql<ChannelRow[]>`
    SELECT id, tenant_id, store_id, provider, phone_number_id, business_account_id,
      display_phone_last4, status, verification_evidence, last_webhook_at, created_at, updated_at
    FROM channels
    WHERE tenant_id = ${actor.tenantId} AND id = ${channelId}
      AND (${actor.role !== "Agent"} OR store_id = ANY(${actor.storeIds}))
    LIMIT 1
  `);
  const channel = rows[0];
  if (!channel) throw notFound();
  return toChannelView(channel);
}

export async function createManualChannel(
  actor: ActorContext,
  storeId: string,
  input: z.output<typeof createChannelSchema>,
  idempotencyKey: string,
  requestContext: RequestContext,
): Promise<{ channel: ChannelView; operation: QueuedChannelOperation }> {
  requireRole(actor, ["Owner", "Admin"]);
  assertManualCloudApiConfigured();
  const config = getRuntimeConfig();
  const encryptionKey = config.security.credentialEncryptionKey;
  const phoneHashKey = config.security.otpHmacKey;
  if (!encryptionKey || !phoneHashKey) throw capabilityUnavailable();
  const accessTokenCiphertext = encryptSecret(input.accessToken, encryptionKey);
  const phoneCiphertext = encryptSecret(input.displayPhoneNumber, encryptionKey);
  const phoneHash = hmacSha256Hex(phoneHashKey, input.displayPhoneNumber);
  const result = await executeIdempotent(actor, "whatsapp.channel.create", idempotencyKey, {
    ...input,
    accessToken: input.accessToken,
  }, async (transaction) => {
    const store = await transaction<{ id: string }[]>`
      SELECT id FROM stores WHERE tenant_id = ${actor.tenantId} AND id = ${storeId} FOR SHARE
    `;
    if (!store[0]) throw notFound();

    const duplicate = await transaction<{ id: string }[]>`
      SELECT id FROM channels WHERE phone_number_id = ${input.phoneNumberId} LIMIT 1
    `;
    if (duplicate[0]) {
      throw new ApiError(409, "CHANNEL_ASSET_ALREADY_BOUND", "This WhatsApp phone number is already bound");
    }

    const channelId = randomUUID();
    const credentialId = randomUUID();
    const channelRows = await transaction<ChannelRow[]>`
      INSERT INTO channels (
        id, tenant_id, store_id, provider, phone_number_id, business_account_id,
        display_phone_ciphertext, display_phone_hash, display_phone_last4, status,
        verification_evidence, created_at, updated_at
      ) VALUES (
        ${channelId}, ${actor.tenantId}, ${storeId}, 'whatsapp_cloud_api', ${input.phoneNumberId},
        ${input.businessAccountId}, ${phoneCiphertext}, ${phoneHash}, ${input.displayPhoneNumber.slice(-4)},
        'unverified', ${JSON.stringify({ status: "unverified", checks: [] })}::jsonb, now(), now()
      )
      RETURNING id, tenant_id, store_id, provider, phone_number_id, business_account_id,
        display_phone_last4, status, verification_evidence, last_webhook_at, created_at, updated_at
    `;
    await transaction`
      INSERT INTO whatsapp_channel_credentials (
        id, tenant_id, channel_id, version, access_token_ciphertext, status, created_by_user_id, created_at
      ) VALUES (${credentialId}, ${actor.tenantId}, ${channelId}, 1, ${accessTokenCiphertext}, 'pending', ${actor.userId}, now())
    `;
    const operation = await insertOperation(transaction, actor, channelId, "whatsapp.channel.verify", { reason: "initial_setup" });
    await writeAuditEvent({
      actor,
      action: "whatsapp.channel.created",
      resourceType: "channel",
      resourceId: channelId,
      requestId: requestContext.requestId,
      metadata: { provider: "whatsapp_cloud_api", status: "unverified" },
    }, transaction);

    return {
      status: 202,
      body: {
        channel: toChannelView(requireRow(channelRows[0])),
        operation,
      },
    };
  });
  return result.body;
}

export async function rotateChannelCredentials(
  actor: ActorContext,
  channelId: string,
  input: z.output<typeof rotateCredentialsSchema>,
  idempotencyKey: string,
  requestContext: RequestContext,
): Promise<QueuedChannelOperation> {
  requireRole(actor, ["Owner", "Admin"]);
  assertManualCloudApiConfigured();
  const key = getRuntimeConfig().security.credentialEncryptionKey;
  if (!key) throw capabilityUnavailable();
  const ciphertext = encryptSecret(input.accessToken, key);
  const result = await executeIdempotent(actor, "whatsapp.channel.rotate_credentials", idempotencyKey, input, async (transaction) => {
    const channel = await lockChannel(transaction, actor, channelId);
    const current = await transaction<{ version: number }[]>`
      SELECT coalesce(max(version), 0) AS version
      FROM whatsapp_channel_credentials WHERE tenant_id = ${actor.tenantId} AND channel_id = ${channelId}
    `;
    const credentialId = randomUUID();
    await transaction`
      INSERT INTO whatsapp_channel_credentials (
        id, tenant_id, channel_id, version, access_token_ciphertext, status, created_by_user_id, created_at
      ) VALUES (
        ${credentialId}, ${actor.tenantId}, ${channelId}, ${(current[0]?.version ?? 0) + 1},
        ${ciphertext}, 'pending', ${actor.userId}, now()
      )
    `;
    await transaction`
      UPDATE channels SET status = 'unverified', verification_evidence = '{}'::jsonb, updated_at = now()
      WHERE tenant_id = ${actor.tenantId} AND id = ${channelId}
    `;
    const operation = await insertOperation(transaction, actor, channelId, "whatsapp.channel.credential_rotate", {
      credentialVersion: (current[0]?.version ?? 0) + 1,
    });
    await writeAuditEvent({
      actor,
      action: "whatsapp.channel.credentials_rotated",
      resourceType: "channel",
      resourceId: channel.id,
      requestId: requestContext.requestId,
      metadata: { status: "pending" },
    }, transaction);
    return { status: 202, body: operation };
  });
  return result.body;
}

export async function queueChannelOperation(
  actor: ActorContext,
  channelId: string,
  operationType: "whatsapp.channel.verify" | "whatsapp.channel.templates_sync" | "whatsapp.channel.test_message" | "whatsapp.channel.delete",
  input: Record<string, unknown>,
  idempotencyKey: string,
  requestContext: RequestContext,
): Promise<QueuedChannelOperation> {
  const role = operationType === "whatsapp.channel.delete" ? ["Owner"] as const : ["Owner", "Admin"] as const;
  requireRole(actor, role);
  if (operationType !== "whatsapp.channel.delete") assertManualCloudApiConfigured();

  const result = await executeIdempotent(actor, operationType.replaceAll(".", "_"), idempotencyKey, input, async (transaction) => {
    const channel = await lockChannel(transaction, actor, channelId);
    if (channel.status === "deleted" || channel.status === "deleting") {
      throw new ApiError(409, "CHANNEL_NOT_ACTIVE", "WhatsApp channel is not available for this operation");
    }

    if (operationType === "whatsapp.channel.test_message") {
      await assertApprovedTestTemplate(transaction, actor, channelId, input.templateId);
      throw new ApiError(503, "TEST_RECIPIENT_ALLOWLIST_UNCONFIGURED", "No approved WhatsApp test-recipient allowlist is configured", { retryable: true });
    }

    if (operationType === "whatsapp.channel.delete") {
      const suppliedPhone = typeof input.confirmationPhoneNumber === "string" ? input.confirmationPhoneNumber : "";
      const config = getRuntimeConfig();
      if (!config.security.otpHmacKey) throw capabilityUnavailable();
      const suppliedHash = hmacSha256Hex(config.security.otpHmacKey, suppliedPhone);
      if (!await sameChannelPhone(transaction, channelId, actor.tenantId, suppliedHash)) {
        throw new ApiError(422, "CHANNEL_CONFIRMATION_MISMATCH", "Confirmation phone number did not match the channel");
      }
      await transaction`
        UPDATE channels SET status = 'deleting', updated_at = now()
        WHERE tenant_id = ${actor.tenantId} AND id = ${channelId}
      `;
      await transaction`
        UPDATE whatsapp_channel_credentials SET status = 'revoked', revoked_at = now()
        WHERE tenant_id = ${actor.tenantId} AND channel_id = ${channelId} AND status <> 'revoked'
      `;
    }

    const operation = await insertOperation(transaction, actor, channelId, operationType, safeOperationInput(input));
    await writeAuditEvent({
      actor,
      action: operationType.replaceAll(".", "_"),
      resourceType: "channel",
      resourceId: channelId,
      requestId: requestContext.requestId,
      metadata: { status: "queued" },
    }, transaction);
    return { status: 202, body: operation };
  });
  return result.body;
}

export async function listTemplates(
  actor: ActorContext,
  channelId: string,
  filters: { locale?: string; status?: string },
): Promise<TemplateView[]> {
  const channel = await getChannel(actor, channelId);
  const locale = filters.locale ?? null;
  const status = filters.status ?? null;
  const rows = await withDatabase((sql) => sql<TemplateRow[]>`
    SELECT id, provider_template_id, name, locale, category, status, approval_evidence, last_synced_at, updated_at
    FROM whatsapp_templates
    WHERE tenant_id = ${actor.tenantId} AND channel_id = ${channel.id}
      AND (${locale}::text IS NULL OR locale = ${locale})
      AND (${status}::text IS NULL OR status = ${status})
    ORDER BY name, locale, id
  `);
  return rows.map(toTemplateView);
}

export function assertManualCloudApiConfigured(): void {
  const config = getRuntimeConfig();
  if (!config.whatsapp.appSecret || !config.whatsapp.verifyToken
    || !config.security.credentialEncryptionKey || !config.security.otpHmacKey) {
    throw capabilityUnavailable();
  }
}

async function insertOperation(
  transaction: TransactionSql,
  actor: ActorContext,
  channelId: string,
  operationType: QueuedChannelOperation["operationType"],
  input: Record<string, unknown>,
): Promise<QueuedChannelOperation> {
  const operationId = randomUUID();
  await transaction`
    INSERT INTO operations (
      id, tenant_id, requested_by_user_id, operation_type, status, progress, input,
      created_at, updated_at
    ) VALUES (
      ${operationId}, ${actor.tenantId}, ${actor.userId}, ${operationType}, 'queued', 0,
      ${JSON.stringify({ channelId, ...input })}::jsonb, now(), now()
    )
  `;
  await transaction`
    INSERT INTO outbox_events (
      id, deduplication_key, tenant_id, event_type, aggregate_type, aggregate_id,
      payload, status, available_at, created_at, updated_at
    ) VALUES (
      ${randomUUID()}, ${`whatsapp-operation:${operationId}`}, ${actor.tenantId}, ${operationType},
      'channel', ${channelId}, ${JSON.stringify({ operationId, channelId })}::jsonb,
      'pending', now(), now(), now()
    )
  `;
  return { operationId, channelId, status: "queued", operationType };
}

async function lockChannel(
  transaction: TransactionSql,
  actor: ActorContext,
  channelId: string,
): Promise<ChannelRow> {
  const rows = await transaction<ChannelRow[]>`
    SELECT id, tenant_id, store_id, provider, phone_number_id, business_account_id,
      display_phone_last4, status, verification_evidence, last_webhook_at, created_at, updated_at
    FROM channels WHERE tenant_id = ${actor.tenantId} AND id = ${channelId} FOR UPDATE
  `;
  const channel = rows[0];
  if (!channel || (actor.role === "Agent" && !actor.storeIds.includes(channel.store_id))) throw notFound();
  return channel;
}

async function assertApprovedTestTemplate(
  transaction: TransactionSql,
  actor: ActorContext,
  channelId: string,
  templateId: unknown,
): Promise<void> {
  if (typeof templateId !== "string") {
    throw new ApiError(422, "TEMPLATE_NOT_APPROVED", "A verified approved template is required");
  }
  const rows = await transaction<{ id: string }[]>`
    SELECT id FROM whatsapp_templates
    WHERE id = ${templateId} AND tenant_id = ${actor.tenantId} AND channel_id = ${channelId} AND status = 'approved'
  `;
  if (!rows[0]) throw new ApiError(422, "TEMPLATE_NOT_APPROVED", "A verified approved template is required");
}

async function sameChannelPhone(
  transaction: TransactionSql,
  channelId: string,
  tenantId: string,
  suppliedHash: string,
): Promise<boolean> {
  const rows = await transaction<{ display_phone_hash: string }[]>`
    SELECT display_phone_hash FROM channels WHERE tenant_id = ${tenantId} AND id = ${channelId}
  `;
  const savedHash = rows[0]?.display_phone_hash;
  return savedHash ? safeEqual(savedHash, suppliedHash) : false;
}

function requireRow(row: ChannelRow | undefined): ChannelRow {
  if (!row) throw new ApiError(503, "CHANNEL_CREATE_UNAVAILABLE", "WhatsApp channel could not be created", { retryable: true });
  return row;
}

function safeOperationInput(input: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (/(?:token|secret|phone|recipient|text|message|variable)/i.test(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) safe[key] = value;
  }
  return safe;
}

function toChannelView(row: ChannelRow): ChannelView {
  return {
    id: row.id,
    storeId: row.store_id,
    provider: "whatsapp_cloud_api",
    phoneNumberId: row.phone_number_id,
    businessAccountId: row.business_account_id,
    phoneNumberMasked: `••••${row.display_phone_last4}`,
    status: row.status,
    verificationEvidence: row.verification_evidence,
    lastWebhookAt: row.last_webhook_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toTemplateView(row: TemplateRow): TemplateView {
  return {
    id: row.id,
    providerTemplateId: row.provider_template_id,
    name: row.name,
    locale: row.locale,
    category: row.category,
    status: row.status,
    approvalEvidence: row.approval_evidence,
    lastSyncedAt: row.last_synced_at?.toISOString() ?? null,
    updatedAt: row.updated_at.toISOString(),
  };
}

function notFound(): ApiError {
  return new ApiError(404, "NOT_FOUND", "WhatsApp channel was not found");
}

function capabilityUnavailable(): ApiError {
  return new ApiError(503, "CAPABILITY_UNAVAILABLE", "WhatsApp Cloud API credentials are not configured", { retryable: true });
}
