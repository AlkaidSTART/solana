import { randomBytes, randomInt, randomUUID } from "node:crypto";

import { ApiError } from "@/lib/server/http/errors";
import { withTransaction, type TransactionSql } from "@/lib/server/db/client";
import { decryptSecret, encryptSecret } from "@/lib/server/security/secrets";
import { canonicalJsonDigest, hmacSha256Hex, safeEqual } from "@/lib/server/security/digests";
import { getRuntimeConfig } from "@/lib/server/config/env";
import { issueSessionInTransaction, serializeCsrfCookie, serializeSessionCookie } from "@/lib/server/auth/session";
import type { OtpDeliveryProvider } from "@/lib/server/auth/otp-provider";
import type { ApiRole } from "@/types/api/common";

const OTP_LIFETIME_MINUTES = 10;
const RATE_WINDOW_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const MAX_EMAIL_REQUESTS = 5;
const MAX_IP_REQUESTS = 20;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export interface OtpChallengeResult {
  challengeId: string;
  expiresAt: string;
  retryAfterSeconds: number;
  deliveryStatus: "pending" | "sent" | "failed" | "unknown";
}

interface MembershipChoice {
  id: string;
  tenantId: string;
  role: ApiRole;
}

export interface VerifiedOtpSession {
  user: { id: string; email: string; locale: string };
  memberships: MembershipChoice[];
  setCookie: readonly [string, string];
}

