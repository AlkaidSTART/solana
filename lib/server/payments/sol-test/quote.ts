import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getBase58Decoder } from "@solana/kit";

import { SOL_TEST_LAMPORTS, SOL_TEST_SECONDS, solTestQuoteSchema, type SolTestCheckout, type SolTestQuote } from "@/lib/payments/sol-test/contracts";

// Local, single-process test capability; not a production session or durable receipt.
const local = globalThis as typeof globalThis & { solTestKey?: Buffer };
local.solTestKey ??= randomBytes(32);
const processKey = local.solTestKey;
export function createSolTestQuotes(key = processKey, now = () => Math.floor(Date.now() / 1000)) {
  const mac = (payload: string) => createHmac("sha256", key).update(payload).digest();
  return {
    issue(recipient: string): SolTestCheckout {
      const createdAt = now();
      const quote = solTestQuoteSchema.parse({ network: "devnet", amountAtomic: SOL_TEST_LAMPORTS, recipient,
        reference: getBase58Decoder().decode(randomBytes(32)), createdAt, expiresAt: createdAt + SOL_TEST_SECONDS });
      const payload = Buffer.from(JSON.stringify(quote)).toString("base64url");
      return { quote, token: `${payload}.${mac(payload).toString("base64url")}` };
    },
    read(token: string, recipient: string): SolTestQuote {
      const [payload, tag, extra] = token.split(".");
      if (!payload || !tag || extra !== undefined || token.length > 2048) throw new Error("invalid_quote");
      const supplied = Buffer.from(tag, "base64url");
      const expected = mac(payload);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error("invalid_quote");
      const quote = solTestQuoteSchema.parse(JSON.parse(Buffer.from(payload, "base64url").toString()));
      // Permit checking old transactions after quote expiry; chain time must be within it.
      if (quote.recipient !== recipient || quote.createdAt > now() || quote.expiresAt - quote.createdAt !== SOL_TEST_SECONDS) throw new Error("invalid_quote");
      return quote;
    },
  };
}
