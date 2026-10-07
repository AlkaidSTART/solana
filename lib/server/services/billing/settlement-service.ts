import { randomUUID } from "node:crypto";

import { writeAuditEvent } from "@/lib/server/audit/service";
import { withTransaction, type TransactionSql } from "@/lib/server/db/client";
import { ApiError } from "@/lib/server/http/errors";
import { enqueueOutboxInTransaction } from "@/lib/server/operations/service";
import { canonicalJsonDigest, sha256Hex } from "@/lib/server/security/digests";
import {
  evaluateSettlement,
  type SettlementDecision,
  type SettlementEvidence,
  type SettlementExpected,
} from "@/lib/server/integrations/solana/settlement";

interface CandidateLocator {
  id: string;
  tenant_id: string;
  payment_order_id: string;
}

interface LockedPaymentOrder {
  id: string;
  tenant_id: string;
  environment: SettlementExpected["environment"];
  cluster: SettlementExpected["cluster"];
  genesis_hash: string;
  mint: string;
  token_program: string;
  recipient: string;
  reference: string;
  amount_minor: string;
  credits: string;
  status: string;
  created_at: Date;
  expires_at: Date;
  settled_at: Date | null;
}

interface LockedCandidate {
  id: string;
  tenant_id: string;
  payment_order_id: string;
  environment: SettlementExpected["environment"];
  cluster: SettlementExpected["cluster"];
  signature: string;
  status: string;
}

interface SettledTransferRow {
  id: string;
  payment_order_id: string;
  candidate_id: string;
  environment: SettlementExpected["environment"];
  cluster: SettlementExpected["cluster"];
  signature: string;
  transfer_index: number;
  finalized_evidence: unknown;
  settled_at: Date;
}

declare const VERIFIED_SETTLEMENT_EVIDENCE: unique symbol;
type VerifiedSettlementEvidence = SettlementEvidence & {
  readonly [VERIFIED_SETTLEMENT_EVIDENCE]: true;
};

export type PaymentSettlementResult =
  | {
      status: "review_required";
      paymentOrderId: string;
      candidateId: string;
      code: string;
    }
  | {
      status: "pending";
      paymentOrderId: string;
      candidateId: string;
      code: "AWAITING_FINALIZATION";
    }
  | {
      status: "settled";
      paymentOrderId: string;
      candidateId: string;
      transferId: string;
      credits: string;
      settledAt: string;
      idempotent: boolean;
    };

/**
 * Finalizes evidence produced by the future durable RPC verifier. The branded input intentionally
 * prevents ordinary server callers from treating client/RPC-shaped JSON as trusted evidence.
 */