export async function requestOtp(input: {
  email: string;
  locale: string;
  idempotencyKey: string;
  credentialEncryptionKey: string;
  otpHmacKey: string;
  requestIpHash: string;
  provider: OtpDeliveryProvider;
}): Promise<OtpChallengeResult> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(422, "INVALID_EMAIL", "A valid email address is required");
  }
  if (!IDEMPOTENCY_KEY_PATTERN.test(input.idempotencyKey)) {
    throw new ApiError(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must contain 8 to 128 safe characters");
  }
  requireSecret(input.credentialEncryptionKey, "Credential encryption");
  requireSecret(input.otpHmacKey, "OTP signing");
  if (!/^[a-f0-9]{64}$/i.test(input.requestIpHash)) {
    throw new ApiError(400, "INVALID_REQUEST_IP_HASH", "Request IP digest is invalid");
  }
  const emailHash = hmacSha256Hex(input.otpHmacKey, email);
  const requestDigest = canonicalJsonDigest({ emailHash, locale: input.locale });
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const challengeId = randomUUID();
  const codeDigest = hmacSha256Hex(input.otpHmacKey, `${challengeId}:${code}`);
  const created = await withTransaction(async (transaction) => {
    await transaction`
      SELECT pg_advisory_xact_lock(hashtextextended(${"otp-request:" + input.idempotencyKey}, 0))
    `;
    const existingRows = await transaction<{
      id: string; request_digest: string; expires_at: Date; delivery_status: OtpChallengeResult["deliveryStatus"];
    }[]>`
      SELECT id, request_digest, expires_at, delivery_status
      FROM otp_challenges
      WHERE idempotency_key = ${input.idempotencyKey}
      FOR UPDATE
    `;
    const existing = existingRows[0];
    if (existing) {
      if (!safeEqual(existing.request_digest, requestDigest)) {
        throw new ApiError(409, "IDEMPOTENCY_KEY_REUSED", "Idempotency-Key was already used with a different request");
      }
      return { kind: "challenge" as const, created: false as const, result: toChallengeResult(existing.id, existing.expires_at, existing.delivery_status) };
    }

    const emailRetryAfter = await consumeRateLimit(transaction, "otp_email", emailHash, MAX_EMAIL_REQUESTS);
    if (emailRetryAfter !== null) return { kind: "limited" as const, retryAfter: emailRetryAfter };
    const ipRetryAfter = await consumeRateLimit(transaction, "otp_ip", input.requestIpHash, MAX_IP_REQUESTS);
    if (ipRetryAfter !== null) return { kind: "limited" as const, retryAfter: ipRetryAfter };

    const rows = await transaction<{ id: string; expires_at: Date; delivery_status: OtpChallengeResult["deliveryStatus"] }[]>`
      INSERT INTO otp_challenges (
        id, email_hash, email_ciphertext, idempotency_key, request_digest, code_digest, locale,
        delivery_status, delivery_attempt_count, attempt_count, expires_at, created_at, updated_at
      ) VALUES (
        ${challengeId}, ${emailHash}, ${encryptSecret(email, input.credentialEncryptionKey)},
        ${input.idempotencyKey}, ${requestDigest}, ${codeDigest}, ${input.locale},
        'pending', 0, 0, now() + (${OTP_LIFETIME_MINUTES} * interval '1 minute'), now(), now()
      )
      ON CONFLICT (email_hash, idempotency_key) DO NOTHING
      RETURNING id, expires_at, delivery_status
    `;
    if (rows[0]) {
      return { kind: "challenge" as const, created: true as const, result: toChallengeResult(rows[0].id, rows[0].expires_at, rows[0].delivery_status) };
    }

    const conflictedRows = await transaction<{
      id: string; request_digest: string; expires_at: Date; delivery_status: OtpChallengeResult["deliveryStatus"];
    }[]>`
      SELECT id, request_digest, expires_at, delivery_status
      FROM otp_challenges
      WHERE idempotency_key = ${input.idempotencyKey}
      FOR UPDATE
    `;
    const conflicted = conflictedRows[0];
    if (!conflicted) {
      throw new ApiError(503, "OTP_REQUEST_STATE_UNAVAILABLE", "OTP request state could not be resolved", { retryable: true });
    }
    if (!safeEqual(conflicted.request_digest, requestDigest)) {
      throw new ApiError(409, "IDEMPOTENCY_KEY_REUSED", "Idempotency-Key was already used with a different request");
    }
    return { kind: "challenge" as const, created: false as const, result: toChallengeResult(conflicted.id, conflicted.expires_at, conflicted.delivery_status) };
  });

  if (created.kind === "limited") {
    throw new ApiError(429, "OTP_RATE_LIMITED", "OTP request rate limit was reached", {
      retryable: true, headers: { "Retry-After": String(created.retryAfter) },
    });
  }
  if (!created.created) {
    return created.result;
  }
  if (!input.provider.available) {
    await withTransaction((transaction) => transaction`
      UPDATE otp_challenges SET delivery_status = 'failed', updated_at = now()
      WHERE id = ${created.result.challengeId} AND delivery_status = 'pending'
    `);
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "OTP email delivery is not configured", { retryable: true });
  }
  try {
    await input.provider.deliver({ email, code, locale: input.locale });
    await withTransaction((transaction) => transaction`
      UPDATE otp_challenges
      SET delivery_status = 'sent', delivery_attempt_count = 1,
          last_delivery_attempt_at = now(), updated_at = now()
      WHERE id = ${created.result.challengeId} AND delivery_status = 'pending'
    `);
    return { ...created.result, deliveryStatus: "sent" };
  } catch {
    await withTransaction((transaction) => transaction`
      UPDATE otp_challenges
      SET delivery_status = 'unknown', delivery_attempt_count = 1,
          last_delivery_attempt_at = now(), updated_at = now()
      WHERE id = ${created.result.challengeId} AND delivery_status = 'pending'
    `);
    return { ...created.result, deliveryStatus: "unknown" };
  }
}

