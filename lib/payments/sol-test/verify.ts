import { getBase58Encoder } from "@solana/kit";
import { getTransferSolInstructionDataDecoder, SYSTEM_PROGRAM_ADDRESS } from "@solana-program/system";
import { z } from "zod";

import { DEVNET_GENESIS } from "../contracts";
import { solTestQuoteSchema, type SolTestQuote } from "./contracts";

const integer = z.union([z.number().int().safe().nonnegative(), z.bigint().nonnegative()]);
const index = integer.transform(Number).refine(Number.isSafeInteger);
const transactionSchema = z.object({
  blockTime: index.nullable(),
  meta: z.object({ err: z.unknown(), preBalances: z.array(integer), postBalances: z.array(integer),
    loadedAddresses: z.object({ writable: z.array(z.string()), readonly: z.array(z.string()) }).optional() }),
  transaction: z.object({ signatures: z.array(z.string()), message: z.object({
    accountKeys: z.array(z.string()), header: z.object({ numRequiredSignatures: index, numReadonlyUnsignedAccounts: index, numReadonlySignedAccounts: index }),
    instructions: z.array(z.object({ programIdIndex: index, accounts: z.array(index), data: z.string() })),
  }) }),
});

// Only a top-level System transfer with exact net receipt and instruction-local reference.
// This verifier has no authority to credit a billing ledger.
export function verifySolTest(quote: SolTestQuote, signature: string, raw: unknown, genesis: string): string | null {
  if (genesis !== DEVNET_GENESIS || !solTestQuoteSchema.safeParse(quote).success) return "wrong_network_or_quote";
  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) return "unsupported_transaction";
  const tx = parsed.data;
  if (tx.meta.err !== null || tx.transaction.signatures[0] !== signature) return "failed_or_wrong_signature";
  if (tx.blockTime === null || tx.blockTime < quote.createdAt || tx.blockTime > quote.expiresAt) return "outside_quote";
  const message = tx.transaction.message;
  const staticCount = message.accountKeys.length;
  const loaded = tx.meta.loadedAddresses;
  const keys = [...message.accountKeys, ...(loaded?.writable ?? []), ...(loaded?.readonly ?? [])];
  if (new Set(keys).size !== keys.length || tx.meta.preBalances.length !== keys.length || tx.meta.postBalances.length !== keys.length) return "invalid_accounts";
  const header = message.header;
  if (header.numRequiredSignatures > staticCount || header.numReadonlySignedAccounts > header.numRequiredSignatures || header.numReadonlyUnsignedAccounts > staticCount - header.numRequiredSignatures) return "invalid_header";
  const writable = (i: number) => i >= 0 && (i < header.numRequiredSignatures
    ? i < header.numRequiredSignatures - header.numReadonlySignedAccounts
    : i < staticCount ? i < staticCount - header.numReadonlyUnsignedAccounts : i < staticCount + (loaded?.writable.length ?? 0));
  const reference = keys.indexOf(quote.reference);
  const destination = keys.indexOf(quote.recipient);
  if (reference < header.numRequiredSignatures || reference < 0 || writable(reference)) return "invalid_reference";
  if (destination < 0 || !writable(destination) || destination === reference) return "invalid_recipient";
  if (BigInt(tx.meta.postBalances[destination]) - BigInt(tx.meta.preBalances[destination]) !== BigInt(quote.amountAtomic)) return "wrong_received_amount";
  let matches = 0;
  for (const ix of message.instructions) {
    if (keys[ix.programIdIndex] !== SYSTEM_PROGRAM_ADDRESS || ix.accounts.length !== 3 || ix.accounts[2] !== reference) continue;
    const [source, dest] = ix.accounts;
    if (dest !== destination || source === destination || source >= header.numRequiredSignatures || !writable(source)) continue;
    try {
      const bytes = getBase58Encoder().encode(ix.data);
      if (bytes.length !== 12) continue;
      const data = getTransferSolInstructionDataDecoder().decode(bytes);
      if (data.discriminator === 2 && data.amount === BigInt(quote.amountAtomic)) matches++;
    } catch { /* Malformed external instruction is not a payment. */ }
  }
  return matches === 1 ? null : "missing_or_ambiguous_transfer";
}
