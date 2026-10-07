import { randomUUID } from "node:crypto";

import { z } from "zod";

import { writeAuditEvent } from "@/lib/server/audit/service";
import type { ActorContext } from "@/lib/server/auth/types";
import { getRuntimeConfig } from "@/lib/server/config/env";
import { withDatabase, type TransactionSql } from "@/lib/server/db/client";
import { ApiError } from "@/lib/server/http/errors";
import type { RequestContext } from "@/lib/server/http/request";
import { executeIdempotent } from "@/lib/server/idempotency/service";
import {
  createOperationInTransaction,
  enqueueOutboxInTransaction,
} from "@/lib/server/operations/service";
import {
  createReferenceAddress,
  createSolanaPayTransferUrl,
  formatTokenAmount,
} from "@/lib/server/integrations/solana/transfer-request";
import { sha256Hex } from "@/lib/server/security/digests";
import { requirePaymentRuntimeConfiguration, type PaymentRuntimeConfiguration } from "./config";

const MAX_CREDIT_PURCHASE = 1_000_000_000;
const SIGNATURE_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{64,88}$/;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

export const createPaymentOrderSchema = z.object({
  purpose: z.literal("credits_topup"),
  credits: z.number().int().positive().max(MAX_CREDIT_PURCHASE),
}).strict();

export const paymentClaimSchema = z.object({
  signature: z.string().regex(SIGNATURE_PATTERN),
}).strict();

export type CreatePaymentOrderInput = z.output<typeof createPaymentOrderSchema>;

interface PaymentOrderRow {
  id: string;
  purpose: "credits_topup";
  credits: string;
  catalog_version: string;
  amount_minor: string;
  unit_price_minor: string;
  currency: "USDC";
  decimals: number;
  cluster: "devnet" | "mainnet-beta";
  genesis_hash: string;
  mint: string;
  token_program: string;
  recipient: string;
  reference: string;
  solana_pay_url: string;
  status: string;
  created_at: Date;
  expires_at: Date;
  settled_at: Date | null;
  updated_at: Date;
}

interface CandidateRow {
  id: string;
  signature: string;
  transfer_index: number | null;
  status: string;
  commitment: string | null;
  review_code: string | null;
  block_time: Date | null;
  observed_at: Date;
  checked_at: Date | null;
}

interface CreditLedgerRow {
  id: string;
  batch_id: string;
  payment_order_id: string | null;
  entry_type: string;
  bucket: string;
  delta: string;
  reason_key: string;
  created_at: Date;
}

interface BillingCursor {
  createdAt: string;
  id: string;
}

interface NetworkConfigurationRow {
  id: string;
  cluster: string;
  genesis_hash: string;
  mint: string;
  token_program: string;
  recipient: string;
  decimals: number;
}

export interface PaymentOrderView {
  id: string;
  purpose: "credits_topup";
  credits: string;
  catalogVersion: string;
  amountMinor: string;
  amountDisplay: string;
  unitPriceMinor: string;
  currency: "USDC";
  decimals: number;
  cluster: "devnet" | "mainnet-beta";
  token: { symbol: "USDC"; mint: string; tokenProgram: string; decimals: 6 };
  recipient: string;
  reference: string;
  solanaPayUrl: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  settledAt: string | null;
  updatedAt: string;
}

export type RecheckPaymentOrderResult =
  | {
      httpStatus: 200;
      paymentOrderId: string;
      status: "settled";
      operationId: null;
    }
  | {
      httpStatus: 202;
      paymentOrderId: string;
      status: "queued";
      operationId: string;
      statusUrl: string;
    };

export function getBillingCatalog(): {
  status: "unavailable" | "pilot" | "current";
  blockingReasons: string[];
  catalogVersion: string | null;
  items: Array<{
    id: "credits_topup";
    unitPriceMinor: string;
    currency: "USDC";
    decimals: 6;
    minimumCredits: number;
  }>;
} {
  const runtime = getRuntimeConfig();
  if (!runtime.billing.configured || !runtime.billing.catalogVersion || !runtime.billing.catalogStatus || !runtime.billing.creditUnitPriceMinor) {
    return {
      status: "unavailable",
      blockingReasons: ["billing_catalog_not_configured"],
      catalogVersion: null,
      items: [],
    };
  }
  let paymentReady = false;
  try {
    requirePaymentRuntimeConfiguration();
    paymentReady = true;
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
  }
  return {
    status: runtime.billing.catalogStatus,
    blockingReasons: paymentReady ? [] : ["solana_payment_not_configured"],
    catalogVersion: runtime.billing.catalogVersion,
    items: [{
      id: "credits_topup",
      unitPriceMinor: runtime.billing.creditUnitPriceMinor,
      currency: "USDC",
      decimals: 6,
      minimumCredits: runtime.billing.minimumCredits,
    }],
  };
}

