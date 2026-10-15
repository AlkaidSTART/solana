import { getRuntimeConfig } from "@/lib/server/config/env";
import { withTransaction, type TransactionSql } from "@/lib/server/db/client";
import { ApiError } from "@/lib/server/http/errors";
import { decryptSecret } from "@/lib/server/security/secrets";

import {
  buildTemplateMessagePayload,
  buildTextMessagePayload,
  classifyGraphFailure,
  graphMessagesUrl,
  parseGraphSendResponse,
  undeterminedGraphFailure,
  type GraphFailure,
} from "./graph";

const GRAPH_REQUEST_TIMEOUT_MS = 15_000;
const MAX_GRAPH_RESPONSE_BYTES = 64 * 1024;

export type MessageSendOutcome =
  | { status: "sent"; messageId: string; providerMessageId: string; providerStatus: string | null }
  | { status: "skipped"; messageId: string; reason: "already_attempted" | "not_found" }
  | { status: "blocked"; messageId: string; reason: string }
  | { status: "failed"; messageId: string; failure: GraphFailure };

interface OutboundMessageRow {
  id: string;
  tenant_id: string;
  store_id: string;
  conversation_id: string;
  message_type: "text" | "template" | "unsupported";
  status: string;
  content_ciphertext: string | null;
  template_id: string | null;
}

interface SendContext {
  messageId: string;
  tenantId: string;
  storeId: string;
  conversationId: string;
  phoneNumberId: string;
  accessToken: string;
  recipient: string;
  payload: Record<string, unknown>;
}

/**
 * Sends an outbound message that was queued earlier. The message is claimed inside one short
 * transaction before any network call, so a crashed or restarted worker never silently resends a
 * message whose provider outcome is unknown.
 */
export async function sendQueuedMessage(messageId: string): Promise<MessageSendOutcome> {
  const claimed = await claimOutboundMessage(messageId);
  if (!("context" in claimed)) {
    return claimed.outcome;
  }

  const { context } = claimed;
  const transport = await postGraphMessage({
    phoneNumberId: context.phoneNumberId,
    accessToken: context.accessToken,
    payload: context.payload,
  });

  if (!transport.ok) {
    return finalizeFailure(context.messageId, transport.failure);
  }

  return finalizeAccepted(context.messageId, transport.messageId, transport.messageStatus);
}

export async function postGraphMessage(input: {
  phoneNumberId: string;
  accessToken: string;
  payload: Record<string, unknown>;
}): Promise<{ ok: true; messageId: string; messageStatus: string | null } | { ok: false; failure: GraphFailure }> {
  const config = getRuntimeConfig();
  const version = config.whatsapp.graphApiVersion;
  if (!version) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "WhatsApp Graph API version is not configured", { retryable: true });
  }

  const url = graphMessagesUrl(version, input.phoneNumberId);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input.payload),
      signal: AbortSignal.timeout(GRAPH_REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    return { ok: false, failure: undeterminedGraphFailure(describeTransportError(error)) };
  }

  const body = await readBoundedJson(response);

  if (!response.ok) {
    return { ok: false, failure: classifyGraphFailure(response.status, body) };
  }

  const parsed = parseGraphSendResponse(body);
  if (!parsed) {
    return { ok: false, failure: undeterminedGraphFailure("WhatsApp accepted the request without returning a message ID") };
  }

  return { ok: true, messageId: parsed.messageId, messageStatus: parsed.messageStatus };
}

