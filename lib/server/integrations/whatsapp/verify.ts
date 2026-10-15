import { getRuntimeConfig } from "@/lib/server/config/env";
import { ApiError } from "@/lib/server/http/errors";

import { classifyGraphFailure, graphPhoneNumberUrl, type GraphFailure } from "./graph";

const GRAPH_REQUEST_TIMEOUT_MS = 15_000;
const MAX_GRAPH_RESPONSE_BYTES = 64 * 1024;
const GRAPH_FIELDS = "id,display_phone_number,verified_name,quality_rating,platform_type,code_verification_status";

export interface PhoneNumberVerification {
  providerAssetId: string;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  qualityRating: string | null;
  platformType: string | null;
}

export type PhoneNumberVerificationResult =
  | { ok: true; verification: PhoneNumberVerification }
  | { ok: false; failure: GraphFailure };

/**
 * Reads the assets behind a phone number ID so a stored credential is only marked active after the
 * provider confirms the asset belongs to the authorized account.
 */
export async function fetchPhoneNumberVerification(input: {
  phoneNumberId: string;
  accessToken: string;
}): Promise<PhoneNumberVerificationResult> {
  const version = getRuntimeConfig().whatsapp.graphApiVersion;
  if (!version) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "WhatsApp Graph API version is not configured", { retryable: true });
  }

  const url = new URL(graphPhoneNumberUrl(version, input.phoneNumberId));
  url.searchParams.set("fields", GRAPH_FIELDS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${input.accessToken}` },
      signal: AbortSignal.timeout(GRAPH_REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    return { ok: false, failure: { classification: "unknown", code: null, details: "WhatsApp verification request failed" } };
  }

  const body = await readBoundedJson(response);
  if (!response.ok) {
    return { ok: false, failure: classifyGraphFailure(response.status, body) };
  }

  const verification = normalizePhoneNumberVerification(body);
  if (!verification) {
    return { ok: false, failure: { classification: "unknown", code: null, details: "WhatsApp verification response was malformed" } };
  }

  return { ok: true, verification };
}

export function normalizePhoneNumberVerification(raw: unknown): PhoneNumberVerification | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const id = (raw as { id?: unknown }).id;
  if (typeof id !== "string" || !/^[A-Za-z0-9_.:-]{1,128}$/.test(id)) {
    return null;
  }

  return {
    providerAssetId: id,
    displayPhoneNumber: readShortString(raw, "display_phone_number", 32),
    verifiedName: readShortString(raw, "verified_name", 256),
    qualityRating: readShortString(raw, "quality_rating", 32),
    platformType: readShortString(raw, "platform_type", 64),
  };
}

function readShortString(value: object, key: string, maxLength: number): string | null {
  const entry = (value as Record<string, unknown>)[key];
  if (typeof entry !== "string") {
    return null;
  }

  const normalized = entry.trim();
  return normalized.length > 0 && normalized.length <= maxLength ? normalized : null;
}

async function readBoundedJson(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (text.length === 0 || text.length > MAX_GRAPH_RESPONSE_BYTES) {
      return null;
    }
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
