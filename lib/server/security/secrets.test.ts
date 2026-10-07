import { describe, expect, it } from "vitest";

import { decryptSecret, encryptSecret } from "./secrets";
import {
  canonicalJsonDigest,
  hmacSha256Hex,
  safeEqual,
  sha256Hex,
} from "./digests";

const key = Buffer.alloc(32, 7).toString("base64");

describe("server secret and digest primitives", () => {
  it("encrypts secrets in a versioned authenticated envelope and decrypts them", () => {
    const plaintext = "wc_secret_example";
    const ciphertext = encryptSecret(plaintext, key);

    expect(ciphertext).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(ciphertext).not.toContain(plaintext);
    expect(decryptSecret(ciphertext, key)).toBe(plaintext);
  });

  it("rejects ciphertext tampering and invalid keys", () => {
    const ciphertext = encryptSecret("credential", key);
    const parts = ciphertext.split(".");
    const tag = parts[2] ?? "";
    parts[2] = `${tag.startsWith("A") ? "B" : "A"}${tag.slice(1)}`;

    expect(() => decryptSecret(parts.join("."), key)).toThrow();
    expect(() => encryptSecret("credential", "not-a-key")).toThrow();
  });

  it("hashes with SHA-256 and HMAC-SHA-256 without exposing timing-sensitive equality", () => {
    const digest = sha256Hex("payload");
    const signature = hmacSha256Hex("webhook-key", "payload");

    expect(digest).toBe("239f59ed55e737c77147cf55ad0c1b030b6d7ee748a7426952f9b852d5a935e5");
    expect(safeEqual(signature, hmacSha256Hex("webhook-key", "payload"))).toBe(true);
    expect(safeEqual(signature, hmacSha256Hex("other-key", "payload"))).toBe(false);
    expect(safeEqual("a", "longer")).toBe(false);
  });

  it("computes stable digests from canonical JSON while preserving array order", () => {
    expect(canonicalJsonDigest({ b: 2, a: 1 })).toBe(canonicalJsonDigest({ a: 1, b: 2 }));
    expect(canonicalJsonDigest(["a", "b"])).not.toBe(canonicalJsonDigest(["b", "a"]));
    expect(canonicalJsonDigest(JSON.parse('{"__proto__":1}') as unknown)).not.toBe(canonicalJsonDigest({}));
    expect(() => canonicalJsonDigest(new Array(1))).toThrow();
    expect(() => canonicalJsonDigest([undefined])).toThrow();
  });
});