async function claimOutboundMessage(
  messageId: string,
): Promise<{ context: SendContext } | { outcome: MessageSendOutcome }> {
  return withTransaction(async (transaction) => {
    const rows = await transaction<OutboundMessageRow[]>`
      SELECT id, tenant_id, store_id, conversation_id, message_type, status, content_ciphertext, template_id
      FROM conversation_messages
      WHERE id = ${messageId} AND direction = 'outbound'
      FOR UPDATE
    `;
    const message = rows[0];
    if (!message) {
      return { outcome: { status: "skipped", messageId, reason: "not_found" } } as const;
    }
    if (message.status !== "queued") {
      return { outcome: { status: "skipped", messageId, reason: "already_attempted" } } as const;
    }

    const blocked = await findBlockingReason(transaction, message);
    if (blocked) {
      await markMessageFailed(transaction, message.id, blocked);
      return { outcome: { status: "blocked", messageId, reason: blocked } } as const;
    }

    const context = await buildSendContext(transaction, message);
    if (typeof context === "string") {
      await markMessageFailed(transaction, message.id, context);
      return { outcome: { status: "blocked", messageId, reason: context } } as const;
    }

    await transaction`
      UPDATE conversation_messages
      SET status = 'unknown',
        status_evidence = status_evidence || ${JSON.stringify({ sendAttempt: { state: "in_flight" } })}::jsonb,
        updated_at = now()
      WHERE id = ${message.id} AND tenant_id = ${message.tenant_id}
    `;

    return { context } as const;
  });
}

async function findBlockingReason(
  transaction: TransactionSql,
  message: OutboundMessageRow,
): Promise<string | null> {
  const conversationRows = await transaction<{ contact_id: string; channel_id: string }[]>`
    SELECT contact_id, channel_id FROM conversations
    WHERE tenant_id = ${message.tenant_id} AND id = ${message.conversation_id}
  `;
  const conversation = conversationRows[0];
  if (!conversation) {
    return "conversation_missing";
  }

  const suppressionRows = await transaction<{ id: string }[]>`
    SELECT id FROM suppression_entries
    WHERE tenant_id = ${message.tenant_id} AND store_id = ${message.store_id}
      AND contact_id = ${conversation.contact_id} AND revoked_at IS NULL
    LIMIT 1
  `;
  if (suppressionRows[0]) {
    return "contact_opted_out";
  }

  const channelRows = await transaction<{ status: string }[]>`
    SELECT status FROM channels WHERE tenant_id = ${message.tenant_id} AND id = ${conversation.channel_id}
  `;
  const channel = channelRows[0];
  if (!channel) {
    return "channel_missing";
  }
  if (channel.status !== "active") {
    return "channel_not_active";
  }

  return null;
}