export async function getBillingSummary(actor: ActorContext) {
  const environment = getRuntimeConfig().environment;
  return withDatabase(async (sql) => {
    const balances = await sql<{
      available: string; reserved: string; consumed: string; expired: string; frozen: string;
    }[]>`
      SELECT
        COALESCE(sum(delta) FILTER (WHERE bucket = 'available'), 0)::text AS available,
        COALESCE(sum(delta) FILTER (WHERE bucket = 'reserved'), 0)::text AS reserved,
        COALESCE(sum(delta) FILTER (WHERE bucket = 'consumed'), 0)::text AS consumed,
        COALESCE(sum(delta) FILTER (WHERE bucket = 'expired'), 0)::text AS expired,
        COALESCE(sum(delta) FILTER (WHERE bucket = 'frozen'), 0)::text AS frozen
      FROM credit_ledger
      WHERE tenant_id = ${actor.tenantId} AND environment = ${environment}
    `;
    const payments = await sql<{ awaiting: string; review_required: string }[]>`
      SELECT
        count(*) FILTER (WHERE status IN ('awaiting_payment', 'candidate_observed', 'awaiting_finalization'))::text AS awaiting,
        count(*) FILTER (WHERE status = 'review_required')::text AS review_required
      FROM payment_orders
      WHERE tenant_id = ${actor.tenantId} AND environment = ${environment}
    `;
    return {
      environment,
      credits: balances[0] ?? { available: "0", reserved: "0", consumed: "0", expired: "0", frozen: "0" },
      paymentOrders: {
        awaiting: payments[0]?.awaiting ?? "0",
        reviewRequired: payments[0]?.review_required ?? "0",
      },
      updatedAt: new Date().toISOString(),
    };
  });
}

export async function listCreditLedger(
  actor: ActorContext,
  filters: { type: string | null; from: string | null; to: string | null; cursor: string | null },
) {
  const environment = getRuntimeConfig().environment;
  const allowedTypes = ["grant", "reserve", "release", "consume", "expire", "compensate", "refund_freeze", "refund_release"];
  if (filters.type && !allowedTypes.includes(filters.type)) {
    throw new ApiError(400, "INVALID_LEDGER_TYPE", "Credit ledger type is invalid");
  }
  const from = parseOptionalTimestamp(filters.from, "from");
  const to = parseOptionalTimestamp(filters.to, "to");
  if (from && to && from > to) {
    throw new ApiError(400, "INVALID_TIME_RANGE", "Ledger time range is invalid");
  }
  const cursor = decodeBillingCursor(filters.cursor);
  return withDatabase(async (sql) => {
    const rows = await sql<CreditLedgerRow[]>`
      SELECT id, batch_id, payment_order_id, entry_type, bucket, delta::text, reason_key, created_at
      FROM credit_ledger
      WHERE tenant_id = ${actor.tenantId} AND environment = ${environment}
        AND (${filters.type}::text IS NULL OR entry_type = ${filters.type})
        AND (${from}::timestamptz IS NULL OR created_at >= ${from})
        AND (${to}::timestamptz IS NULL OR created_at <= ${to})
        AND (${cursor?.createdAt ?? null}::timestamptz IS NULL
          OR (created_at, id) < (${cursor?.createdAt ?? null}::timestamptz, ${cursor?.id ?? null}::text))
      ORDER BY created_at DESC, id DESC
      LIMIT 101
    `;
    const hasNextPage = rows.length > 100;
    const pageRows = hasNextPage ? rows.slice(0, 100) : rows;
    const last = pageRows.at(-1);
    return {
      items: pageRows.map((row) => ({
        id: row.id,
        batchId: row.batch_id,
        paymentOrderId: row.payment_order_id,
        type: row.entry_type,
        bucket: row.bucket,
        delta: row.delta,
        reasonKey: row.reason_key,
        createdAt: row.created_at.toISOString(),
      })),
      pageInfo: {
        hasNextPage,
        nextCursor: hasNextPage && last
          ? encodeBillingCursor({ createdAt: last.created_at.toISOString(), id: last.id })
          : null,
      },
    };
  });
}

