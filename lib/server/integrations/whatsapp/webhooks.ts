import { randomUUID } from "node:crypto";

import { z } from "zod";

import { getRuntimeConfig } from "@/lib/server/config/env";
import { ApiError } from "@/lib/server/http/errors";
import type { RequestContext } from "@/lib/server/http/request";
import { withTransaction, type TransactionSql } from "@/lib/server/db/client";
import { encryptSecret } from "@/lib/server/security/secrets";
import { canonicalJsonDigest, hmacSha256Hex, safeEqual } from "@/lib/server/security/digests";
import { advanceMessageStatus, classifyWebhookReplay, isOptOutMessage, mustStopAutomation, verifyWebhookSignature } from "./invariants";

const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;
const messageSchema = z.object({
  id: z.string().min(1).max(512),
  from: z.string().min(5).max(32),
  timestamp: z.string().regex(/^\d{1,16}$/),
  type: z.string().min(1).max(64),
  text: z.object({ body: z.string().max(32_768) }).passthrough().optional(),
}).passthrough();
const statusSchema = z.object({
  id: z.string().min(1).max(512),
  status: z.enum(["sent", "delivered", "read", "failed"]),
  timestamp: z.string().regex(/^\d{1,16}$/),
  recipient_id: z.string().min(1).max(32).optional(),
}).passthrough();
const webhookPayloadSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(z.object({
    changes: z.array(z.object({
      field: z.string().min(1).max(128),
      value: z.object({
        metadata: z.object({ phone_number_id: z.string().min(1).max(128) }).passthrough(),
        messages: z.array(messageSchema).max(100).optional(),
        statuses: z.array(statusSchema).max(100).optional(),
      }).passthrough(),
    }).passthrough()).max(100),
  }).passthrough()).max(100),
}).passthrough();

type WebhookPayload = z.output<typeof webhookPayloadSchema>;
type EventPayload = Record<string, unknown>;

interface ProviderEvent {
  phoneNumberId: string;
  providerEventId: string;
  eventType: string;
  payload: EventPayload;
  occurredAt: Date | null;
  message?: z.output<typeof messageSchema>;
  status?: z.output<typeof statusSchema>;
}

interface ChannelRouteRow {
  id: string;
  tenant_id: string;
  store_id: string;
}

interface ConversationRow {
  id: string;
  status: "automated" | "waiting_human" | "human_active" | "resolved";
  assigned_to_membership_id: string | null;
}

interface StoredMessageStatusRow {
  id: string;
  status: "received" | "queued" | "unknown" | "accepted" | "sent" | "delivered" | "read" | "failed";
}

export function verifyWebhookChallenge(url: URL): string {
  const config = getRuntimeConfig();
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (!config.whatsapp.verifyToken) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "WhatsApp webhook verification is not configured", { retryable: true });
  }
  if (mode !== "subscribe" || !token || !safeEqual(token, config.whatsapp.verifyToken)
    || !challenge || challenge.length > 256 || /[\u0000-\u001f\u007f]/.test(challenge)) {
    throw new ApiError(403, "WEBHOOK_VERIFICATION_FAILED", "WhatsApp webhook verification failed");
  }
  return challenge;
}