/** Verify and consume an OTP, create the user and session atomically; this is the sole route-facing verification path. */
export async function verifyOtpAndIssueSession(input: {
  challengeId: string;
  code: string;
  otpHmacKey: string;
  credentialEncryptionKey: string;
  maxAgeSeconds?: number;
}): Promise<VerifiedOtpSession> {
  if (!/^\d{6}$/.test(input.code)) {
    throw new ApiError(400, "INVALID_OTP_FORMAT", "OTP must contain six digits");
  }
  requireSecret(input.otpHmacKey, "OTP signing");
  requireSecret(input.credentialEncryptionKey, "Credential encryption");
  const maxAgeSeconds = input.maxAgeSeconds ?? 60 * 60 * 24 * 30;
  if (!Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds < 1) {
    throw new RangeError("Session max age must be a positive safe integer");
  }

  const outcome = await withTransaction(async (transaction) => {
    const rows = await transaction<{
      id: string; email_hash: string; email_ciphertext: string; locale: string; code_digest: string;
      delivery_status: string; attempt_count: number; expires_at: Date; consumed_at: Date | null;
    }[]>`
      SELECT id, email_hash, email_ciphertext, locale, code_digest, delivery_status, attempt_count, expires_at, consumed_at
      FROM otp_challenges
      WHERE id = ${input.challengeId}
      FOR UPDATE
    `;
    const challenge = rows[0];
    if (!challenge) return { error: invalidOtp() } as const;
    if (challenge.consumed_at) return { error: new ApiError(409, "OTP_ALREADY_USED", "OTP challenge was already consumed") } as const;
    if (new Date(challenge.expires_at).getTime() <= Date.now()) return { error: new ApiError(410, "OTP_EXPIRED", "OTP challenge has expired") } as const;
    if (challenge.attempt_count >= MAX_OTP_ATTEMPTS) return { error: attemptsExceeded() } as const;
    if (challenge.delivery_status !== "sent") return { error: new ApiError(422, "OTP_DELIVERY_FAILED", "OTP was not delivered") } as const;

    const suppliedDigest = hmacSha256Hex(input.otpHmacKey, `${challenge.id}:${input.code}`);
    if (!safeEqual(challenge.code_digest, suppliedDigest)) {
      await transaction`
        UPDATE otp_challenges SET attempt_count = attempt_count + 1, updated_at = now()
        WHERE id = ${challenge.id} AND attempt_count < ${MAX_OTP_ATTEMPTS}
      `;
      return { error: invalidOtp() } as const;
    }

    await transaction`UPDATE otp_challenges SET consumed_at = now(), updated_at = now() WHERE id = ${challenge.id}`;
    const email = decryptSecret(challenge.email_ciphertext, input.credentialEncryptionKey);
    const userRows = await transaction<{ id: string; email: string; locale: string }[]>`
      INSERT INTO users (id, email, email_hash, locale, created_at, updated_at)
      VALUES (${randomUUID()}, ${email}, ${challenge.email_hash}, ${challenge.locale}, now(), now())
      ON CONFLICT (email_hash) DO UPDATE SET email = EXCLUDED.email, locale = EXCLUDED.locale, updated_at = now()
      WHERE users.disabled_at IS NULL
      RETURNING id, email, locale
    `;
    const user = userRows[0];
    if (!user) throw new ApiError(503, "AUTH_STATE_UNAVAILABLE", "User state could not be resolved", { retryable: true });
    const memberships = await transaction<{ id: string; tenant_id: string; role: string }[]>`
      SELECT m.id, m.tenant_id, m.role
      FROM memberships m JOIN tenants t ON t.id = m.tenant_id
      WHERE m.user_id = ${user.id} AND m.status = 'active' AND m.revoked_at IS NULL
        AND t.status = 'active' AND t.deleted_at IS NULL
      ORDER BY m.tenant_id, m.id
    `;
    const sessionId = randomUUID();
    const sessionToken = randomBytesToken();
    const csrfToken = randomBytesToken();
    const config = getRuntimeConfig();
    const sessionKey = config.security.sessionSigningKey;
    const csrfKey = config.security.csrfSigningKey;
    if (!sessionKey || Buffer.byteLength(sessionKey, "utf8") < 32 || !csrfKey || Buffer.byteLength(csrfKey, "utf8") < 32) {
      throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Session signing is not configured", { retryable: true });
    }
    const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000).toISOString();
    const sessionTokenHash = hmacSha256Hex(sessionKey, sessionToken);
    const csrfTokenHash = hmacSha256Hex(csrfKey, csrfToken);
    await issueSessionInTransaction(transaction, {
      sessionId, userId: user.id, tenantId: null, membershipId: null,
      sessionTokenHash, csrfTokenHash, expiresAt,
    });
    return {
      user,
      memberships: memberships.flatMap((membership): MembershipChoice[] => {
        const role = toApiRole(membership.role);
        return role ? [{ id: membership.id, tenantId: membership.tenant_id, role }] : [];
      }),
      setCookie: [serializeSessionCookie(sessionToken, maxAgeSeconds), serializeCsrfCookie(csrfToken, maxAgeSeconds)],
    } as const;
  });

  if ("error" in outcome) throw outcome.error;
  return outcome;
}