export async function settleVerifiedPaymentCandidate(
  candidateId: string,
  evidence: VerifiedSettlementEvidence,
): Promise<PaymentSettlementResult> {
  return withTransaction(async (transaction) => {
    const locators = await transaction<CandidateLocator[]>`
      SELECT id, tenant_id, payment_order_id
      FROM payment_candidates
      WHERE id = ${candidateId}
      LIMIT 1
    `;
    const locator = locators[0];
    if (!locator) {
      throw paymentCandidateNotFound();
    }

    const orderRows = await transaction<LockedPaymentOrder[]>`
      SELECT id, tenant_id, environment, cluster, genesis_hash, mint, token_program, recipient,
        reference, amount_minor::text AS amount_minor, credits::text AS credits, status,
        created_at, expires_at, settled_at
      FROM payment_orders
      WHERE id = ${locator.payment_order_id} AND tenant_id = ${locator.tenant_id}
      FOR UPDATE
    `;
    const order = orderRows[0];
    if (!order) {
      throw paymentCandidateNotFound();
    }

    const candidateRows = await transaction<LockedCandidate[]>`
      SELECT id, tenant_id, payment_order_id, environment, cluster, signature, status
      FROM payment_candidates
      WHERE id = ${locator.id} AND tenant_id = ${order.tenant_id} AND payment_order_id = ${order.id}
      FOR UPDATE
    `;
    const candidate = candidateRows[0];
    if (!candidate) {
      throw paymentCandidateNotFound();
    }

    const expected: SettlementExpected = {
      environment: order.environment,
      cluster: order.cluster,
      genesisHash: order.genesis_hash,
      mint: order.mint,
      tokenProgram: order.token_program,
      recipient: order.recipient,
      reference: order.reference,
      amountMinor: order.amount_minor,
      createdAt: order.created_at.toISOString(),
      expiresAt: order.expires_at.toISOString(),
    };
    const snapshot = { expected, evidence };
    const evaluated = evaluateSettlement(expected, evidence);
    const candidateEvidenceMismatch = candidate.environment !== order.environment
      || candidate.cluster !== order.cluster
      || candidate.signature !== evidence.signature;
    const decision: SettlementDecision | { status: "review_required"; code: string } = candidateEvidenceMismatch
      ? { status: "review_required", code: "CANDIDATE_EVIDENCE_MISMATCH" }
      : evaluated;

    if (order.status === "settled") {
      const existingRows = await transaction<SettledTransferRow[]>`
        SELECT id, payment_order_id, candidate_id, environment, cluster, signature,
          transfer_index, finalized_evidence, settled_at
        FROM settled_solana_transfers
        WHERE payment_order_id = ${order.id}
        FOR UPDATE
      `;
      const existing = existingRows[0];
      if (!existing) {
        throw settlementStateUnavailable();
      }
      if (
        decision.status === "eligible"
        && existing.candidate_id === candidate.id
        && existing.environment === order.environment
        && existing.cluster === decision.transferIdentity.cluster
        && existing.signature === decision.transferIdentity.signature
        && existing.transfer_index === decision.transferIdentity.transferIndex
        && canonicalJsonDigest(existing.finalized_evidence) === canonicalJsonDigest(snapshot)
      ) {
        return settledResult(order.id, candidate.id, existing, order.credits, true);
      }

      throw new ApiError(409, "PAYMENT_ALREADY_SETTLED", "Payment order is already settled with different evidence");
    }

    if (order.status === "cancelled") {
      await updateCandidateEvidence(
        transaction,
        candidate,
        evidence,
        "PAYMENT_ORDER_CANCELLED",
        "review_required",
        snapshot,
      );
      return {
        status: "review_required",
        paymentOrderId: order.id,
        candidateId: candidate.id,
        code: "PAYMENT_ORDER_CANCELLED",
      };
    }

    if (decision.status === "review_required") {
      await updateCandidateEvidence(transaction, candidate, evidence, decision.code, "review_required", snapshot);
      await transaction`
        UPDATE payment_orders
        SET status = 'review_required'
        WHERE id = ${order.id} AND tenant_id = ${order.tenant_id} AND status <> 'settled'
      `;
      return {
        status: "review_required",
        paymentOrderId: order.id,
        candidateId: candidate.id,
        code: decision.code,
      };
    }

    if (decision.status === "pending") {
      const candidateStatus = evidence.commitment === "confirmed" ? "confirmed" : "checking";
      await updateCandidateEvidence(transaction, candidate, evidence, null, candidateStatus, snapshot);
      await transaction`
        UPDATE payment_orders
        SET status = 'awaiting_finalization'
        WHERE id = ${order.id} AND tenant_id = ${order.tenant_id} AND status <> 'settled'
      `;
      return {
        status: "pending",
        paymentOrderId: order.id,
        candidateId: candidate.id,
        code: decision.code,
      };
    }

    if (evidence.blockTime === null) {
      throw settlementStateUnavailable();
    }
    const evidenceJson = JSON.stringify(snapshot);
    const transferId = randomUUID();
    const transferRows = await transaction<{ id: string }[]>`
      INSERT INTO settled_solana_transfers (
        id, tenant_id, payment_order_id, candidate_id, environment, cluster, signature,
        transfer_index, genesis_hash, mint, token_program, recipient, reference, amount_minor,
        slot, block_time, finalized_evidence, settled_at
      ) VALUES (
        ${transferId}, ${order.tenant_id}, ${order.id}, ${candidate.id}, ${order.environment},
        ${decision.transferIdentity.cluster}, ${decision.transferIdentity.signature},
        ${decision.transferIdentity.transferIndex}, ${evidence.genesisHash}, ${evidence.mint},
        ${evidence.tokenProgram}, ${evidence.recipient}, ${order.reference}, ${decision.amountMinor},
        NULL, to_timestamp(${evidence.blockTime}), ${evidenceJson}::jsonb, now()
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    if (!transferRows[0]) {
      return resolveTransferConflict(transaction, order, candidate, evidence, snapshot);
    }

    const batchId = randomUUID();
    await transaction`
      INSERT INTO credit_batches (
        id, tenant_id, environment, source_type, source_payment_order_id, granted,
        available, reserved, consumed, expired, created_at, expires_at
      ) VALUES (
        ${batchId}, ${order.tenant_id}, ${order.environment}, 'payment', ${order.id},
        ${order.credits}, ${order.credits}, 0, 0, 0, now(), now() + interval '12 months'
      )
    `;
    await transaction`
      INSERT INTO credit_ledger (
        id, tenant_id, environment, batch_id, payment_order_id, entry_type, bucket,
        delta, reason_key, created_at
      ) VALUES (
        ${randomUUID()}, ${order.tenant_id}, ${order.environment}, ${batchId}, ${order.id},
        'grant', 'available', ${order.credits}, ${`payment-order:${order.id}:grant`}, now()
      )
    `;

    const settledOrders = await transaction<{ settled_at: Date }[]>`
      UPDATE payment_orders
      SET status = 'settled', settled_at = now()
      WHERE id = ${order.id} AND tenant_id = ${order.tenant_id} AND status <> 'settled'
      RETURNING settled_at
    `;
    const settledAt = settledOrders[0]?.settled_at;
    if (!settledAt) {
      throw settlementStateUnavailable();
    }
    await updateCandidateEvidence(transaction, candidate, evidence, null, "finalized", snapshot);
    await enqueueOutboxInTransaction(transaction, {
      deduplicationKey: `billing-settlement:${sha256Hex(`${order.id}:${decision.transferIdentity.signature}:${decision.transferIdentity.transferIndex}`)}`,
      tenantId: order.tenant_id,
      eventType: "billing.payment.settled",
      aggregateType: "payment_order",
      aggregateId: order.id,
      payload: { paymentOrderId: order.id, candidateId: candidate.id, transferId, credits: order.credits },
    });
    await writeAuditEvent({
      tenantId: order.tenant_id,
      action: "billing.payment_settled",
      resourceType: "payment_order",
      resourceId: order.id,
      metadata: { candidateId: candidate.id, transferId, credits: order.credits },
    }, transaction);

    return {
      status: "settled",
      paymentOrderId: order.id,
      candidateId: candidate.id,
      transferId,
      credits: order.credits,
      settledAt: settledAt.toISOString(),
      idempotent: false,
    };
  });
}

async function resolveTransferConflict(
  transaction: TransactionSql,
  order: LockedPaymentOrder,
  candidate: LockedCandidate,
  evidence: SettlementEvidence,
  snapshot: { expected: SettlementExpected; evidence: SettlementEvidence },
): Promise<PaymentSettlementResult> {
  const rows = await transaction<SettledTransferRow[]>`
    SELECT id, payment_order_id, candidate_id, environment, cluster, signature,
      transfer_index, finalized_evidence, settled_at
    FROM settled_solana_transfers
    WHERE (cluster = ${evidence.cluster}
      AND signature = ${evidence.signature} AND transfer_index = ${evidence.transferIndex})
      OR payment_order_id = ${order.id}
    FOR UPDATE
  `;
  const sameIdentity = rows.find((row) => row.cluster === evidence.cluster
    && row.signature === evidence.signature
    && row.transfer_index === evidence.transferIndex);

  if (sameIdentity && sameIdentity.payment_order_id !== order.id) {
    await updateCandidateEvidence(transaction, candidate, evidence, "TRANSFER_ALREADY_SETTLED", "review_required", snapshot);
    await transaction`
      UPDATE payment_orders
      SET status = 'review_required'
      WHERE id = ${order.id} AND tenant_id = ${order.tenant_id} AND status <> 'settled'
    `;
    return {
      status: "review_required",
      paymentOrderId: order.id,
      candidateId: candidate.id,
      code: "TRANSFER_ALREADY_SETTLED",
    };
  }

  throw settlementStateUnavailable();
}

async function updateCandidateEvidence(
  transaction: TransactionSql,
  candidate: LockedCandidate,
  evidence: SettlementEvidence,
  reviewCode: string | null,
  status: "checking" | "confirmed" | "finalized" | "review_required",
  snapshot: { expected: SettlementExpected; evidence: SettlementEvidence },
): Promise<void> {
  await transaction`
    UPDATE payment_candidates
    SET status = ${status}, commitment = ${evidence.commitment},
      transfer_index = ${Number.isSafeInteger(evidence.transferIndex) && evidence.transferIndex >= 0 ? evidence.transferIndex : null},
      review_code = ${reviewCode}, evidence = ${JSON.stringify(snapshot)}::jsonb,
      block_time = ${evidence.blockTime !== null && Number.isSafeInteger(evidence.blockTime) && evidence.blockTime >= 0
        ? new Date(evidence.blockTime * 1000).toISOString()
        : null}::timestamptz,
      checked_at = now(), updated_at = now()
    WHERE id = ${candidate.id} AND tenant_id = ${candidate.tenant_id}
      AND payment_order_id = ${candidate.payment_order_id}
  `;
}

function settledResult(
  paymentOrderId: string,
  candidateId: string,
  transfer: SettledTransferRow,
  credits: string,
  idempotent: boolean,
): PaymentSettlementResult {
  return {
    status: "settled",
    paymentOrderId,
    candidateId,
    transferId: transfer.id,
    credits,
    settledAt: transfer.settled_at.toISOString(),
    idempotent,
  };
}

function paymentCandidateNotFound(): ApiError {
  return new ApiError(404, "PAYMENT_CANDIDATE_NOT_FOUND", "Payment candidate was not found");
}

function settlementStateUnavailable(): ApiError {
  return new ApiError(503, "SETTLEMENT_STATE_UNAVAILABLE", "Payment settlement state could not be resolved", {
    retryable: true,
  });
}