export async function getSubscription(actor: ActorContext) {
  const environment = getRuntimeConfig().environment;
  const rows = await withDatabase((sql) => sql`
    SELECT id, plan_id AS "planId", price_version AS "priceVersion", status,
      starts_at AS "startsAt", ends_at AS "endsAt", source_payment_order_id AS "sourcePaymentOrderId"
    FROM billing_subscriptions
    WHERE tenant_id = ${actor.tenantId} AND environment = ${environment}
    ORDER BY ends_at DESC LIMIT 1
  `);
  return { subscription: rows[0] ?? null, evidence: rows[0] ? "persisted" : "none" };
}

export async function listPaymentOrders(
  actor: ActorContext,
  filters: { status: string | null; purpose: string | null; cursor: string | null },
) {
  const environment = getRuntimeConfig().environment;
  const allowedStatuses = ["awaiting_payment", "candidate_observed", "awaiting_finalization", "settled", "review_required", "expired", "cancelled"];
  if (filters.status && !allowedStatuses.includes(filters.status)) {
    throw new ApiError(400, "INVALID_PAYMENT_STATUS", "Payment order status is invalid");
  }
  if (filters.purpose && filters.purpose !== "credits_topup") {
    throw new ApiError(400, "INVALID_PAYMENT_PURPOSE", "Payment order purpose is invalid");
  }
  const cursor = decodeBillingCursor(filters.cursor);
  const rows = await withDatabase((sql) => sql<PaymentOrderRow[]>`
    SELECT id, purpose, credits::text, catalog_version, amount_minor::text, unit_price_minor::text,
      currency, decimals, cluster, genesis_hash, mint, token_program, recipient, reference,
      solana_pay_url, status, created_at, expires_at, settled_at, updated_at
    FROM payment_orders
    WHERE tenant_id = ${actor.tenantId} AND environment = ${environment}
      AND (${filters.status}::text IS NULL OR status = ${filters.status})
      AND (${filters.purpose}::text IS NULL OR purpose = ${filters.purpose})
      AND (${cursor?.createdAt ?? null}::timestamptz IS NULL
        OR (created_at, id) < (${cursor?.createdAt ?? null}::timestamptz, ${cursor?.id ?? null}::text))
    ORDER BY created_at DESC, id DESC LIMIT 101
  `);
  const hasNextPage = rows.length > 100;
  const pageRows = hasNextPage ? rows.slice(0, 100) : rows;
  const last = pageRows.at(-1);
  return {
    items: pageRows.map(toPaymentOrderView),
    pageInfo: {
      hasNextPage,
      nextCursor: hasNextPage && last
        ? encodeBillingCursor({ createdAt: last.created_at.toISOString(), id: last.id })
        : null,
    },
  };
}

export async function getPaymentOrder(actor: ActorContext, paymentOrderId: string) {
  const environment = getRuntimeConfig().environment;
  const rows = await withDatabase((sql) => sql<PaymentOrderRow[]>`
    SELECT id, purpose, credits::text, catalog_version, amount_minor::text, unit_price_minor::text,
      currency, decimals, cluster, genesis_hash, mint, token_program, recipient, reference,
      solana_pay_url, status, created_at, expires_at, settled_at, updated_at
    FROM payment_orders
    WHERE id = ${paymentOrderId} AND tenant_id = ${actor.tenantId} AND environment = ${environment}
    LIMIT 1
  `);
  const order = rows[0];
  if (!order) throw paymentOrderNotFound();
  const candidates = await withDatabase((sql) => sql<CandidateRow[]>`
    SELECT id, signature, transfer_index, status, commitment, review_code, block_time, observed_at, checked_at
    FROM payment_candidates
    WHERE tenant_id = ${actor.tenantId} AND payment_order_id = ${paymentOrderId}
    ORDER BY observed_at DESC, id DESC LIMIT 50
  `);
  return {
    ...toPaymentOrderView(order),
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      signature: candidate.signature,
      transferIndex: candidate.transfer_index,
      status: candidate.status,
      commitment: candidate.commitment,
      reviewCode: candidate.review_code,
      blockTime: candidate.block_time?.toISOString() ?? null,
      observedAt: candidate.observed_at.toISOString(),
      checkedAt: candidate.checked_at?.toISOString() ?? null,
    })),
  };
}

