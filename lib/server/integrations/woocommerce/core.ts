import { createHmac, timingSafeEqual } from "node:crypto";

import { ApiError } from "@/lib/server/http/errors";
import { sha256Hex } from "@/lib/server/security/digests";

export type WooCommerceOrderEvent = "order.paid" | "order.cancelled" | "order.fulfilled" | "order.deleted";

export interface WooCommerceOrderSignal {
  topic: string;
  status?: string;
}

export interface WooCommerceConnectionInput {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

export function verifyWooCommerceSignature(rawBody: Uint8Array, secret: string, signature: string): boolean {
  if (!secret || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)$/.test(signature)) {
    return false;
  }

  const received = Buffer.from(signature, "base64");
  if (received.toString("base64") !== signature) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest();
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function normalizeWooCommerceBaseUrl(value: string, allowLocalHttp: boolean): string | null {
  try {
    const parsed = new URL(value.trim());
    const isLocalhost = parsed.hostname === "localhost"
      || parsed.hostname === "127.0.0.1"
      || parsed.hostname === "[::1]";
    if (
      (parsed.protocol !== "https:" && !(allowLocalHttp && isLocalhost && parsed.protocol === "http:"))
      || parsed.username
      || parsed.password
      || parsed.search
      || parsed.hash
    ) {
      return null;
    }

    const normalized = parsed.toString().replace(/\/+$/, "");
    return normalized || null;
  } catch {
    return null;
  }
}

export function wooCommercePayloadDigest(rawBody: Uint8Array): string {
  return sha256Hex(rawBody);
}

export function normalizeWooCommerceOrderEvents(signal: WooCommerceOrderSignal): WooCommerceOrderEvent[] {
  if (signal.topic === "order.deleted") {
    return ["order.deleted"];
  }
  if (signal.topic !== "order.created" && signal.topic !== "order.updated") {
    return [];
  }

  switch (signal.status?.toLowerCase()) {
    case "processing":
    case "paid":
      return ["order.paid"];
    case "completed":
      return ["order.paid", "order.fulfilled"];
    case "cancelled":
      return ["order.cancelled"];
    default:
      return [];
  }
}

export async function verifyWooCommerceConnection(input: WooCommerceConnectionInput): Promise<void> {
  const baseUrl = normalizeWooCommerceBaseUrl(input.baseUrl, process.env.NODE_ENV !== "production");
  if (!baseUrl) {
    throw new ApiError(422, "INVALID_STORE_URL", "WooCommerce URL must use HTTPS");
  }

  const auth = Buffer.from(`${input.consumerKey}:${input.consumerSecret}`, "utf8").toString("base64");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(`${baseUrl}/wp-json/wc/v3/system_status`, {
      method: "GET",
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });

    await response.body?.cancel();
    if (response.ok) {
      return;
    }
    if (response.status === 401 || response.status === 403) {
      throw new ApiError(422, "WOOCOMMERCE_CREDENTIALS_REJECTED", "WooCommerce rejected the configured credentials");
    }
    if (response.status >= 500 || response.status === 429) {
      throw new ApiError(503, "WOOCOMMERCE_UNAVAILABLE", "WooCommerce is temporarily unavailable", { retryable: true });
    }
    throw new ApiError(502, "WOOCOMMERCE_REQUEST_FAILED", "WooCommerce could not verify the connection");
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(503, "WOOCOMMERCE_UNAVAILABLE", "WooCommerce connection could not be verified", {
      retryable: true,
    });
  } finally {
    clearTimeout(timeout);
  }
}
