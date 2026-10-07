import "server-only";
import { randomUUID } from "node:crypto";
import { address, generateKeyPairSigner } from "@solana/kit";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import QRCode from "qrcode";

import { DEVNET_USDC, PRICE_VERSION, QUOTE_SECONDS, paymentUrl, quoteAtomic, type PaymentOrder } from "@/lib/payments/contracts";

import { paymentConfig } from "./config";
import { database } from "./database";
import { PaymentRepository } from "./repository";
import { paymentChain } from "./rpc";

export function paymentServices() {
  const config = paymentConfig();
  return { config, repository: new PaymentRepository(database()), chain: paymentChain(config.rpcUrl) };
}
export async function createQuote(tenant: string, credits: number, key: string) {
  const { config, chain, repository } = paymentServices();
  await chain.genesis();
  const [recipientAta] = await findAssociatedTokenPda({ owner: config.recipient, mint: address(DEVNET_USDC), tokenProgram: TOKEN_PROGRAM_ADDRESS });
  const reference = await generateKeyPairSigner();
  const now = Math.floor(Date.now() / 1000) * 1000;
  const order: PaymentOrder = { id: randomUUID(), tenantId: tenant, network: "devnet", mint: DEVNET_USDC, reference: reference.address, recipient: config.recipient, recipientAta, amountAtomic: quoteAtomic(credits), credits, priceVersion: PRICE_VERSION, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + QUOTE_SECONDS * 1000).toISOString(), status: "awaiting_payment", signature: null };
  return checkout(await repository.create(order, key));
}
export async function checkout(order: PaymentOrder) {
  const payUrl = paymentUrl(order);
  return { order, payUrl, qr: await QRCode.toDataURL(payUrl, { width: 240, margin: 4, errorCorrectionLevel: "M" }) };
}
