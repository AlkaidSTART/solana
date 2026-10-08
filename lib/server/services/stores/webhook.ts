import { randomUUID } from "node:crypto";

import { z } from "zod";

import { getRuntimeConfig } from "@/lib/server/config/env";
import { withDatabase, withTransaction } from "@/lib/server/db/client";
import { ApiError } from "@/lib/server/http/errors";
import { enqueueOutboxInTransaction } from "@/lib/server/operations/service";
import { decryptSecret } from "@/lib/server/security/secrets";
import { sha256Hex } from "@/lib/server/security/digests";
import {
  normalizeWooCommerceOrderEvents,
  verifyWooCommerceSignature,
  wooCommercePayloadDigest,
} from "@/lib/server/integrations/woocommerce/core";

const MAX_WOOCOMMERCE_WEBHOOK_BYTES = 1024 * 1024;
const orderPayloadSchema = z.object({
  id: z.union([z.string().trim().min(1).max(128), z.number().int().nonnegative()]),
  status: z.string().trim().min(1).max(32).optional(),
  date_modified_gmt: z.string().trim().min(1).max(64).optional(),
}).passthrough();

interface WebhookEndpointRow {
  tenant_id: string;
  store_id: string;
  credential_version: number;
  webhook_secret_ciphertext: string;
}

interface ExistingWebhookEvent {
  id: string;
  payload_digest: string;
}

export interface WooCommerceWebhookResult {
  received: true;
  duplicate: boolean;
  eventId: string;
}

export async function receiveWooCommerceWebhook(input: {
  endpointId: string;
  deliveryId: string;
  topic: string;
  providerEvent: string | null;
  signature: string;
  rawBody: Uint8Array;
}): Promise<WooCommerceWebhookResult> {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(input.endpointId)) {
    throw webhookEndpointNotFound();
  }
  if (input.rawBody.byteLength > MAX_WOOCOMMERCE_WEBHOOK_BYTES) {
    throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Webhook body exceeds the allowed size");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(input.deliveryId)) {
    throw new ApiError(400, "INVALID_WEBHOOK_DELIVERY_ID", "Webhook delivery ID is invalid");
  }
  if (!/^[a-z][a-z0-9_.-]{1,63}$/.test(input.topic)) {
    throw new ApiError(400, "INVALID_WEBHOOK_TOPIC", "Webhook topic is invalid");
  }
  if (input.providerEvent !== null && !/^[a-z][a-z0-9_.-]{0,31}$/.test(input.providerEvent)) {
    throw new ApiError(400, "INVALID_WEBHOOK_EVENT", "Webhook event is invalid");
  }

  const endpointHash = sha256Hex(input.endpointId);
  const endpoints = await withDatabase((database) => database<WebhookEndpointRow[]>`
    SELECT e.tenant_id, e.store_id, e.credential_version, c.webhook_secret_ciphertext
    FROM woo_webhook_endpoints e
    JOIN stores s ON s.tenant_id = e.tenant_id AND s.id = e.store_id
    JOIN integration_credentials c
      ON c.tenant_id = e.tenant_id AND c.store_id = e.store_id
      AND c.credential_version = e.credential_version AND c.revoked_at IS NULL
    WHERE e.endpoint_id_hash = ${endpointHash}
      AND e.revoked_at IS NULL
      AND s.status = 'active'
      AND s.connection_status = 'verified'
      AND s.verified_at IS NOT NULL
    LIMIT 1
  `);
  const endpoint = endpoints[0];
  if (!endpoint) {
    throw webhookEndpointNotFound();
  }

  const encryptionKey = getRuntimeConfig().security.credentialEncryptionKey;
  if (!encryptionKey) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Credential decryption is not configured", { retryable: true });
  }

  let webhookSecret: string;
  try {
    webhookSecret = decryptSecret(endpoint.webhook_secret_ciphertext, encryptionKey);
  } catch {
    throw new ApiError(503, "CREDENTIAL_UNAVAILABLE", "Webhook credentials are unavailable", { retryable: true });
  }
  if (!verifyWooCommerceSignature(input.rawBody, webhookSecret, input.signature)) {
    throw new ApiError(401, "WEBHOOK_SIGNATURE_INVALID", "Webhook signature is invalid");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(input.rawBody));
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Webhook body must contain valid JSON");
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new ApiError(422, "VALIDATION_FAILED", "WooCommerce webhook payload must be a JSON object");
  }

  const orderPayload = input.topic.startsWith("order.")
    ? orderPayloadSchema.safeParse(payload)
    : null;
  if (orderPayload && !orderPayload.success) {
    throw new ApiError(422, "VALIDATION_FAILED", "WooCommerce order webhook payload is invalid");
  }

  const externalOrderId = orderPayload?.success ? String(orderPayload.data.id) : null;
  const normalizedStatus = orderPayload?.success ? orderPayload.data.status?.toLowerCase() ?? null : null;
  const eventTypes = normalizeWooCommerceOrderEvents({ topic: input.topic, status: normalizedStatus ?? undefined });
  const payloadDigest = wooCommercePayloadDigest(input.rawBody);
  const occurredAt = orderPayload?.success ? normalizeProviderTime(orderPayload.data.date_modified_gmt) : null;

  return withTransaction(async (transaction) => {
    const inserted = await transaction<ExistingWebhookEvent[]>`
      INSERT INTO woocommerce_webhook_events (
        id, tenant_id, store_id, delivery_id, topic, provider_event, external_order_id,
        normalized_status, event_types, payload_digest, occurred_at, received_at
      ) VALUES (
        ${randomUUID()}, ${endpoint.tenant_id}, ${endpoint.store_id}, ${input.deliveryId},
        ${input.topic}, ${input.providerEvent}, ${externalOrderId}, ${normalizedStatus},
        ${JSON.stringify(eventTypes)}::jsonb, ${payloadDigest}, ${occurredAt}, now()
      )
      ON CONFLICT (store_id, delivery_id) DO NOTHING
      RETURNING id, payload_digest
    `;
    const created = inserted[0];

    if (!created) {
      const existingRows = await transaction<ExistingWebhookEvent[]>`
        SELECT id, payload_digest
        FROM woocommerce_webhook_events
        WHERE store_id = ${endpoint.store_id} AND delivery_id = ${input.deliveryId}
        FOR UPDATE
      `;
      const existing = existingRows[0];
      if (!existing) {
        throw new ApiError(503, "WEBHOOK_EVENT_UNAVAILABLE", "Webhook event could not be resolved", { retryable: true });
      }
      if (existing.payload_digest !== payloadDigest) {
        throw new ApiError(409, "WEBHOOK_DELIVERY_CONFLICT", "Webhook delivery ID was already used with a different payload");
      }
      return { received: true, duplicate: true, eventId: existing.id };
    }

    if (externalOrderId) {
      for (const eventType of eventTypes) {
        await enqueueOutboxInTransaction(transaction, {
          deduplicationKey: `wc:${sha256Hex(`${endpoint.store_id}:${input.deliveryId}:${eventType}`)}`,
          tenantId: endpoint.tenant_id,
          eventType,
          aggregateType: "order",
          aggregateId: externalOrderId,
          payload: {
            storeId: endpoint.store_id,
            externalOrderId,
            normalizedStatus,
            deliveryId: input.deliveryId,
            payloadDigest,
            occurredAt,
          },
        });
      }
    }

    return { received: true, duplicate: false, eventId: created.id };
  });
}

function webhookEndpointNotFound(): ApiError {
  return new ApiError(404, "NOT_FOUND", "Webhook endpoint was not found");
}

function normalizeProviderTime(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const utcValue = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  const date = new Date(utcValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
