import { getBase58Encoder } from "@solana/kit";
import { z } from "zod";

import { DEVNET_GENESIS, DEVNET_USDC, TOKEN_PROGRAM, type PaymentOrder } from "./contracts";

const integer = z.union([z.number().int().safe(), z.bigint()]).transform(Number);
const balance = z.object({ accountIndex: integer, mint: z.string(), owner: z.string(), programId: z.string(), uiTokenAmount: z.object({ amount: z.string().regex(/^\d+$/), decimals: integer }) });
const transactionSchema = z.object({
  blockTime: integer.nullable(),
  meta: z.object({ err: z.unknown(), preTokenBalances: z.array(balance), postTokenBalances: z.array(balance), loadedAddresses: z.object({ writable: z.array(z.string()), readonly: z.array(z.string()) }).optional() }),
  transaction: z.object({ signatures: z.array(z.string()), message: z.object({
    accountKeys: z.array(z.string()),
    header: z.object({ numRequiredSignatures: integer, numReadonlyUnsignedAccounts: integer }),
    instructions: z.array(z.object({ programIdIndex: integer, accounts: z.array(integer), data: z.string() })),
  }) }),
});
export type VerifiedTransfer = { signature: string; position: number; blockTime: number };
export type Verification = { kind: "valid"; transfer: VerifiedTransfer } | { kind: "invalid"; reason: string };

// Fail closed: only top-level SPL Token transfers with an instruction-local reference.
// Net balance evidence prevents self transfers and multi-instruction over/underpayment.
export function verifyTransfer(order: PaymentOrder, signature: string, raw: unknown, genesis: string): Verification {
  const reject = (reason: string): Verification => ({ kind: "invalid", reason });
  if (genesis !== DEVNET_GENESIS || order.network !== "devnet" || order.mint !== DEVNET_USDC) return reject("wrong_network_or_mint");
  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) return reject("unsupported_transaction");
  const tx = parsed.data;
  if (tx.meta.err !== null || tx.transaction.signatures[0] !== signature) return reject("failed_or_wrong_signature");
  if (tx.blockTime === null) return reject("missing_chain_time");
  if (tx.blockTime * 1000 < Date.parse(order.createdAt) || tx.blockTime * 1000 > Date.parse(order.expiresAt)) return reject("outside_quote");
  const message = tx.transaction.message;
  const loaded = tx.meta.loadedAddresses;
  const keys = [...message.accountKeys, ...(loaded?.writable ?? []), ...(loaded?.readonly ?? [])];
  const referenceIndex = keys.indexOf(order.reference);
  const staticCount = message.accountKeys.length;
  const readonlyStart = staticCount - message.header.numReadonlyUnsignedAccounts;
  const isReadonly = referenceIndex < staticCount
    ? referenceIndex >= readonlyStart && referenceIndex >= message.header.numRequiredSignatures
    : referenceIndex >= staticCount + (loaded?.writable.length ?? 0);
  if (referenceIndex < 0 || !isReadonly) return reject("invalid_reference");
  const destIndex = keys.indexOf(order.recipientAta);
  const post = tx.meta.postTokenBalances.find((b) => b.accountIndex === destIndex);
  const pre = tx.meta.preTokenBalances.find((b) => b.accountIndex === destIndex);
  const validBalance = (b: z.infer<typeof balance>) => b.mint === order.mint && b.owner === order.recipient && b.programId === TOKEN_PROGRAM && b.uiTokenAmount.decimals === 6;
  if (!post || !validBalance(post) || (pre && !validBalance(pre))) return reject("wrong_recipient_or_token");
  if (BigInt(post.uiTokenAmount.amount) - BigInt(pre?.uiTokenAmount.amount ?? "0") !== BigInt(order.amountAtomic)) return reject("wrong_received_amount");
  const matches: number[] = [];
  for (const [position, ix] of message.instructions.entries()) {
    if (keys[ix.programIdIndex] !== TOKEN_PROGRAM || !ix.accounts.includes(referenceIndex)) continue;
    let bytes: Uint8Array;
    try { bytes = new Uint8Array(getBase58Encoder().encode(ix.data)); } catch { continue; }
    const checked = bytes[0] === 12 && bytes.length === 10 && bytes[9] === 6;
    const unchecked = bytes[0] === 3 && bytes.length === 9;
    if (!checked && !unchecked) continue;
    const destination = ix.accounts[checked ? 2 : 1];
    const source = ix.accounts[0];
    if (destination !== destIndex || source === destination) continue;
    if (checked && keys[ix.accounts[1]] !== order.mint) continue;
    const sourceBalance = tx.meta.preTokenBalances.find((b) => b.accountIndex === source);
    if (!sourceBalance || sourceBalance.mint !== order.mint || sourceBalance.programId !== TOKEN_PROGRAM || sourceBalance.uiTokenAmount.decimals !== 6) continue;
    const amount = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getBigUint64(1, true);
    if (amount === BigInt(order.amountAtomic)) matches.push(position);
  }
  if (matches.length !== 1) return reject("missing_or_ambiguous_transfer");
  return { kind: "valid", transfer: { signature, position: matches[0], blockTime: tx.blockTime } };
}
