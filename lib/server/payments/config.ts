import "server-only";
import { address } from "@solana/kit";
import { z } from "zod";

export function paymentConfig() {
  if (process.env.NODE_ENV === "production" || process.env.PAYMENTS_DEVNET_ENABLED !== "true") throw new Error("Devnet payments disabled");
  const env = z.object({ DATABASE_URL: z.string().min(1), SOLANA_RECIPIENT: z.string().min(32), SOLANA_RPC_URL: z.url().default("https://api.devnet.solana.com"), PAYMENT_APP_ORIGIN: z.url() }).parse(process.env);
  return { databaseUrl: env.DATABASE_URL, recipient: address(env.SOLANA_RECIPIENT), rpcUrl: env.SOLANA_RPC_URL, origin: new URL(env.PAYMENT_APP_ORIGIN).origin };
}
