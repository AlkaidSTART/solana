import { getBase58Decoder } from "@solana/kit";

import { DEVNET_USDC, PRICE_VERSION, TOKEN_PROGRAM, type PaymentOrder } from "../../lib/payments/contracts";

export const testAddress = (n: number) => getBase58Decoder().decode(new Uint8Array(32).fill(n));
export const testSignature = getBase58Decoder().decode(new Uint8Array(64).fill(7));
export const tenant = "11111111-1111-4111-8111-111111111111";
export function orderFixture(): PaymentOrder {
  return { id: "22222222-2222-4222-8222-222222222222", tenantId: tenant, network: "devnet", reference: testAddress(4), recipient: testAddress(5), recipientAta: testAddress(6), mint: DEVNET_USDC, amountAtomic: "2000000", credits: 100, priceVersion: PRICE_VERSION, createdAt: "2026-10-07T00:00:00.000Z", expiresAt: "2026-10-07T00:20:00.000Z", status: "awaiting_payment", signature: null };
}
export function transactionFixture(checked = true) {
  const order = orderFixture();
  const data = new Uint8Array(checked ? 10 : 9);
  data[0] = checked ? 12 : 3;
  new DataView(data.buffer).setBigUint64(1, BigInt(order.amountAtomic), true);
  if (checked) data[9] = 6;
  const balance = (accountIndex: number, owner: string, amount: string) => ({ accountIndex, mint: order.mint, owner, programId: TOKEN_PROGRAM, uiTokenAmount: { amount, decimals: 6 } });
  return {
    blockTime: Date.parse("2026-10-07T00:01:00Z") / 1000 as number | null,
    meta: { err: null as unknown, preTokenBalances: [balance(1, testAddress(1), "9000000"), balance(2, order.recipient, "0")], postTokenBalances: [balance(1, testAddress(1), "7000000"), balance(2, order.recipient, "2000000")] },
    transaction: { signatures: [testSignature], message: { accountKeys: [testAddress(1), testAddress(2), order.recipientAta, order.mint, TOKEN_PROGRAM, order.reference], header: { numRequiredSignatures: 1, numReadonlyUnsignedAccounts: 3 }, instructions: [{ programIdIndex: 4, accounts: checked ? [1, 3, 2, 0, 5] : [1, 2, 0, 5], data: getBase58Decoder().decode(data) }] } },
  };
}
