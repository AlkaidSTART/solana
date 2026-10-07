import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  normalizeWooCommerceBaseUrl,
  normalizeWooCommerceOrderEvents,
  verifyWooCommerceSignature,
  wooCommercePayloadDigest,
} from "@/lib/server/integrations/woocommerce/core";

describe("WooCommerce webhook primitives", () => {
  it("verifies signatures against the exact raw request bytes", () => {
    const rawBody = new TextEncoder().encode('{"id":7}');
    const signature = createHmac("sha256", "secret").update(rawBody).digest("base64");

    expect([
      verifyWooCommerceSignature(rawBody, "secret", signature),
      verifyWooCommerceSignature(new TextEncoder().encode('{ "id":7}'), "secret", signature),
    ]).toEqual([true, false]);
  });

  it("normalizes https URLs and permits localhost http only when explicitly enabled", () => {
    expect([
      normalizeWooCommerceBaseUrl("https://shop.example/path/", false),
      normalizeWooCommerceBaseUrl("http://localhost:8080", true),
      normalizeWooCommerceBaseUrl("http://shop.example", true),
    ]).toEqual(["https://shop.example/path", "http://localhost:8080", null]);
  });

  it("turns completed WooCommerce orders into stop events without pending events", () => {
    expect(normalizeWooCommerceOrderEvents({ topic: "order.updated", status: "completed" })).toEqual([
      "order.paid",
      "order.fulfilled",
    ]);
  });

  it("digests raw payload bytes so delivery conflicts can be detected", () => {
    expect(wooCommercePayloadDigest(new TextEncoder().encode("{}")))
      .not.toBe(wooCommercePayloadDigest(new TextEncoder().encode("{ }")));
  });
});
