import { randomUUID } from "node:crypto";

import { z } from "zod";

import type { ActorContext } from "@/lib/server/auth/types";
import { requireRole } from "@/lib/server/auth/roles";
import { writeAuditEvent } from "@/lib/server/audit/service";
import { getRuntimeConfig } from "@/lib/server/config/env";
import { ApiError } from "@/lib/server/http/errors";
import type { RequestContext } from "@/lib/server/http/request";
import { withDatabase, withTransaction, type TransactionSql } from "@/lib/server/db/client";
import { executeIdempotent } from "@/lib/server/idempotency/service";
import { decryptSecret, encryptSecret } from "@/lib/server/security/secrets";
import { hmacSha256Hex } from "@/lib/server/security/digests";
import { mustStopAutomation } from "@/lib/server/integrations/whatsapp/invariants";

export const conversationStatusSchema = z.enum(["automated", "waiting_human", "human_active", "resolved"]);

export const conversationListQuerySchema = z.object({
  storeId: z.string().trim().min(1).max(128).optional(),
  status: conversationStatusSchema.optional(),
  assignee: z.string().trim().min(1).max(128).optional(),
  search: z.string().trim().min(1).max(64).optional(),
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();

export const messageListQuerySchema = z.object({
  before: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();

export const claimSchema = z.object({ assigneeId: z.string().min(1).max(128).optional() }).strict().default({});
export const handoffSchema = z.object({
  assigneeId: z.string().min(1).max(128),
  reason: z.string().trim().min(1).max(128),
}).strict();
export const resolveSchema = z.object({
  resolutionCode: z.string().trim().min(1).max(64),
  note: z.string().trim().max(2000).optional(),
}).strict();
export const resumeSchema = z.object({
  workflowVersionId: z.string().min(1).max(128),
  reason: z.string().trim().min(1).max(128),
}).strict();
export const createHumanMessageSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  language: z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
  templateId: z.string().uuid().optional(),
}).strict();

interface ConversationRow {
  id: string;
  tenant_id: string;
  store_id: string;
  channel_id: string;
  contact_id: string;
  status: "automated" | "waiting_human" | "human_active" | "resolved";
  assigned_to_membership_id: string | null;
  language: string | null;
  last_inbound_at: Date | null;
  service_window_expires_at: Date | null;
  last_message_at: Date | null;
  created_at: Date;
  updated_at: Date;
  phone_last4: string;
}

interface MessageRow {
  id: string;
  provider_message_id: string | null;
  direction: "inbound" | "outbound";
  message_type: string;
  status: string;
  content_ciphertext: string | null;
  translation_ciphertext: string | null;
  language: string | null;
  template_id: string | null;
  status_evidence: unknown;
  created_at: Date;
  sent_at: Date | null;
  delivered_at: Date | null;
  read_at: Date | null;
}

interface ConversationAccessRow extends ConversationRow {
  opted_out: boolean;
}

export interface ConversationView {
  id: string;
  storeId: string;
  channelId: string;
  buyer: { phoneMasked: string };
  status: ConversationRow["status"];
  assignedToMembershipId: string | null;
  language: string | null;
  serviceWindowExpiresAt: string | null;
  lastInboundAt: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessageView {
  id: string;
  providerMessageId: string | null;
  direction: "inbound" | "outbound";
  type: string;
  status: string;
  text: string | null;
  translation: string | null;
  language: string | null;
  templateId: string | null;
  statusEvidence: unknown;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
}

export type ConversationAction = "claim" | "handoff" | "resolve" | "resume";

export interface ConversationActionResult {
  conversationId: string;
  status: ConversationRow["status"];
  assignedToMembershipId: string | null;
  queued?: boolean;
}

export async function listConversations(
  actor: ActorContext,
  filters: z.output<typeof conversationListQuerySchema>,
): Promise<{ items: ConversationView[]; nextCursor: string | null; hasNextPage: boolean }> {
  const storeId = filters.storeId ?? null;
  const status = filters.status ?? null;
  const assignee = filters.assignee ?? null;
  const searchHash = filters.search ? hashPhoneSearch(filters.search) : null;
  const cursor = decodeCursor(filters.cursor);
  const rows = await withDatabase((sql) => sql<ConversationRow[]>`
    SELECT conversation.id, conversation.tenant_id, conversation.store_id, conversation.channel_id,
      conversation.contact_id, conversation.status, conversation.assigned_to_membership_id,
      conversation.language, conversation.last_inbound_at, conversation.service_window_expires_at,
      conversation.last_message_at, conversation.created_at, conversation.updated_at, contact.phone_last4
    FROM conversations conversation
    JOIN contacts contact
      ON contact.tenant_id = conversation.tenant_id
      AND contact.store_id = conversation.store_id
      AND contact.id = conversation.contact_id
    WHERE conversation.tenant_id = ${actor.tenantId}
      AND (${storeId}::text IS NULL OR conversation.store_id = ${storeId})
      AND (${status}::text IS NULL OR conversation.status = ${status})
      AND (${assignee}::text IS NULL OR conversation.assigned_to_membership_id = ${assignee})
      AND (${searchHash}::text IS NULL OR contact.phone_hash = ${searchHash})
      AND (${actor.role !== "Agent"} OR conversation.store_id = ANY(${actor.storeIds}))
      AND (${cursor === null} OR (conversation.updated_at, conversation.id) < (${cursor?.updatedAt ?? null}, ${cursor?.id ?? null}))
    ORDER BY conversation.updated_at DESC, conversation.id DESC
    LIMIT ${filters.limit + 1}
  `);
  const hasNextPage = rows.length > filters.limit;
  const pageRows = hasNextPage ? rows.slice(0, filters.limit) : rows;
  const last = pageRows.at(-1);
  return {
    items: pageRows.map(toConversationView),
    nextCursor: hasNextPage && last ? encodeCursor(last) : null,
    hasNextPage,
  };
}

export async function getConversation(actor: ActorContext, conversationId: string): Promise<ConversationView> {
  const conversation = await loadConversation(actor, conversationId);
  return toConversationView(conversation);
}

export async function listMessages(
  actor: ActorContext,
  conversationId: string,
  options: z.output<typeof messageListQuerySchema>,
): Promise<ConversationMessageView[]> {
  const conversation = await loadConversation(actor, conversationId);
  const config = getRuntimeConfig();
  const key = config.security.credentialEncryptionKey;
  if (!key) throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Conversation message encryption is not configured", { retryable: true });
  const rows = await withDatabase(async (sql) => {
    if (options.before) {
      return sql<MessageRow[]>`
        SELECT id, provider_message_id, direction, message_type, status, content_ciphertext,
          translation_ciphertext, language, template_id, status_evidence, created_at, sent_at, delivered_at, read_at
        FROM conversation_messages
        WHERE tenant_id = ${actor.tenantId} AND conversation_id = ${conversation.id}
          AND (created_at, id) < (
            SELECT created_at, id FROM conversation_messages
            WHERE tenant_id = ${actor.tenantId} AND conversation_id = ${conversation.id} AND id = ${options.before}
          )
        ORDER BY created_at DESC, id DESC LIMIT ${options.limit}
      `;
    }
    return sql<MessageRow[]>`
      SELECT id, provider_message_id, direction, message_type, status, content_ciphertext,
        translation_ciphertext, language, template_id, status_evidence, created_at, sent_at, delivered_at, read_at
      FROM conversation_messages
      WHERE tenant_id = ${actor.tenantId} AND conversation_id = ${conversation.id}
      ORDER BY created_at DESC, id DESC LIMIT ${options.limit}
    `;
  });
  return rows.map((row) => toMessageView(row, key));
}

export async function transitionConversation(
  actor: ActorContext,
  conversationId: string,
  action: ConversationAction,
  input: Record<string, unknown>,
  idempotencyKey: string,
  requestContext: RequestContext,
): Promise<ConversationActionResult> {
  requireRole(actor, action === "resume" ? ["Owner", "Admin"] : ["Owner", "Admin", "Agent"]);
  const result = await executeIdempotent(actor, `conversation.${action}`, idempotencyKey, input, async (transaction) => {
    const conversation = await lockConversation(transaction, actor, conversationId);
    assertAgentConversationAccess(actor, conversation);
    const priorStatus = conversation.status;
    let nextStatus = priorStatus;
    let assignedToMembershipId = conversation.assigned_to_membership_id;
    let queued = false;

    if (action === "claim") {
      const requestedAssignee = typeof input.assigneeId === "string" ? input.assigneeId : actor.membershipId;
      if (actor.role === "Agent" && requestedAssignee !== actor.membershipId) {
        throw new ApiError(403, "FORBIDDEN", "Agents can only claim conversations for themselves");
      }
      if (priorStatus === "human_active" && assignedToMembershipId !== requestedAssignee) {
        throw new ApiError(409, "CONVERSATION_ALREADY_CLAIMED", "Conversation is already assigned to another member");
      }
      if (priorStatus === "resolved") throw new ApiError(409, "CONVERSATION_RESOLVED", "Resolved conversations cannot be claimed");
      await assertActiveMembership(transaction, actor.tenantId, requestedAssignee);
      nextStatus = "human_active";
      assignedToMembershipId = requestedAssignee;
    } else if (action === "handoff") {
      assertCurrentHandler(actor, conversation);
      const requestedAssignee = typeof input.assigneeId === "string" ? input.assigneeId : "";
      await assertActiveMembership(transaction, actor.tenantId, requestedAssignee);
      nextStatus = "human_active";
      assignedToMembershipId = requestedAssignee;
    } else if (action === "resolve") {
      assertCurrentHandler(actor, conversation);
      nextStatus = "resolved";
      assignedToMembershipId = null;
    } else {
      if (priorStatus === "automated") {
        throw new ApiError(409, "CONVERSATION_ALREADY_RESUMED", "Conversation automation is already active");
      }
      const suppression = await transaction<{ id: string }[]>`
        SELECT id FROM suppression_entries WHERE tenant_id = ${actor.tenantId}
          AND store_id = ${conversation.store_id} AND contact_id = ${conversation.contact_id} AND revoked_at IS NULL
        LIMIT 1
      `;
      if (suppression[0]) throw new ApiError(422, "CONTACT_OPTED_OUT", "Automation cannot resume for a suppressed contact");
      const activeChannel = await transaction<{ id: string }[]>`
        SELECT id FROM channels WHERE tenant_id = ${actor.tenantId} AND id = ${conversation.channel_id} AND status = 'active'
      `;
      if (!activeChannel[0]) throw new ApiError(422, "CHANNEL_NOT_VERIFIED", "Automation requires a verified active WhatsApp channel");
      await enqueueResume(transaction, actor, conversation, input);
      nextStatus = "automated";
      assignedToMembershipId = null;
      queued = true;
    }

    if (nextStatus !== priorStatus || assignedToMembershipId !== conversation.assigned_to_membership_id) {
      const updated = await transaction<ConversationRow[]>`
        UPDATE conversations SET status = ${nextStatus}, assigned_to_membership_id = ${assignedToMembershipId},
          resolved_at = CASE WHEN ${nextStatus} = 'resolved' THEN now() ELSE NULL END, updated_at = now()
        WHERE tenant_id = ${actor.tenantId} AND id = ${conversationId}
        RETURNING id, tenant_id, store_id, channel_id, contact_id, status, assigned_to_membership_id,
          language, last_inbound_at, service_window_expires_at, last_message_at, created_at, updated_at,
          (SELECT phone_last4 FROM contacts WHERE tenant_id = conversations.tenant_id AND store_id = conversations.store_id AND id = conversations.contact_id) AS phone_last4
      `;
      const changed = updated[0];
      if (!changed) throw notFound();
      if (mustStopAutomation(nextStatus, false)) {
        await enqueueConversationStop(transaction, actor.tenantId, conversationId, action, nextStatus);
      }
      await writeConversationEvent(transaction, actor, conversation, action, input);
      await writeAuditEvent({
        actor,
        action: `conversation.${action}`,
        resourceType: "conversation",
        resourceId: conversationId,
        requestId: requestContext.requestId,
        metadata: { from: priorStatus, to: nextStatus },
      }, transaction);
    } else if (action === "resume") {
      queued = true;
    }

    return {
      status: 200,
      body: { conversationId, status: nextStatus, assignedToMembershipId, ...(queued ? { queued } : {}) },
    };
  });
  return result.body;
}

export async function createHumanMessage(
  actor: ActorContext,
  conversationId: string,
  input: z.output<typeof createHumanMessageSchema>,
): Promise<never> {
  requireRole(actor, ["Owner", "Admin", "Agent"]);
  const conversation = await withTransaction(async (transaction) => lockConversation(transaction, actor, conversationId));
  assertAgentConversationAccess(actor, conversation);
  if (actor.role === "Agent" && (conversation.status !== "human_active" || conversation.assigned_to_membership_id !== actor.membershipId)) {
    throw new ApiError(403, "FORBIDDEN", "Only the assigned agent can send a manual reply");
  }
  if ((actor.role === "Owner" || actor.role === "Admin") && conversation.status !== "human_active") {
    throw new ApiError(409, "CONVERSATION_NOT_CLAIMED", "Claim the conversation before sending a manual reply");
  }

  const eligibility = await withDatabase(async (sql) => {
    const suppression = await sql<{ id: string }[]>`
      SELECT id FROM suppression_entries WHERE tenant_id = ${actor.tenantId}
        AND store_id = ${conversation.store_id} AND contact_id = ${conversation.contact_id} AND revoked_at IS NULL
      LIMIT 1
    `;
    if (suppression[0]) throw new ApiError(422, "CONTACT_OPTED_OUT", "Messages are blocked for this opted-out contact");
    let templateCategory: string | null = null;
    if (input.templateId) {
      const templateRows = await sql<{ category: string; locale: string }[]>`
        SELECT category, locale FROM whatsapp_templates
        WHERE tenant_id = ${actor.tenantId} AND channel_id = ${conversation.channel_id}
          AND id = ${input.templateId} AND status = 'approved'
      `;
      const template = templateRows[0];
      if (!template || template.locale !== input.language) {
        throw new ApiError(422, "TEMPLATE_NOT_APPROVED", "The requested template is not approved for this language");
      }
      templateCategory = template.category;
    }
    const withinServiceWindow = conversation.service_window_expires_at !== null
      && conversation.service_window_expires_at.getTime() > Date.now();
    if (!withinServiceWindow && !input.templateId) {
      throw new ApiError(422, "SERVICE_WINDOW_CLOSED", "A free-form reply requires an open WhatsApp service window");
    }
    if (!withinServiceWindow && templateCategory) {
      if (templateCategory === "authentication") {
        throw new ApiError(422, "TEMPLATE_NOT_ALLOWED", "Authentication templates cannot be used for conversation replies");
      }
      const purpose = templateCategory === "marketing" ? "marketing" : "utility";
      const consent = await sql<{ id: string }[]>`
        SELECT id FROM consents WHERE tenant_id = ${actor.tenantId} AND store_id = ${conversation.store_id}
          AND contact_id = ${conversation.contact_id} AND purpose IN (${purpose}, 'all')
          AND revoked_at IS NULL AND granted_at <= now()
        ORDER BY granted_at DESC LIMIT 1
      `;
      if (!consent[0]) throw new ApiError(422, "CONSENT_REQUIRED", "A valid consent is required to send this template");
    }
    if (withinServiceWindow && templateCategory === "marketing") {
      const marketingConsent = await sql<{ id: string }[]>`
        SELECT id FROM consents WHERE tenant_id = ${actor.tenantId} AND store_id = ${conversation.store_id}
          AND contact_id = ${conversation.contact_id} AND purpose IN ('marketing', 'all')
          AND revoked_at IS NULL AND granted_at <= now()
        ORDER BY granted_at DESC LIMIT 1
      `;
      if (!marketingConsent[0]) throw new ApiError(422, "CONSENT_REQUIRED", "A valid marketing consent is required for this template");
    }
    return { withinServiceWindow };
  });
  void eligibility;

  const config = getRuntimeConfig();
  if (!config.whatsapp.appSecret || !config.whatsapp.verifyToken) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "WhatsApp Cloud API is not configured", { retryable: true });
  }
  throw new ApiError(503, "WHATSAPP_WORKER_UNAVAILABLE", "Manual messages are not sent because the durable WhatsApp worker is unavailable", { retryable: true });
}

async function loadConversation(actor: ActorContext, conversationId: string): Promise<ConversationAccessRow> {
  const rows = await withDatabase((sql) => sql<ConversationAccessRow[]>`
    SELECT conversation.id, conversation.tenant_id, conversation.store_id, conversation.channel_id,
      conversation.contact_id, conversation.status, conversation.assigned_to_membership_id,
      conversation.language, conversation.last_inbound_at, conversation.service_window_expires_at,
      conversation.last_message_at, conversation.created_at, conversation.updated_at, contact.phone_last4,
      EXISTS (
        SELECT 1 FROM suppression_entries suppression
        WHERE suppression.tenant_id = conversation.tenant_id AND suppression.store_id = conversation.store_id
          AND suppression.contact_id = conversation.contact_id AND suppression.revoked_at IS NULL
      ) AS opted_out
    FROM conversations conversation
    JOIN contacts contact ON contact.tenant_id = conversation.tenant_id
      AND contact.store_id = conversation.store_id AND contact.id = conversation.contact_id
    WHERE conversation.tenant_id = ${actor.tenantId} AND conversation.id = ${conversationId}
    LIMIT 1
  `);
  const conversation = rows[0];
  if (!conversation) throw notFound();
  assertAgentConversationAccess(actor, conversation);
  return conversation;
}

async function lockConversation(
  transaction: TransactionSql,
  actor: ActorContext,
  conversationId: string,
): Promise<ConversationAccessRow> {
  const rows = await transaction<ConversationAccessRow[]>`
    SELECT conversation.id, conversation.tenant_id, conversation.store_id, conversation.channel_id,
      conversation.contact_id, conversation.status, conversation.assigned_to_membership_id,
      conversation.language, conversation.last_inbound_at, conversation.service_window_expires_at,
      conversation.last_message_at, conversation.created_at, conversation.updated_at, contact.phone_last4,
      EXISTS (
        SELECT 1 FROM suppression_entries suppression
        WHERE suppression.tenant_id = conversation.tenant_id AND suppression.store_id = conversation.store_id
          AND suppression.contact_id = conversation.contact_id AND suppression.revoked_at IS NULL
      ) AS opted_out
    FROM conversations conversation
    JOIN contacts contact ON contact.tenant_id = conversation.tenant_id
      AND contact.store_id = conversation.store_id AND contact.id = conversation.contact_id
    WHERE conversation.tenant_id = ${actor.tenantId} AND conversation.id = ${conversationId}
    FOR UPDATE OF conversation
  `;
  const conversation = rows[0];
  if (!conversation) throw notFound();
  assertAgentConversationAccess(actor, conversation);
  return conversation;
}

function assertAgentConversationAccess(actor: ActorContext, conversation: Pick<ConversationRow, "store_id">): void {
  if (actor.role === "Agent" && !actor.storeIds.includes(conversation.store_id)) throw notFound();
}

function assertCurrentHandler(actor: ActorContext, conversation: ConversationRow): void {
  if (actor.role === "Agent" && conversation.assigned_to_membership_id !== actor.membershipId) {
    throw new ApiError(403, "FORBIDDEN", "Only the assigned agent can change this conversation");
  }
}

async function assertActiveMembership(transaction: TransactionSql, tenantId: string, membershipId: string): Promise<void> {
  const rows = await transaction<{ id: string; role: string }[]>`
    SELECT id, role FROM memberships
    WHERE tenant_id = ${tenantId} AND id = ${membershipId} AND status = 'active' AND revoked_at IS NULL
  `;
  if (!rows[0] || !["owner", "admin", "agent"].includes(rows[0].role)) {
    throw new ApiError(422, "INVALID_ASSIGNEE", "Assignee must be an active owner, admin, or agent");
  }
}

async function enqueueConversationStop(
  transaction: TransactionSql,
  tenantId: string,
  conversationId: string,
  action: string,
  reason: string,
): Promise<void> {
  const id = randomUUID();
  await transaction`
    INSERT INTO outbox_events (
      id, deduplication_key, tenant_id, event_type, aggregate_type, aggregate_id,
      payload, status, available_at, created_at, updated_at
    ) VALUES (
      ${id}, ${`conversation-stop:${conversationId}:${id}`}, ${tenantId}, 'conversation.automation.stop',
      'conversation', ${conversationId}, ${JSON.stringify({ conversationId, action, reason })}::jsonb,
      'pending', now(), now(), now()
    )
  `;
}

async function enqueueResume(
  transaction: TransactionSql,
  actor: ActorContext,
  conversation: ConversationRow,
  input: Record<string, unknown>,
): Promise<void> {
  const id = randomUUID();
  await transaction`
    INSERT INTO outbox_events (
      id, deduplication_key, tenant_id, event_type, aggregate_type, aggregate_id,
      payload, status, available_at, created_at, updated_at
    ) VALUES (
      ${id}, ${`conversation-resume:${id}`}, ${actor.tenantId}, 'conversation.automation.resume_requested',
      'conversation', ${conversation.id},
      ${JSON.stringify({
        conversationId: conversation.id,
        workflowVersionId: input.workflowVersionId,
        readinessRecheckRequired: true,
        doNotRescheduleExpiredTasks: true,
      })}::jsonb,
      'pending', now(), now(), now()
    )
  `;
}

async function writeConversationEvent(
  transaction: TransactionSql,
  actor: ActorContext,
  conversation: ConversationRow,
  action: ConversationAction,
  input: Record<string, unknown>,
): Promise<void> {
  const detail = JSON.stringify({
    reason: input.reason,
    resolutionCode: input.resolutionCode,
    note: input.note,
  });
  const key = getRuntimeConfig().security.credentialEncryptionKey;
  if (!key) throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Conversation event encryption is not configured", { retryable: true });
  await transaction`
    INSERT INTO conversation_events (
      id, tenant_id, store_id, conversation_id, actor_user_id, actor_membership_id,
      event_type, detail_ciphertext, created_at
    ) VALUES (
      ${randomUUID()}, ${actor.tenantId}, ${conversation.store_id}, ${conversation.id}, ${actor.userId}, ${actor.membershipId},
      ${`conversation.${action}`}, ${encryptSecret(detail, key)}, now()
    )
  `;
}

function toConversationView(row: ConversationRow): ConversationView {
  return {
    id: row.id,
    storeId: row.store_id,
    channelId: row.channel_id,
    buyer: { phoneMasked: `••••${row.phone_last4}` },
    status: row.status,
    assignedToMembershipId: row.assigned_to_membership_id,
    language: row.language,
    serviceWindowExpiresAt: row.service_window_expires_at?.toISOString() ?? null,
    lastInboundAt: row.last_inbound_at?.toISOString() ?? null,
    lastMessageAt: row.last_message_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toMessageView(row: MessageRow, key: string): ConversationMessageView {
  return {
    id: row.id,
    providerMessageId: row.provider_message_id,
    direction: row.direction,
    type: row.message_type,
    status: row.status,
    text: row.content_ciphertext ? decryptSecret(row.content_ciphertext, key) : null,
    translation: row.translation_ciphertext ? decryptSecret(row.translation_ciphertext, key) : null,
    language: row.language,
    templateId: row.template_id,
    statusEvidence: row.status_evidence,
    createdAt: row.created_at.toISOString(),
    sentAt: row.sent_at?.toISOString() ?? null,
    deliveredAt: row.delivered_at?.toISOString() ?? null,
    readAt: row.read_at?.toISOString() ?? null,
  };
}

function encodeCursor(row: ConversationRow): string {
  return Buffer.from(JSON.stringify({ updatedAt: row.updated_at.toISOString(), id: row.id }), "utf8").toString("base64url");
}

function decodeCursor(value: string | undefined): { updatedAt: string; id: string } | null {
  if (!value) return null;
  if (!/^[A-Za-z0-9_-]{1,512}$/.test(value)) throw new ApiError(400, "INVALID_CURSOR", "Conversation cursor is invalid");
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof parsed === "object" && parsed !== null && "updatedAt" in parsed && "id" in parsed
      && typeof parsed.updatedAt === "string" && !Number.isNaN(Date.parse(parsed.updatedAt))
      && typeof parsed.id === "string" && parsed.id.length > 0 && parsed.id.length <= 128) {
      return { updatedAt: new Date(parsed.updatedAt).toISOString(), id: parsed.id };
    }
  } catch {
    throw new ApiError(400, "INVALID_CURSOR", "Conversation cursor is invalid");
  }
  throw new ApiError(400, "INVALID_CURSOR", "Conversation cursor is invalid");
}

function hashPhoneSearch(search: string): string | null {
  const config = getRuntimeConfig();
  if (!config.security.otpHmacKey) throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Contact search is not configured", { retryable: true });
  const digits = search.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return hmacSha256Hex(config.security.otpHmacKey, `+${digits}`);
}

function notFound(): ApiError {
  return new ApiError(404, "NOT_FOUND", "Conversation was not found");
}
