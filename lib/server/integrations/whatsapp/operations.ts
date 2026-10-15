import { getRuntimeConfig } from "@/lib/server/config/env";
import { withDatabase, withTransaction } from "@/lib/server/db/client";
import { hmacSha256Hex } from "@/lib/server/security/digests";
import { decryptSecret } from "@/lib/server/security/secrets";

import { buildTemplateMessagePayload } from "./graph";
import { postGraphMessage, sendQueuedMessage, type MessageSendOutcome } from "./send";
import { applyTemplateSync, fetchGraphTemplates } from "./templates";
import { fetchPhoneNumberVerification } from "./verify";

const CLAIM_BATCH_SIZE = 5;
const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_SECONDS = 30;
const MAX_BACKOFF_SECONDS = 30 * 60;

export const WHATSAPP_OUTBOX_EVENT_PREFIX = "whatsapp.";

type ExecutionOutcome =
  | { state: "succeeded"; result: Record<string, unknown> }
  | { state: "retryable"; errorCode: string }
  | { state: "failed"; errorCode: string };

export interface WorkerRunSummary {
  claimed: number;
  succeeded: number;
  retried: number;
  failed: number;
}

interface ClaimedOutboxEvent {
  id: string;
  tenantId: string | null;
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  attemptCount: number;
}

interface OperationRow {
  id: string;
  tenant_id: string | null;
  operation_type: string;
  status: string;
  input: Record<string, unknown>;
}

interface ChannelCredentialRow {
  phone_number_id: string;
  business_account_id: string;
  channel_status: string;
  credential_id: string | null;
  credential_status: string | null;
  access_token_ciphertext: string | null;
}

interface TemplateRow {
  name: string;
  locale: string;
  status: string;
}

export async function runWhatsAppWorkerOnce(limit = CLAIM_BATCH_SIZE): Promise<WorkerRunSummary> {
  const summary: WorkerRunSummary = { claimed: 0, succeeded: 0, retried: 0, failed: 0 };
  const events = await claimOutboxEvents(limit);
  summary.claimed = events.length;

  for (const event of events) {
    const outcome = await processOutboxEvent(event);
    if (outcome.state === "succeeded") summary.succeeded += 1;
    else if (outcome.state === "retryable") summary.retried += 1;
    else summary.failed += 1;
  }

  return summary;
}

async function claimOutboxEvents(limit: number): Promise<ClaimedOutboxEvent[]> {
  return withTransaction(async (transaction) => {
    const rows = await transaction<{
      id: string;
      tenant_id: string | null;
      event_type: string;
      aggregate_id: string;
      payload: Record<string, unknown>;
      attempt_count: number;
    }[]>`
      WITH claimed AS (
        SELECT id FROM outbox_events
        WHERE status IN ('pending', 'failed')
          AND available_at <= now()
          AND event_type LIKE ${`${WHATSAPP_OUTBOX_EVENT_PREFIX}%`}
        ORDER BY available_at, created_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE outbox_events destination
      SET status = 'processing', locked_at = now(), attempt_count = destination.attempt_count + 1, updated_at = now()
      FROM claimed
      WHERE destination.id = claimed.id
      RETURNING destination.id, destination.tenant_id, destination.event_type,
        destination.aggregate_id, destination.payload, destination.attempt_count
    `;

    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      eventType: row.event_type,
      aggregateId: row.aggregate_id,
      payload: row.payload,
      attemptCount: row.attempt_count,
    }));
  });
}

async function processOutboxEvent(event: ClaimedOutboxEvent): Promise<ExecutionOutcome> {
  const operationId = readIdentifier(event.payload, "operationId");
  if (!operationId) {
    await settleEvent(event, null, { state: "failed", errorCode: "OPERATION_REFERENCE_MISSING" });
    return { state: "failed", errorCode: "OPERATION_REFERENCE_MISSING" };
  }

  const operation = await loadOperation(operationId);
  if (!operation) {
    const outcome: ExecutionOutcome = { state: "failed", errorCode: "OPERATION_NOT_FOUND" };
    await settleEvent(event, null, outcome);
    return outcome;
  }

  if (operation.status === "succeeded" || operation.status === "cancelled") {
    const outcome: ExecutionOutcome = { state: "succeeded", result: { alreadyProcessed: true } };
    await settleEvent(event, operation, outcome);
    return outcome;
  }

  let outcome: ExecutionOutcome;
  try {
    outcome = await executeOperation(operation);
  } catch {
    outcome = { state: "retryable", errorCode: "WORKER_EXECUTION_FAILED" };
  }

  await settleEvent(event, operation, outcome);
  return outcome;
}

