import "server-only";
import { address, createSolanaRpc, signature } from "@solana/kit";

import { DEVNET_GENESIS } from "@/lib/payments/contracts";

export interface PaymentChain {
  genesis(): Promise<string>;
  signatures(reference: string, before?: string): Promise<{ signature: string; blockTime: number | null }[]>;
  transaction(signature: string, commitment: "confirmed" | "finalized"): Promise<unknown>;
}
export function paymentChain(url: string): PaymentChain {
  const rpc = createSolanaRpc(url);
  const signal = () => AbortSignal.timeout(15_000);
  return {
    async genesis() {
      const genesis = await rpc.getGenesisHash().send({ abortSignal: signal() });
      if (genesis !== DEVNET_GENESIS) throw new Error("RPC is not Solana Devnet");
      return genesis;
    },
    async signatures(reference, before) {
      const rows = await rpc.getSignaturesForAddress(address(reference), { commitment: "confirmed", limit: 100, ...(before ? { before: signature(before) } : {}) }).send({ abortSignal: signal() });
      return rows.map((r) => ({ signature: r.signature, blockTime: r.blockTime === null ? null : Number(r.blockTime) }));
    },
    transaction(id, commitment) {
      return rpc.getTransaction(signature(id), { commitment, encoding: "json", maxSupportedTransactionVersion: 1 }).send({ abortSignal: signal() });
    },
  };
}