export async function ingestWebhook(
  rawBody: Uint8Array,
  signature: string | null,
  requestContext: RequestContext,
): Promise<{ duplicateCount: number; eventCount: number; conflictEventId: string | null }> {
  if (rawBody.byteLength > MAX_WEBHOOK_BODY_BYTES) {
    throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Webhook body exceeds the allowed size");
  }
  const config = getRuntimeConfig();
  const appSecret = config.whatsapp.appSecret;
  if (!appSecret) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "WhatsApp App Secret is not configured", { retryable: true });
  }
  if (!verifyWebhookSignature(rawBody, signature, appSecret)) {
    throw new ApiError(401, "INVALID_WEBHOOK_SIGNATURE", "WhatsApp webhook signature is invalid");
  }
  const encryptionKey = config.security.credentialEncryptionKey;
  const phoneHashKey = config.security.otpHmacKey;
  if (!encryptionKey || !phoneHashKey) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Webhook data protection is not configured", { retryable: true });
  }

  let payload: WebhookPayload;
  try {
    const decoded: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(rawBody));
    const parsed = webhookPayloadSchema.safeParse(decoded);
    if (!parsed.success) throw new Error("invalid");
    payload = parsed.data;
  } catch {
    throw new ApiError(400, "INVALID_WEBHOOK_PAYLOAD", "WhatsApp webhook payload is invalid");
  }

  const events = extractEvents(payload);
  if (events.length === 0) {
    throw new ApiError(400, "INVALID_WEBHOOK_PAYLOAD", "WhatsApp webhook payload contains no events");
  }
  const outcome = await withTransaction(async (transaction) => {
    let duplicateCount = 0;
    let conflictEventId: string | null = null;
    for (const event of events) {
      const channelRows = await transaction<ChannelRouteRow[]>`
        SELECT id, tenant_id, store_id FROM channels
        WHERE phone_number_id = ${event.phoneNumberId} AND status NOT IN ('deleting', 'deleted')
        LIMIT 1
      `;
      const channel = channelRows[0];
      if (!channel) {
        throw new ApiError(404, "WEBHOOK_ASSET_NOT_FOUND", "WhatsApp webhook asset was not found");
      }

      const digest = canonicalJsonDigest(event.payload);
      const eventId = randomUUID();
      const inserted = await transaction<{ id: string }[]>`
        INSERT INTO whatsapp_webhook_events (
          id, tenant_id, channel_id, provider_event_id, event_type, payload_digest,
          payload_ciphertext, status, occurred_at, received_at
        ) VALUES (
          ${eventId}, ${channel.tenant_id}, ${channel.id}, ${event.providerEventId}, ${event.eventType},
          ${digest}, ${encryptSecret(JSON.stringify(event.payload), encryptionKey)}, 'received', ${event.occurredAt?.toISOString() ?? null}, now()
        )
        ON CONFLICT (channel_id, provider_event_id) DO NOTHING
        RETURNING id
      `;
      if (!inserted[0]) {
        const existingRows = await transaction<{ id: string; payload_digest: string }[]>`
          SELECT id, payload_digest FROM whatsapp_webhook_events
          WHERE channel_id = ${channel.id} AND provider_event_id = ${event.providerEventId}
          FOR UPDATE
        `;
        const existing = existingRows[0];
        if (!existing) {
          throw new ApiError(503, "WEBHOOK_STATE_UNAVAILABLE", "Webhook event state could not be resolved", { retryable: true });
        }
        if (classifyWebhookReplay(existing.payload_digest, digest) === "conflict") {
          await transaction`
            UPDATE whatsapp_webhook_events SET status = 'conflict', error_code = 'EVENT_ID_PAYLOAD_MISMATCH'
            WHERE id = ${existing.id}
          `;
          conflictEventId ??= event.providerEventId;
        } else {
          duplicateCount += 1;
        }
        continue;
      }

      if (event.message) {
        await persistInboundMessage(transaction, channel, event, phoneHashKey, encryptionKey, requestContext);
      } else if (event.status) {
        await advanceStoredMessageStatus(transaction, channel, event.status, event.occurredAt);
      }
      await transaction`
        UPDATE whatsapp_webhook_events SET status = 'processed', processed_at = now()
        WHERE id = ${eventId}
      `;
      await transaction`
        UPDATE channels SET last_webhook_at = now(), updated_at = now()
        WHERE tenant_id = ${channel.tenant_id} AND id = ${channel.id}
      `;
    }
    return { duplicateCount, conflictEventId };
  });

  return { ...outcome, eventCount: events.length };
}