async function executeOperation(operation: OperationRow): Promise<ExecutionOutcome> {
  switch (operation.operation_type) {
    case "whatsapp.channel.verify":
      return verifyChannel(operation);
    case "whatsapp.channel.templates_sync":
      return syncTemplates(operation);
    case "whatsapp.channel.test_message":
      return sendTestMessage(operation);
    case "whatsapp.channel.delete":
      return deleteChannel(operation);
    case "whatsapp.message.send":
      return sendMessage(operation);
    default:
      return { state: "failed", errorCode: "UNSUPPORTED_OPERATION_TYPE" };
  }
}

async function verifyChannel(operation: OperationRow): Promise<ExecutionOutcome> {
  const channelId = readIdentifier(operation.input, "channelId");
  const tenantId = operation.tenant_id;
  if (!channelId || !tenantId) {
    return { state: "failed", errorCode: "INVALID_OPERATION_INPUT" };
  }

  const credential = await loadChannelCredential(tenantId, channelId);
  if (!credential) {
    return { state: "failed", errorCode: "CHANNEL_NOT_FOUND" };
  }
  if (credential.channel_status === "deleting" || credential.channel_status === "deleted") {
    return { state: "failed", errorCode: "CHANNEL_NOT_ACTIVE" };
  }
  if (!credential.access_token_ciphertext) {
    return { state: "failed", errorCode: "CHANNEL_CREDENTIALS_MISSING" };
  }

  const accessToken = decryptCredential(credential.access_token_ciphertext);
  const result = await fetchPhoneNumberVerification({
    phoneNumberId: credential.phone_number_id,
    accessToken,
  });

  if (!result.ok) {
    await recordVerificationFailure(tenantId, channelId, result.failure);
    if (result.failure.classification === "retryable") {
      return { state: "retryable", errorCode: graphErrorCode("VERIFY", result.failure.code) };
    }
    return { state: "failed", errorCode: graphErrorCode("VERIFY", result.failure.code) };
  }

  const verified = result.verification;
  await withTransaction(async (transaction) => {
    if (credential.credential_id && credential.credential_status === "pending") {
      await transaction`
        UPDATE whatsapp_channel_credentials
        SET status = 'active', activated_at = now()
        WHERE id = ${credential.credential_id} AND tenant_id = ${tenantId} AND status = 'pending'
      `;
    }
    await transaction`
      UPDATE channels
      SET status = 'active',
        verification_evidence = ${JSON.stringify({
          status: "active",
          verifiedAt: new Date().toISOString(),
          providerAssetId: verified.providerAssetId,
          verifiedName: verified.verifiedName,
          qualityRating: verified.qualityRating,
          platformType: verified.platformType,
          checks: ["asset_readable", "credential_accepted"],
        })}::jsonb,
        updated_at = now()
      WHERE tenant_id = ${tenantId} AND id = ${channelId}
    `;
  });

  return { state: "succeeded", result: { channelId, status: "active" } };
}

async function syncTemplates(operation: OperationRow): Promise<ExecutionOutcome> {
  const channelId = readIdentifier(operation.input, "channelId");
  const tenantId = operation.tenant_id;
  if (!channelId || !tenantId) {
    return { state: "failed", errorCode: "INVALID_OPERATION_INPUT" };
  }

  const credential = await loadChannelCredential(tenantId, channelId);
  if (!credential) {
    return { state: "failed", errorCode: "CHANNEL_NOT_FOUND" };
  }
  if (!credential.access_token_ciphertext || credential.credential_status !== "active") {
    return { state: "failed", errorCode: "CHANNEL_CREDENTIALS_MISSING" };
  }

  const fetched = await fetchGraphTemplates({
    businessAccountId: credential.business_account_id,
    accessToken: decryptCredential(credential.access_token_ciphertext),
  });

  if (!fetched.ok) {
    if (fetched.failure.classification === "retryable") {
      return { state: "retryable", errorCode: graphErrorCode("TEMPLATES", fetched.failure.code) };
    }
    return { state: "failed", errorCode: graphErrorCode("TEMPLATES", fetched.failure.code) };
  }

  const syncedCount = await withTransaction((transaction) =>
    applyTemplateSync(transaction, { tenantId, channelId, templates: fetched.templates }));

  return { state: "succeeded", result: { channelId, syncedCount } };
}