export async function createPaymentOrder(
  actor: ActorContext,
  input: CreatePaymentOrderInput,
  idempotencyKey: string,
  context: RequestContext,
): Promise<PaymentOrderView> {
  const configuration = requirePaymentRuntimeConfiguration();
  if (input.credits < configuration.minimumCredits) {
    throw new ApiError(422, "MINIMUM_CREDITS_NOT_MET", `At least ${configuration.minimumCredits} Credits are required`);
  }
  const credits = BigInt(input.credits);
  const amountMinor = (credits * BigInt(configuration.creditUnitPriceMinor)).toString();
  if (amountMinor.length > 78) {
    throw new ApiError(422, "PAYMENT_AMOUNT_TOO_LARGE", "Payment amount exceeds the supported range");
  }
  const paymentOrderId = randomUUID();
  const reference = createReferenceAddress();
  const solanaPayUrl = createSolanaPayTransferUrl({
    recipient: configuration.recipient,
    mint: configuration.mint,
    reference,
    amountMinor,
    paymentOrderId,
  });
  const result = await executeIdempotent(actor, "billing.payment_order.create", idempotencyKey, input, async (transaction) => {
    const networkConfigId = await ensureNetworkConfiguration(transaction, configuration);
    const rows = await transaction<PaymentOrderRow[]>`
      INSERT INTO payment_orders (
        id, tenant_id, environment, purpose, catalog_version, network_config_id, credits,
        unit_price_minor, amount_minor, currency, decimals, cluster, genesis_hash, mint,
        token_program, recipient, reference, solana_pay_url, status, quote_snapshot,
        requested_by_user_id, created_at, expires_at, updated_at
      ) VALUES (
        ${paymentOrderId}, ${actor.tenantId}, ${configuration.environment}, 'credits_topup',
        ${configuration.catalogVersion}, ${networkConfigId}, ${credits.toString()},
        ${configuration.creditUnitPriceMinor}, ${amountMinor}, 'USDC', 6, ${configuration.cluster},
        ${configuration.genesisHash}, ${configuration.mint}, ${configuration.tokenProgram},
        ${configuration.recipient}, ${reference}, ${solanaPayUrl}, 'awaiting_payment',
        ${JSON.stringify({
          catalogStatus: configuration.catalogStatus,
          catalogVersion: configuration.catalogVersion,
          credits: credits.toString(),
          unitPriceMinor: configuration.creditUnitPriceMinor,
        })}::jsonb,
        ${actor.userId}, now(), now() + interval '20 minutes', now()
      )
      RETURNING id, purpose, credits::text, catalog_version, amount_minor::text, unit_price_minor::text,
        currency, decimals, cluster, genesis_hash, mint, token_program, recipient, reference,
        solana_pay_url, status, created_at, expires_at, settled_at, updated_at
    `;
    const order = rows[0];
    if (!order) {
      throw new ApiError(503, "PAYMENT_ORDER_UNAVAILABLE", "Payment order could not be persisted", { retryable: true });
    }
    await writeAuditEvent({
      actor,
      action: "billing.payment_order_created",
      resourceType: "payment_order",
      resourceId: paymentOrderId,
      requestId: context.requestId,
      metadata: { credits: credits.toString(), catalogVersion: configuration.catalogVersion },
    }, transaction);
    return { status: 200, body: toPaymentOrderView(order) };
  });
  return result.body;
}

