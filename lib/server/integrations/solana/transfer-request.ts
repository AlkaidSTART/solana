import { randomBytes } from "node:crypto";

import { address, getAddressDecoder } from "@solana/kit";

import { ApiError } from "@/lib/server/http/errors";

export const SOLANA_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const NATIVE_USDC_MINTS = {
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
} as const;

export type PaymentCluster = keyof typeof NATIVE_USDC_MINTS;

export function assertSolanaAddress(value: string, field: string): string {
  try {
    return address(value).toString();
  } catch {
    throw new ApiError(503, "PAYMENT_CONFIGURATION_INVALID", `${field} is not a valid Solana address`, {
      retryable: false,
    });
  }
}

export function createReferenceAddress(): string {
  return getAddressDecoder().decode(randomBytes(32)).toString();
}

export function formatTokenAmount(amountMinor: string, decimals = 6): string {
  if (!/^\d+$/.test(amountMinor) || !Number.isSafeInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new ApiError(500, "PAYMENT_AMOUNT_INVALID", "Payment amount is invalid");
  }
  const normalized = BigInt(amountMinor);
  if (normalized <= BigInt(0)) {
    throw new ApiError(500, "PAYMENT_AMOUNT_INVALID", "Payment amount must be positive");
  }
  if (decimals === 0) {
    return normalized.toString();
  }

  const digits = normalized.toString().padStart(decimals + 1, "0");
  const whole = digits.slice(0, -decimals);
  const fractional = digits.slice(-decimals).replace(/0+$/, "");
  return fractional ? `${whole}.${fractional}` : whole;
}

export function createSolanaPayTransferUrl(input: {
  recipient: string;
  mint: string;
  reference: string;
  amountMinor: string;
  paymentOrderId: string;
}): string {
  const recipient = assertSolanaAddress(input.recipient, "Solana recipient");
  const mint = assertSolanaAddress(input.mint, "USDC mint");
  const reference = assertSolanaAddress(input.reference, "Payment reference");
  const parameters = new URLSearchParams();
  parameters.set("amount", formatTokenAmount(input.amountMinor));
  parameters.set("spl-token", mint);
  parameters.append("reference", reference);
  parameters.set("label", "SolaFlow AI");
  parameters.set("message", "SolaFlow AI credits purchase");
  parameters.set("memo", input.paymentOrderId);
  return `solana:${recipient}?${parameters.toString()}`;
}
