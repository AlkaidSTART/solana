import { ApiError } from "@/lib/server/http/errors";
import { safeEqual, hmacSha256Hex } from "@/lib/server/security/digests";

export interface CsrfOptions {
  allowedOrigins: readonly string[];
  signingKey: string;
}

export async function assertCsrf(
  request: Request,
  sessionTokenHash: string,
  options: CsrfOptions,
): Promise<void> {
  const origin = request.headers.get("Origin");
  const headerToken = request.headers.get("X-CSRF-Token");
  const cookieToken = readCookie(request.headers.get("Cookie"), csrfCookieName());

  if (
    !origin
    || !options.allowedOrigins.includes(origin)
    || !headerToken
    || !cookieToken
    || !safeEqual(headerToken, cookieToken)
  ) {
    throw csrfRejected();
  }

  if (Buffer.byteLength(options.signingKey, "utf8") < 32) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "CSRF signing is not configured", { retryable: true });
  }
  const suppliedHash = hmacSha256Hex(options.signingKey, headerToken);
  if (!safeEqual(suppliedHash, sessionTokenHash)) {
    throw csrfRejected();
  }
}

function csrfCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-solaflow_csrf"
    : "solaflow_csrf";
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) {
      continue;
    }

    const rawValue = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return null;
    }
  }

  return null;
}

function csrfRejected(): ApiError {
  return new ApiError(403, "CSRF_REJECTED", "Origin or CSRF token is invalid");
}