export async function claimPaymentSignature(
  actor: ActorContext,
  paymentOrderId: string,
  signature: string,
  idempotencyKey: string,
  context: RequestContext,
) {
  const configuration = requirePaymentRuntimeConfiguration();
  if (!SIGNATURE_PATTERN.test(signature)) {
    throw new ApiError(422, "INVALID_SIGNATURE", "Solana transaction signature is invalid");
  }
  const result = await executeIdempotent(actor, "billing.payment_order.claim", idempotencyKey, {
    paymentOrderId,
    signature,
  }, async (transaction) => {
    const order = await lockPaymentOrder(transaction, actor, paymentOrderId, configuration);
    if (order.status === "settled") {
      throw new ApiError(409, "PAYMENT_ALREADY_SETTLED", "Payment order is already settled");
    }
    if (order.status === "cancelled") {
      throw new ApiError(409, "PAYMENT_ORDER_CANCELLED", "Payment order is cancelled");
    }
    const candidateRows = await transaction<{ id: string }[]>`
      INSERT INTO payment_candidates (
        id, tenant_id, payment_order_id, environment, cluster, signature, status, observed_at, updated_at
      ) VALUES (
        ${randomUUID()}, ${actor.tenantId}, ${paymentOrderId}, ${configuration.environment},
        ${configuration.cluster}, ${signature}, 'queued', now(), now()
      )
      ON CONFLICT (payment_order_id, cluster, signature)
      DO UPDATE SET updated_at = now()
      RETURNING id
    `;
    const candidateId = candidateRows[0]?.id;
    if (!candidateId) {
      throw new ApiError(503, "PAYMENT_CANDIDATE_UNAVAILABLE", "Payment candidate could not be persisted", { retryable: true });
    }
    const operation = await createOperationInTransaction(transaction, {
      tenantId: actor.tenantId,
      requestedByUserId: actor.userId,
      type: "billing.payment.verify",
      input: { paymentOrderId, candidateId },
    });
    await enqueueOutboxInTransaction(transaction, {
      deduplicationKey: `payment-claim:${sha256Hex(`${paymentOrderId}:${signature}`)}`,
      tenantId: actor.tenantId,
      eventType: "billing.payment.verify",
      aggregateType: "payment_order",
      aggregateId: paymentOrderId,
      payload: { paymentOrderId, candidateId, operationId: operation.id },
    });
    await transaction`
      UPDATE payment_orders SET status = CASE WHEN status = 'awaiting_payment' THEN 'candidate_observed' ELSE status END
      WHERE id = ${paymentOrderId} AND tenant_id = ${actor.tenantId}
    `;
    await writeAuditEvent({
      actor,
      action: "billing.payment_candidate_claimed",
      resourceType: "payment_order",
      resourceId: paymentOrderId,
      requestId: context.requestId,
      metadata: { candidateId, operationId: operation.id },
    }, transaction);
    return {
      status: 202,
      body: {
        candidateId,
        operationId: operation.id,
        status: "queued" as const,
        statusUrl: `/api/v1/operations/${operation.id}`,
      },
    };
  });
  return result.body;
}

export async function recheckPaymentOrder(
  actor: ActorContext,
  paymentOrderId: string,
  idempotencyKey: string,
  context: RequestContext,
): Promise<RecheckPaymentOrderResult> {
  const configuration = requirePaymentRuntimeConfiguration();
  const result = await executeIdempotent<RecheckPaymentOrderResult>(actor, "billing.payment_order.recheck", idempotencyKey, { paymentOrderId }, async (transaction) => {
    const order = await lockPaymentOrder(transaction, actor, paymentOrderId, configuration);
    if (order.status === "settled") {
      return {
        status: 200,
        body: { httpStatus: 200, paymentOrderId, status: "settled", operationId: null },
      };
    }
    const operation = await createOperationInTransaction(transaction, {
      tenantId: actor.tenantId,
      requestedByUserId: actor.userId,
      type: "billing.payment.recheck",
      input: { paymentOrderId },
    });
    await enqueueOutboxInTransaction(transaction, {
      deduplicationKey: `payment-recheck:${sha256Hex(`${paymentOrderId}:${idempotencyKey}`)}`,
      tenantId: actor.tenantId,
      eventType: "billing.payment.recheck",
      aggregateType: "payment_order",
      aggregateId: paymentOrderId,
      payload: { paymentOrderId, operationId: operation.id },
    });
    await writeAuditEvent({
      actor,
      action: "billing.payment_recheck_requested",
      resourceType: "payment_order",
      resourceId: paymentOrderId,
      requestId: context.requestId,
      metadata: { operationId: operation.id },
    }, transaction);
    return {
      status: 202,
      body: {
        httpStatus: 202,
        paymentOrderId,
        status: "queued",
        operationId: operation.id,
        statusUrl: `/api/v1/operations/${operation.id}`,
      },
    };
  });
  return result.body;
}

export function refundCapabilityUnavailable(): never {
  throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Refund requests are unavailable until credit freezing is implemented");
}