async function buildSendContext(
  transaction: TransactionSql,
  message: OutboundMessageRow,
): Promise<SendContext | string> {
  const config = getRuntimeConfig();
  const encryptionKey = config.security.credentialEncryptionKey;
  if (!encryptionKey) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "WhatsApp message encryption is not configured", { retryable: true });
  }

  const rows = await transaction<{
    phone_number_id: string;
    access_token_ciphertext: string;
    phone_ciphertext: string;
    template_name: string | null;
    template_locale: string | null;
    template_status: string | null;
  }[]>`
    SELECT channel.phone_number_id,
      credential.access_token_ciphertext,
      contact.phone_ciphertext,
      template.name AS template_name,
      template.locale AS template_locale,
      template.status AS template_status
    FROM conversations conversation
    JOIN channels channel
      ON channel.tenant_id = conversation.tenant_id AND channel.id = conversation.channel_id
    JOIN contacts contact
      ON contact.tenant_id = conversation.tenant_id AND contact.store_id = conversation.store_id
      AND contact.id = conversation.contact_id
    JOIN whatsapp_channel_credentials credential
      ON credential.tenant_id = channel.tenant_id AND credential.channel_id = channel.id
      AND credential.status = 'active'
    LEFT JOIN whatsapp_templates template
      ON template.tenant_id = ${message.tenant_id} AND template.id = ${message.template_id}
    WHERE conversation.tenant_id = ${message.tenant_id} AND conversation.id = ${message.conversation_id}
    ORDER BY credential.version DESC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    return "channel_credentials_missing";
  }

  const recipient = decryptSecret(row.phone_ciphertext, encryptionKey);
  const accessToken = decryptSecret(row.access_token_ciphertext, encryptionKey);

  if (message.message_type === "template") {
    if (!row.template_name || !row.template_locale) {
      return "template_missing";
    }
    if (row.template_status !== "approved") {
      return "template_not_approved";
    }

    return {
      messageId: message.id,
      tenantId: message.tenant_id,
      storeId: message.store_id,
      conversationId: message.conversation_id,
      phoneNumberId: row.phone_number_id,
      accessToken,
      recipient,
      payload: buildTemplateMessagePayload({
        to: recipient,
        templateName: row.template_name,
        languageCode: row.template_locale,
      }),
    };
  }

  if (message.message_type !== "text" || !message.content_ciphertext) {
    return "unsupported_message_type";
  }

  return {
    messageId: message.id,
    tenantId: message.tenant_id,
    storeId: message.store_id,
    conversationId: message.conversation_id,
    phoneNumberId: row.phone_number_id,
    accessToken,
    recipient,
    payload: buildTextMessagePayload({
      to: recipient,
      body: decryptSecret(message.content_ciphertext, encryptionKey),
    }),
  };
}

async function finalizeAccepted(
  messageId: string,
  providerMessageId: string,
  providerStatus: string | null,
): Promise<MessageSendOutcome> {
  await withTransaction(async (transaction) => {
    await transaction`
      UPDATE conversation_messages
      SET status = 'accepted',
        provider_message_id = ${providerMessageId},
        status_evidence = status_evidence || ${JSON.stringify({
          provider: "whatsapp_cloud_api",
          acceptedAt: new Date().toISOString(),
          providerStatus,
        })}::jsonb,
        updated_at = now()
      WHERE id = ${messageId} AND direction = 'outbound'
    `;
    await transaction`
      UPDATE conversations SET last_message_at = now(), updated_at = now()
      WHERE id = (SELECT conversation_id FROM conversation_messages WHERE id = ${messageId})
    `;
  });

  return { status: "sent", messageId, providerMessageId, providerStatus };
}

async function finalizeFailure(messageId: string, failure: GraphFailure): Promise<MessageSendOutcome> {
  await withTransaction(async (transaction) => {
    if (failure.classification === "retryable") {
      // The provider documented this failure as transient and rejected the request, so the message may
      // safely return to the queue for another attempt.
      await transaction`
        UPDATE conversation_messages
        SET status = 'queued',
          status_evidence = status_evidence || ${JSON.stringify({ lastFailure: failure })}::jsonb,
          updated_at = now()
        WHERE id = ${messageId} AND direction = 'outbound'
      `;
      return;
    }

    const status = failure.classification === "unknown" ? "unknown" : "failed";
    await transaction`
      UPDATE conversation_messages
      SET status = ${status},
        status_evidence = status_evidence || ${JSON.stringify({ lastFailure: failure })}::jsonb,
        updated_at = now()
      WHERE id = ${messageId} AND direction = 'outbound'
    `;
  });

  return { status: "failed", messageId, failure };
}

async function markMessageFailed(transaction: TransactionSql, messageId: string, reason: string): Promise<void> {
  await transaction`
    UPDATE conversation_messages
    SET status = 'failed',
      status_evidence = status_evidence || ${JSON.stringify({ blockedReason: reason })}::jsonb,
      updated_at = now()
    WHERE id = ${messageId} AND direction = 'outbound'
  `;
}

async function readBoundedJson(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (text.length === 0 || text.length > MAX_GRAPH_RESPONSE_BYTES) {
      return null;
    }
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function describeTransportError(error: unknown): string {
  if (error instanceof Error && error.name === "TimeoutError") {
    return "WhatsApp did not answer within the request timeout";
  }
  if (error instanceof Error && error.name === "AbortError") {
    return "WhatsApp request was aborted";
  }

  return "WhatsApp request failed before a response was received";
}
