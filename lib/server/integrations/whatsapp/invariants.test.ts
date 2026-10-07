import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  advanceMessageStatus,
  classifyWebhookReplay,
  isOptOutMessage,
  mustStopAutomation,
  verifyWebhookSignature,
} from "./invariants";

describe("WhatsApp security and conversation invariants", () => {
  it("verifies the exact raw webhook bytes with the Meta signature format", () => {
    const secret = "app-secret";
    const rawBody = Buffer.from('{"z":1, "a":2}', "utf8");
    const signature = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;

    expect(verifyWebhookSignature(rawBody, signature, secret)).toBe(true);
    expect(verifyWebhookSignature(Buffer.from('{"z":1,"a":2}', "utf8"), signature, secret)).toBe(false);
  });

  it("rejects malformed or mismatched signatures", () => {
    const rawBody = Buffer.from("payload");

    expect(verifyWebhookSignature(rawBody, "sha256=not-hex", "app-secret")).toBe(false);
    expect(verifyWebhookSignature(rawBody, null, "app-secret")).toBe(false);
  });

  it("distinguishes an identical webhook replay from a reused event ID with changed content", () => {
    expect(classifyWebhookReplay("digest-a", "digest-a")).toBe("duplicate");
    expect(classifyWebhookReplay("digest-a", "digest-b")).toBe("conflict");
  });

  it("stops automation for human-controlled, resolved, or opted-out conversations", () => {
    expect(mustStopAutomation("automated", false)).toBe(false);
    expect(mustStopAutomation("human_active", false)).toBe(true);
    expect(mustStopAutomation("resolved", false)).toBe(true);
    expect(mustStopAutomation("automated", true)).toBe(true);
    expect(isOptOutMessage("Please unsubscribe me")).toBe(true);
    expect(isOptOutMessage("jangan kirim lagi")).toBe(true);
    expect(isOptOutMessage("Where is my order?")).toBe(false);
    expect(advanceMessageStatus("delivered", "sent")).toBe("delivered");
    expect(advanceMessageStatus("queued", "delivered")).toBe("delivered");
    expect(advanceMessageStatus("failed", "delivered")).toBe("failed");
  });
});