async function consumeRateLimit(transaction: TransactionSql, scope: "otp_email" | "otp_ip", keyHash: string, limit: number): Promise<number | null> {
  const rows = await transaction<{ request_count: number; blocked_until: Date | null }[]>`
    INSERT INTO rate_limit_buckets (scope, key_hash, window_started_at, request_count, blocked_until, updated_at)
    VALUES (${scope}, ${keyHash}, now(), 1, NULL, now())
    ON CONFLICT (scope, key_hash) DO UPDATE SET
      window_started_at = CASE WHEN rate_limit_buckets.window_started_at <= now() - (${RATE_WINDOW_MINUTES} * interval '1 minute') THEN now() ELSE rate_limit_buckets.window_started_at END,
      request_count = CASE WHEN rate_limit_buckets.window_started_at <= now() - (${RATE_WINDOW_MINUTES} * interval '1 minute') THEN 1 ELSE rate_limit_buckets.request_count + 1 END,
      blocked_until = CASE
        WHEN rate_limit_buckets.window_started_at <= now() - (${RATE_WINDOW_MINUTES} * interval '1 minute') THEN NULL
        WHEN rate_limit_buckets.request_count >= ${limit} THEN now() + interval '1 minute'
        ELSE rate_limit_buckets.blocked_until
      END,
      updated_at = now()
    RETURNING request_count, blocked_until
  `;
  const row = rows[0];
  if (!row) throw new ApiError(503, "RATE_LIMIT_UNAVAILABLE", "Request rate could not be checked", { retryable: true });
  if (row.request_count > limit || (row.blocked_until && new Date(row.blocked_until).getTime() > Date.now())) {
    const retryAfter = Math.max(1, Math.ceil((new Date(row.blocked_until ?? Date.now() + 60_000).getTime() - Date.now()) / 1000));
    return retryAfter;
  }
  return null;
}

function randomBytesToken(): string {
  return randomBytes(32).toString("base64url");
}

function requireSecret(value: string, label: string): void {
  if (!value || Buffer.byteLength(value, "utf8") < 32) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", `${label} is not configured`, { retryable: true });
  }
}

function toChallengeResult(id: string, expiresAt: Date, deliveryStatus: OtpChallengeResult["deliveryStatus"]): OtpChallengeResult {
  return { challengeId: id, expiresAt: new Date(expiresAt).toISOString(), retryAfterSeconds: 60, deliveryStatus };
}

function toApiRole(value: string): ApiRole | null {
  switch (value) {
    case "owner": return "Owner";
    case "admin": return "Admin";
    case "agent": return "Agent";
    case "finance": return "Finance";
    default: return null;
  }
}

function attemptsExceeded(): ApiError {
  return new ApiError(429, "OTP_ATTEMPTS_EXCEEDED", "OTP verification attempt limit was reached");
}

function invalidOtp(): ApiError {
  return new ApiError(401, "INVALID_OTP", "The OTP challenge or code is invalid");
}