async function sendTestMessage(operation: OperationRow): Promise<ExecutionOutcome> {
  const channelId = readIdentifier(operation.input, "channelId");
  const templateId = readIdentifier(operation.input, "templateId");
  const recipientHash = readIdentifier(operation.input, "testRecipientHash");
  const tenantId = operation.tenant_id;
  if (!channelId || !templateId || !recipientHash || !tenantId) {
    return { state: "failed", errorCode: "INVALID_OPERATION_INPUT" };
  }

  const config = getRuntimeConfig();
  const recipients = config.whatsapp.testRecipients;
  const otpHmacKey = config.security.otpHmacKey;
  if (recipients.length === 0) {
    return { state: "failed", errorCode: "TEST_RECIPIENT_ALLOWLIST_UNCONFIGURED" };
  }
  if (!otpHmacKey) {
    return { state: "failed", errorCode: "CAPABILITY_UNAVAILABLE" };
  }

  const recipient = recipients.find((candidate) => hmacSha256Hex(otpHmacKey, candidate) === recipientHash);
  if (!recipient) {
    return { state: "failed", errorCode: "TEST_RECIPIENT_NOT_ALLOWLISTED" };
  }

  const credential = await loadChannelCredential(tenantId, channelId);
  if (!credential) {
    return { state: "failed", errorCode: "CHANNEL_NOT_FOUND" };
  }
  if (!credential.access_token_ciphertext || credential.credential_status !== "active") {
    return { state: "failed", errorCode: "CHANNEL_CREDENTIALS_MISSING" };
  }

  const template = await withDatabase((database) => database<TemplateRow[]>`
    SELECT name, locale, status FROM whatsapp_templates
    WHERE tenant_id = ${tenantId} AND channel_id = ${channelId} AND id = ${templateId}
    LIMIT 1
  `);
  const approved = template[0];
  if (!approved) {
    return { state: "failed", errorCode: "TEMPLATE_NOT_FOUND" };
  }
  if (approved.status !== "approved") {
    return { state: "failed", errorCode: "TEMPLATE_NOT_APPROVED" };
  }

  const transport = await postGraphMessage({
    phoneNumberId: credential.phone_number_id,
    accessToken: decryptCredential(credential.access_token_ciphertext),
    payload: buildTemplateMessagePayload({
      to: recipient,
      templateName: approved.name,
      languageCode: approved.locale,
    }),
  });

  if (!transport.ok) {
    if (transport.failure.classification === "retryable") {
      return { state: "retryable", errorCode: graphErrorCode("TEST_MESSAGE", transport.failure.code) };
    }
    return { state: "failed", errorCode: graphErrorCode("TEST_MESSAGE", transport.failure.code) };
  }

  return { state: "succeeded", result: { channelId, providerMessageId: transport.messageId } };
}

async function deleteChannel(operation: OperationRow): Promise<ExecutionOutcome> {
  const channelId = readIdentifier(operation.input, "channelId");
  const tenantId = operation.tenant_id;
  if (!channelId || !tenantId) {
    return { state: "failed", errorCode: "INVALID_OPERATION_INPUT" };
  }

  await withTransaction(async (transaction) => {
    await transaction`
      UPDATE channels SET status = 'deleted', deleted_at = now(), updated_at = now()
      WHERE tenant_id = ${tenantId} AND id = ${channelId} AND status <> 'deleted'
    `;
    await transaction`
      UPDATE whatsapp_channel_credentials SET status = 'revoked', revoked_at = coalesce(revoked_at, now())
      WHERE tenant_id = ${tenantId} AND channel_id = ${channelId} AND status <> 'revoked'
    `;
  });

  return { state: "succeeded", result: { channelId, status: "deleted" } };
}

async function sendMessage(operation: OperationRow): Promise<ExecutionOutcome> {
  const messageId = readIdentifier(operation.input, "messageId");
  if (!messageId) {
    return { state: "failed", errorCode: "INVALID_OPERATION_INPUT" };
  }

  const outcome: MessageSendOutcome = await sendQueuedMessage(messageId);
  switch (outcome.status) {
    case "sent":
      return { state: "succeeded", result: { messageId, providerMessageId: outcome.providerMessageId } };
    case "skipped":
      return { state: "succeeded", result: { messageId, skipped: outcome.reason } };
    case "blocked":
      return { state: "failed", errorCode: `MESSAGE_BLOCKED_${outcome.reason.toUpperCase()}` };
    default:
      return outcome.failure.classification === "retryable"
        ? { state: "retryable", errorCode: graphErrorCode("MESSAGE", outcome.failure.code) }
        : { state: "failed", errorCode: graphErrorCode("MESSAGE", outcome.failure.code) };
  }
}

