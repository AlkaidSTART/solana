import { DEVNET_GENESIS, type PaymentOrder } from "@/lib/payments/contracts";
import { verifyTransfer } from "@/lib/payments/verify";

import type { PaymentChain } from "./rpc";
import type { PaymentRepository } from "./repository";

export async function reconcile(order: PaymentOrder, chain: PaymentChain, repository: PaymentRepository) {
  if (order.status === "credited" || order.status === "cancelled") return;
  const genesis = await chain.genesis();
  if (genesis !== DEVNET_GENESIS) throw new Error("Wrong network");
  let before: string | undefined;
  let detected = false;
  let needsReview = false;
  // Scan all pages in the quote interval, not merely the newest invalid transfer.
  for (;;) {
    const candidates = await chain.signatures(order.reference, before);
    if (!candidates.length) break;
    for (const candidate of candidates) {
      const finalized = await chain.transaction(candidate.signature, "finalized");
      const raw = finalized ?? await chain.transaction(candidate.signature, "confirmed");
      if (!raw) continue;
      const result = verifyTransfer(order, candidate.signature, raw, genesis);
      await repository.record(order.id, candidate.signature, result.kind === "valid" ? (finalized ? "finalized" : "confirmed") : result.reason);
      if (result.kind !== "valid") {
        if (["wrong_received_amount", "outside_quote", "missing_chain_time"].includes(result.reason)) needsReview = true;
        continue;
      }
      if (finalized) { await repository.settle(order, result.transfer); await repository.checked(order.id); return; }
      detected = true;
    }
    const last = candidates.at(-1);
    if (!last || last.signature === before) throw new Error("RPC pagination did not advance");
    if (candidates.length < 100 || (last.blockTime !== null && last.blockTime * 1000 < Date.parse(order.createdAt))) break;
    before = last.signature;
  }
  if (detected) await repository.mark(order.id, "confirmed");
  else if (needsReview || order.status === "confirmed" || order.status === "review_required") await repository.mark(order.id, "review_required");
  else if (Date.now() > Date.parse(order.expiresAt)) await repository.mark(order.id, "expired");
  await repository.checked(order.id);
}