function extractEvents(payload: WebhookPayload): ProviderEvent[] {
  const events: ProviderEvent[] = [];
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const phoneNumberId = change.value.metadata.phone_number_id;
      for (const message of change.value.messages ?? []) {
        events.push({
          phoneNumberId,
          providerEventId: `message:${message.id}`,
          eventType: "message.inbound",
          payload: message as EventPayload,
          occurredAt: unixSecondsToDate(message.timestamp),
          message,
        });
      }
      for (const status of change.value.statuses ?? []) {
        events.push({
          phoneNumberId,
          providerEventId: `status:${status.id}:${status.status}:${status.timestamp}`,
          eventType: `message.status.${status.status}`,
          payload: status as EventPayload,
          occurredAt: unixSecondsToDate(status.timestamp),
          status,
        });
      }
      if (!(change.value.messages?.length) && !(change.value.statuses?.length)) {
        const digest = canonicalJsonDigest(change.value);
        events.push({
          phoneNumberId,
          providerEventId: `change:${change.field}:${digest}`,
          eventType: `provider.${change.field}`,
          payload: change.value as EventPayload,
          occurredAt: null,
        });
      }
    }
  }
  return events;
}

async function persistInboundMessage(
  transaction: TransactionSql,
  channel: ChannelRouteRow,
  event: ProviderEvent,
  phoneHashKey: string,
  encryptionKey: string,
  requestContext: RequestContext,
): Promise<void> {
  const message = event.message;
  if (!message) return;
  const phone = normalizeWhatsappPhone(message.from);
  if (!phone) throw new ApiError(422, "INVALID_BUYER_CONTACT", "Inbound WhatsApp contact is invalid");
  const phoneHash = hmacSha256Hex(phoneHashKey, phone);
  const phoneCiphertext = encryptSecret(phone, encryptionKey);
  const contactRows = await transaction<{ id: string }[]>`
    INSERT INTO contacts (
      id, tenant_id, store_id, phone_hash, phone_ciphertext, phone_last4, created_at, updated_at
    ) VALUES (
      ${randomUUID()}, ${channel.tenant_id}, ${channel.store_id}, ${phoneHash}, ${phoneCiphertext}, ${phone.slice(-4)}, now(), now()
    )
    ON CONFLICT (tenant_id, store_id, phone_hash) DO UPDATE SET updated_at = now()
    RETURNING id
  `;
  const contactId = contactRows[0]?.id;
  if (!contactId) throw new ApiError(503, "CONTACT_UNAVAILABLE", "Inbound contact could not be saved", { retryable: true });

  const existingConversationRows = await transaction<ConversationRow[]>`
    SELECT id, status, assigned_to_membership_id FROM conversations
    WHERE tenant_id = ${channel.tenant_id} AND channel_id = ${channel.id} AND contact_id = ${contactId}
      AND status <> 'resolved'
    FOR UPDATE
  `;
  const providerAt = event.occurredAt?.toISOString() ?? new Date().toISOString();
  const suppressionRows = await transaction<{ id: string }[]>`
    SELECT id FROM suppression_entries
    WHERE tenant_id = ${channel.tenant_id} AND store_id = ${channel.store_id} AND contact_id = ${contactId}
      AND revoked_at IS NULL
    LIMIT 1
  `;
  const optedOut = suppressionRows.length > 0;
  let conversation = existingConversationRows[0];
  if (!conversation) {
    const created = await transaction<ConversationRow[]>`
      INSERT INTO conversations (
        id, tenant_id, store_id, channel_id, contact_id, status, last_inbound_at,
        service_window_expires_at, last_message_at, created_at, updated_at
      ) VALUES (
        ${randomUUID()}, ${channel.tenant_id}, ${channel.store_id}, ${channel.id}, ${contactId},
        ${optedOut ? "waiting_human" : "automated"}, ${providerAt},
        ${new Date(new Date(providerAt).getTime() + 24 * 60 * 60 * 1000).toISOString()},
        ${providerAt}, now(), now()
      )
      ON CONFLICT (tenant_id, channel_id, contact_id) WHERE status <> 'resolved' DO NOTHING
      RETURNING id, status, assigned_to_membership_id
    `;
    conversation = created[0];
    if (!conversation) {
      const raced = await transaction<ConversationRow[]>`
        SELECT id, status, assigned_to_membership_id FROM conversations
        WHERE tenant_id = ${channel.tenant_id} AND channel_id = ${channel.id} AND contact_id = ${contactId}
          AND status <> 'resolved'
        FOR UPDATE
      `;
      conversation = raced[0];
    }
  }
  if (!conversation) throw new ApiError(503, "CONVERSATION_UNAVAILABLE", "Conversation could not be saved", { retryable: true });

  const updatedConversation = await transaction<ConversationRow[]>`
    UPDATE conversations SET
      last_inbound_at = greatest(coalesce(last_inbound_at, ${providerAt}), ${providerAt}),
      service_window_expires_at = greatest(coalesce(service_window_expires_at, ${providerAt}::timestamptz), ${providerAt}::timestamptz + interval '24 hours'),
      last_message_at = greatest(coalesce(last_message_at, ${providerAt}), ${providerAt}),
      status = CASE WHEN ${optedOut} AND status = 'automated' THEN 'waiting_human' ELSE status END,
      updated_at = now()
    WHERE tenant_id = ${channel.tenant_id} AND id = ${conversation.id}
    RETURNING id, status, assigned_to_membership_id
  `;
  conversation = updatedConversation[0] ?? conversation;
  const content = message.type === "text" ? message.text?.body ?? null : null;
  await transaction`
    INSERT INTO conversation_messages (
      id, tenant_id, store_id, conversation_id, provider_message_id, direction, message_type,
      status, content_ciphertext, language, status_evidence, created_at, updated_at
    ) VALUES (
      ${randomUUID()}, ${channel.tenant_id}, ${channel.store_id}, ${conversation.id}, ${message.id},
      'inbound', ${message.type === "text" ? "text" : "unsupported"}, 'received',
      ${content === null ? null : encryptSecret(content, encryptionKey)}, null,
      ${JSON.stringify({ provider: "whatsapp_cloud_api", receivedAt: requestContext.serverTime })}::jsonb,
      ${providerAt}, now()
    )
    ON CONFLICT (tenant_id, provider_message_id) WHERE provider_message_id IS NOT NULL DO NOTHING
  `;

  if (content && isOptOutMessage(content)) {
    await transaction`
      INSERT INTO suppression_entries (
        id, tenant_id, store_id, contact_id, reason, source, created_at
      ) VALUES (
        ${randomUUID()}, ${channel.tenant_id}, ${channel.store_id}, ${contactId}, 'opt_out', 'whatsapp_inbound', ${providerAt}
      ) ON CONFLICT (tenant_id, store_id, contact_id) WHERE revoked_at IS NULL DO NOTHING
    `;
    await transaction`
      UPDATE consents SET revoked_at = coalesce(revoked_at, ${providerAt})
      WHERE tenant_id = ${channel.tenant_id} AND store_id = ${channel.store_id} AND contact_id = ${contactId}
        AND purpose IN ('marketing', 'utility', 'all') AND revoked_at IS NULL
    `;
    await transaction`
      UPDATE conversations SET status = CASE WHEN status = 'automated' THEN 'waiting_human' ELSE status END,
        updated_at = now()
      WHERE tenant_id = ${channel.tenant_id} AND id = ${conversation.id}
    `;
    await transaction`
      INSERT INTO outbox_events (
        id, deduplication_key, tenant_id, event_type, aggregate_type, aggregate_id, payload,
        status, available_at, created_at, updated_at
      ) VALUES (
        ${randomUUID()}, ${`whatsapp-optout:${event.providerEventId}`}, ${channel.tenant_id},
        'conversation.automation.stop', 'conversation', ${conversation.id},
        ${JSON.stringify({ conversationId: conversation.id, reason: "opt_out" })}::jsonb,
        'pending', now(), now(), now()
      ) ON CONFLICT (deduplication_key) DO NOTHING
    `;
    await transaction`
      INSERT INTO audit_events (
        id, tenant_id, actor_user_id, action, resource_type, resource_id, request_id, metadata, created_at
      ) VALUES (
        ${randomUUID()}, ${channel.tenant_id}, NULL, 'conversation.contact_opted_out', 'conversation',
        ${conversation.id}, ${requestContext.requestId}, ${JSON.stringify({ source: "whatsapp_inbound" })}::jsonb,
        now()
      )
    `;
  } else if (mustStopAutomation(conversation.status, optedOut)) {
    await enqueueConversationStop(transaction, channel.tenant_id, conversation.id, event.providerEventId, optedOut ? "opt_out" : conversation.status);
  }
}