async function ensureNetworkConfiguration(
  transaction: TransactionSql,
  configuration: PaymentRuntimeConfiguration,
): Promise<string> {
  await transaction`
    SELECT pg_advisory_xact_lock(
      hashtext('solaflow_billing_network_config'),
      hashtext(${configuration.environment})
    )
  `;
  await transaction`
    UPDATE billing_network_configs
    SET status = 'retired', retired_at = now()
    WHERE environment = ${configuration.environment} AND status = 'active'
      AND config_version <> ${configuration.networkConfigVersion}
  `;
  const rows = await transaction<NetworkConfigurationRow[]>`
    INSERT INTO billing_network_configs (
      id, environment, config_version, cluster, genesis_hash, mint, token_program,
      decimals, recipient, status, created_at, retired_at
    ) VALUES (
      ${randomUUID()}, ${configuration.environment}, ${configuration.networkConfigVersion},
      ${configuration.cluster}, ${configuration.genesisHash}, ${configuration.mint},
      ${configuration.tokenProgram}, 6, ${configuration.recipient}, 'active', now(), NULL
    )
    ON CONFLICT (environment, config_version) DO UPDATE
      SET status = 'active', retired_at = NULL
    RETURNING id, cluster, genesis_hash, mint, token_program, recipient, decimals
  `;
  const row = rows[0];
  if (!row) {
    throw new ApiError(503, "PAYMENT_CONFIGURATION_UNAVAILABLE", "Payment configuration could not be persisted", {
      retryable: true,
    });
  }
  if (
    row.cluster !== configuration.cluster
    || row.genesis_hash !== configuration.genesisHash
    || row.mint !== configuration.mint
    || row.token_program !== configuration.tokenProgram
    || row.recipient !== configuration.recipient
    || row.decimals !== configuration.decimals
  ) {
    throw new ApiError(503, "PAYMENT_CONFIGURATION_CONFLICT", "Payment configuration version is not immutable");
  }
  return row.id;
}

async function lockPaymentOrder(
  transaction: TransactionSql,
  actor: ActorContext,
  paymentOrderId: string,
  configuration: PaymentRuntimeConfiguration,
): Promise<{ status: string }> {
  const rows = await transaction<{ status: string }[]>`
    SELECT status FROM payment_orders
    WHERE id = ${paymentOrderId} AND tenant_id = ${actor.tenantId}
      AND environment = ${configuration.environment} AND cluster = ${configuration.cluster}
    FOR UPDATE
  `;
  if (!rows[0]) throw paymentOrderNotFound();
  return rows[0];
}

function toPaymentOrderView(row: PaymentOrderRow): PaymentOrderView {
  return {
    id: row.id,
    purpose: row.purpose,
    credits: row.credits,
    catalogVersion: row.catalog_version,
    amountMinor: row.amount_minor,
    amountDisplay: formatTokenAmount(row.amount_minor, row.decimals),
    unitPriceMinor: row.unit_price_minor,
    currency: row.currency,
    decimals: row.decimals,
    cluster: row.cluster,
    token: { symbol: "USDC", mint: row.mint, tokenProgram: row.token_program, decimals: 6 },
    recipient: row.recipient,
    reference: row.reference,
    solanaPayUrl: row.solana_pay_url,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
    settledAt: row.settled_at ? new Date(row.settled_at).toISOString() : null,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function parseOptionalTimestamp(value: string | null, field: string): string | null {
  if (value === null) return null;
  if (!ISO_TIMESTAMP_PATTERN.test(value)) {
    throw new ApiError(400, "INVALID_TIME_FILTER", `${field} must be an ISO 8601 timestamp with a timezone`);
  }
  const time = Date.parse(value);
  if (!Number.isFinite(time)) {
    throw new ApiError(400, "INVALID_TIME_FILTER", `${field} must be an ISO 8601 timestamp`);
  }
  return new Date(time).toISOString();
}

function encodeBillingCursor(cursor: BillingCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeBillingCursor(value: string | null): BillingCursor | null {
  if (value === null) return null;
  if (!/^[A-Za-z0-9_-]{1,512}$/.test(value)) {
    throw new ApiError(400, "INVALID_CURSOR", "Billing cursor is invalid");
  }
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    if (Buffer.from(decoded, "utf8").toString("base64url") !== value) {
      throw new TypeError("Non-canonical billing cursor");
    }
    const result = z.object({
      createdAt: z.string().datetime({ offset: true }),
      id: z.string().min(1).max(128),
    }).strict().safeParse(JSON.parse(decoded) as unknown);
    if (!result.success) throw new TypeError("Invalid billing cursor payload");
    return result.data;
  } catch {
    throw new ApiError(400, "INVALID_CURSOR", "Billing cursor is invalid");
  }
}

function paymentOrderNotFound(): ApiError {
  return new ApiError(404, "NOT_FOUND", "Payment order was not found");
}
