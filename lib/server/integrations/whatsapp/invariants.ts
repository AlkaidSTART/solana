import { createHmac } from "node:crypto";

import { safeEqual } from "@/lib/server/security/digests";

export type ConversationState = "automated" | "waiting_human" | "human_active" | "resolved";
export type DeliveryStatus = "received" | "queued" | "unknown" | "accepted" | "sent" | "delivered" | "read" | "failed";

export function verifyWebhookSignature(rawBody: Uint8Array, signature: string | null, appSecret: string): boolean {
  if (!signature || !appSecret || !/^sha256=[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  return safeEqual(expected.toLowerCase(), signature.toLowerCase());
}

export function classifyWebhookReplay(previousDigest: string, incomingDigest: string): "duplicate" | "conflict" {
  return safeEqual(previousDigest, incomingDigest) ? "duplicate" : "conflict";
}

export function mustStopAutomation(state: ConversationState, optedOut: boolean): boolean {
  return optedOut || state !== "automated";
}

export function isOptOutMessage(value: string): boolean {
  const normalized = value.toLowerCase().replace(/[.!?,]/g, " ").trim().replace(/\s+/g, " ");
  return /^(?:please )?(?:stop|unsubscribe|cancel messages?|stop messages?|no more messages?|berhenti|jangan kirim lagi|jangan hubungi saya lagi|berhenti mengirim|tidak mau menerima pesan)(?: me)?$/.test(normalized);
}

export function advanceMessageStatus(current: DeliveryStatus, incoming: DeliveryStatus): DeliveryStatus {
  if (current === "failed") return current;
  const rank: Record<DeliveryStatus, number> = {
    received: 0,
    queued: 0,
    unknown: 0,
    accepted: 1,
    sent: 2,
    failed: 2,
    delivered: 3,
    read: 4,
  };
  return rank[incoming] > rank[current] ? incoming : current;
}