async function advanceStoredMessageStatus(
  transaction: TransactionSql,
  channel: ChannelRouteRow,
  statusEvent: z.output<typeof statusSchema>,
  occurredAt: Date | null,
): Promise<void> {
  const rows = await transaction<StoredMessageStatusRow[]>`
    SELECT message.id, message.status
    FROM conversation_messages message
    JOIN conversations conversation
      ON conversation.tenant_id = message.tenant_id
      AND conversation.store_id = message.store_id
      AND conversation.id = message.conversation_id
    WHERE message.tenant_id = ${channel.tenant_id}
      AND conversation.channel_id = ${channel.id}
      AND message.direction = 'outbound'
      AND message.provider_message_id = ${statusEvent.id}
    FOR UPDATE OF message
  `;
  const message = rows[0];
  if (!message) return;
  const incoming = statusEvent.status;
  const next = advanceMessageStatus(message.status, incoming);
  if (next === message.status) return;
  const providerAt = occurredAt?.toISOString() ?? new Date().toISOString();
  await transaction`
    UPDATE conversation_messages SET
      status = ${next},
      sent_at = CASE WHEN ${next} IN ('sent', 'delivered', 'read') THEN coalesce(sent_at, ${providerAt}) ELSE sent_at END,
      delivered_at = CASE WHEN ${next} IN ('delivered', 'read') THEN coalesce(delivered_at, ${providerAt}) ELSE delivered_at END,
      read_at = CASE WHEN ${next} = 'read' THEN coalesce(read_at, ${providerAt}) ELSE read_at END,
      status_evidence = status_evidence || ${JSON.stringify({ provider: "whatsapp_cloud_api", lastStatusAt: providerAt })}::jsonb,
      updated_at = now()
    WHERE id = ${message.id} AND tenant_id = ${channel.tenant_id}
  `;
}

async function enqueueConversationStop(
  transaction: TransactionSql,
  tenantId: string,
  conversationId: string,
  eventId: string,
  reason: string,
): Promise<void> {
  await transaction`
    INSERT INTO outbox_events (
      id, deduplication_key, tenant_id, event_type, aggregate_type, aggregate_id, payload,
      status, available_at, created_at, updated_at
    ) VALUES (
      ${randomUUID()}, ${`whatsapp-conversation-stop:${eventId}`}, ${tenantId},
      'conversation.automation.stop', 'conversation', ${conversationId},
      ${JSON.stringify({ conversationId, reason })}::jsonb, 'pending', now(), now(), now()
    ) ON CONFLICT (deduplication_key) DO NOTHING
  `;
}

function normalizeWhatsappPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{8,15}$/.test(digits) || digits.startsWith("0")) return null;
  return `+${digits}`;
}

function unixSecondsToDate(value: string): Date | null {
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds) || seconds < 0) return null;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}