async function settleEvent(
  event: ClaimedOutboxEvent,
  operation: OperationRow | null,
  outcome: ExecutionOutcome,
): Promise<void> {
  const exhausted = outcome.state !== "succeeded" && event.attemptCount >= MAX_ATTEMPTS;

  await withTransaction(async (transaction) => {
    if (outcome.state === "succeeded") {
      if (operation) {
        await transaction`
          UPDATE operations SET status = 'succeeded', progress = 100, result = ${JSON.stringify(outcome.result)}::jsonb,
            error_code = NULL, completed_at = now(), claimed_by = NULL, lease_expires_at = NULL, updated_at = now()
          WHERE id = ${operation.id}
        `;
      }
      await transaction`
        UPDATE outbox_events SET status = 'published', published_at = now(), locked_at = NULL, updated_at = now()
        WHERE id = ${event.id}
      `;
      return;
    }

    const terminal = outcome.state === "failed" || exhausted;

    if (operation) {
      if (terminal) {
        await transaction`
          UPDATE operations SET status = 'failed', error_code = ${outcome.errorCode}, completed_at = now(),
            claimed_by = NULL, lease_expires_at = NULL, updated_at = now()
          WHERE id = ${operation.id} AND status <> 'succeeded'
        `;
      } else {
        await transaction`
          UPDATE operations SET status = 'queued', error_code = ${outcome.errorCode}, progress = NULL,
            claimed_by = NULL, lease_expires_at = NULL, updated_at = now()
          WHERE id = ${operation.id} AND status <> 'succeeded'
        `;
      }
    }

    if (terminal) {
      // Parked at 'infinity' so the claim query never picks a permanently failed event again.
      await transaction`
        UPDATE outbox_events SET status = 'failed', locked_at = NULL, available_at = 'infinity'::timestamptz,
          updated_at = now()
        WHERE id = ${event.id}
      `;
      return;
    }

    await transaction`
      UPDATE outbox_events SET status = 'pending', locked_at = NULL,
        available_at = now() + make_interval(secs => ${backoffSeconds(event.attemptCount)}), updated_at = now()
      WHERE id = ${event.id}
    `;
  });
}

async function recordVerificationFailure(
  tenantId: string,
  channelId: string,
  failure: { classification: string; code: number | null; details: string | null },
): Promise<void> {
  await withDatabase((database) => database`
    UPDATE channels
    SET verification_evidence = ${JSON.stringify({
      status: "unverified",
      checkedAt: new Date().toISOString(),
      classification: failure.classification,
      providerCode: failure.code,
      details: failure.details,
    })}::jsonb,
      updated_at = now()
    WHERE tenant_id = ${tenantId} AND id = ${channelId}
  `);
}

async function loadOperation(operationId: string): Promise<OperationRow | null> {
  const rows = await withDatabase((database) => database<OperationRow[]>`
    SELECT id, tenant_id, operation_type, status, input FROM operations WHERE id = ${operationId} LIMIT 1
  `);
  return rows[0] ?? null;
}

async function loadChannelCredential(tenantId: string, channelId: string): Promise<ChannelCredentialRow | null> {
  const rows = await withDatabase((database) => database<ChannelCredentialRow[]>`
    SELECT channel.phone_number_id, channel.business_account_id, channel.status AS channel_status,
      credential.id AS credential_id, credential.status AS credential_status,
      credential.access_token_ciphertext
    FROM channels channel
    LEFT JOIN whatsapp_channel_credentials credential
      ON credential.tenant_id = channel.tenant_id AND credential.channel_id = channel.id
      AND credential.status IN ('pending', 'active')
    WHERE channel.tenant_id = ${tenantId} AND channel.id = ${channelId}
    ORDER BY (credential.status = 'active') DESC, credential.version DESC
    LIMIT 1
  `);
  return rows[0] ?? null;
}

function decryptCredential(ciphertext: string): string {
  const key = getRuntimeConfig().security.credentialEncryptionKey;
  if (!key) {
    throw new Error("Credential encryption is not configured");
  }

  return decryptSecret(ciphertext, key);
}

function backoffSeconds(attemptCount: number): number {
  const exponent = Math.max(0, attemptCount - 1);
  return Math.min(BASE_BACKOFF_SECONDS * 2 ** exponent, MAX_BACKOFF_SECONDS);
}

function graphErrorCode(scope: string, code: number | null): string {
  return code === null ? `GRAPH_${scope}_FAILED` : `GRAPH_${scope}_${code}`;
}

function readIdentifier(input: Record<string, unknown>, key: string): string | null {
  const value = input[key];
  if (typeof value !== "string" || value.length === 0 || value.length > 128) {
    return null;
  }

  return /^[A-Za-z0-9_.:-]+$/.test(value) ? value : null;
}
