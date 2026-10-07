import "server-only";

import type { SolTestQuote, SolTestStatus } from "@/lib/payments/sol-test/contracts";
import { verifySolTest } from "@/lib/payments/sol-test/verify";
import type { PaymentChain } from "../rpc";

export async function checkSolTest(chain: PaymentChain, quote: SolTestQuote, signature: string): Promise<SolTestStatus> {
  const genesis = await chain.genesis();
  const finalized = await chain.transaction(signature, "finalized");
  if (finalized !== null) {
    const reason = verifySolTest(quote, signature, finalized, genesis);
    return reason ? { status: "invalid", reason } : { status: "verified" };
  }
  const confirmed = await chain.transaction(signature, "confirmed");
  if (confirmed === null) return { status: "pending" };
  const reason = verifySolTest(quote, signature, confirmed, genesis);
  return reason ? { status: "invalid", reason } : { status: "confirmed" };
}
