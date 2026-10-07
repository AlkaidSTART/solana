import { isAddress, isSignature } from "@solana/kit";
import { z } from "zod";

export const SOL_TEST_LAMPORTS = "1000000";
export const SOL_TEST_AMOUNT = "0.001";
export const SOL_TEST_SECONDS = 20 * 60;
export const solTestQuoteSchema = z.object({
  network: z.literal("devnet"), amountAtomic: z.literal(SOL_TEST_LAMPORTS),
  recipient: z.string().refine(isAddress), reference: z.string().refine(isAddress),
  createdAt: z.number().int().nonnegative(), expiresAt: z.number().int().positive(),
}).strict();
export type SolTestQuote = z.infer<typeof solTestQuoteSchema>;
export const solTestCheckoutSchema = z.object({ quote: solTestQuoteSchema, token: z.string().max(2048) });
export type SolTestCheckout = z.infer<typeof solTestCheckoutSchema>;
export const solTestCheckInput = z.object({ token: z.string().max(2048), signature: z.string().refine(isSignature) }).strict();
export const solTestStatusSchema = z.object({ status: z.enum(["pending", "confirmed", "verified", "invalid"]), reason: z.string().optional() });
export type SolTestStatus = z.infer<typeof solTestStatusSchema>;
