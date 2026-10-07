import { z } from "zod";

export const DEVNET_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
export const PRICE_VERSION = "credits-2026-10-07";
export const QUOTE_SECONDS = 20 * 60;
export const creditInput = z.object({ credits: z.number().int().min(100).max(100_000) }).strict();
export const orderSchema = z.object({
  id: z.uuid(), tenantId: z.uuid(), network: z.literal("devnet"),
  reference: z.string(), recipient: z.string(), recipientAta: z.string(), mint: z.literal(DEVNET_USDC),
  amountAtomic: z.string().regex(/^\d+$/), credits: z.number().int(), priceVersion: z.literal(PRICE_VERSION),
  createdAt: z.iso.datetime(), expiresAt: z.iso.datetime(),
  status: z.enum(["awaiting_payment", "confirmed", "credited", "expired", "review_required", "cancelled"]),
  signature: z.string().nullable(),
});
export type PaymentOrder = z.infer<typeof orderSchema>;
export const checkoutSchema = z.object({ order: orderSchema, payUrl: z.string(), qr: z.string() });
export type Checkout = z.infer<typeof checkoutSchema>;
export const deleteOrderSchema = z.object({ success: z.boolean(), id: z.uuid() });
export type DeleteOrderResult = z.infer<typeof deleteOrderSchema>;
export const billingSchema = z.object({
  tenantId: z.uuid(), availableCredits: z.number().int(),
  orders: z.array(orderSchema),
  ledger: z.array(z.object({ orderId: z.uuid(), credits: z.number().int(), signature: z.string(), createdAt: z.iso.datetime(), expiresAt: z.iso.datetime() })),
});
export function quoteAtomic(credits: number): string {
  return (BigInt(creditInput.parse({ credits }).credits) * BigInt(20_000)).toString();
}
export function formatUsdc(atomic: string): string {
  const value = BigInt(atomic);
  return `${value / BigInt(1_000_000)}.${(value % BigInt(1_000_000)).toString().padStart(6, "0")}`;
}
export function paymentUrl(order: PaymentOrder): string {
  const params = new URLSearchParams({ amount: formatUsdc(order.amountAtomic), "spl-token": order.mint, reference: order.reference, label: "SolaFlow Devnet", message: "Test Credits only - no monetary value" });
  return `solana:${order.recipient}?${params}`;
}
export function explorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;
}
