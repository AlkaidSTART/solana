import { randomBytes, randomUUID } from "node:crypto";

import { issueSessionInTransaction, serializeCsrfCookie, serializeSessionCookie } from "@/lib/server/auth/session";
import { getRuntimeConfig } from "@/lib/server/config/env";
import { withTransaction } from "@/lib/server/db/client";
import { ApiError } from "@/lib/server/http/errors";
import { hmacSha256Hex } from "@/lib/server/security/digests";
import type { ApiRole } from "@/types/api/common";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

interface MembershipChoice {
  id: string;
  tenantId: string;
  role: ApiRole;
}

export interface NeonIdentitySession {
  user: { id: string; email: string; locale: string };
  memberships: MembershipChoice[];
  setCookie: readonly [string, string];
}

/**
 * Provisions the local user for an identity already verified by Neon Auth and issues this
 * repository's own session, so tenant scope, RBAC and billing keep a single source of truth.
 */
export async function issueSessionForNeonIdentity(input: {
  email: string;
  locale: string;
}): Promise<NeonIdentitySession> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(422, "INVALID_EMAIL", "A valid email address is required");
  }

  const { security } = getRuntimeConfig();
  const otpHmacKey = security.otpHmacKey;
  const sessionSigningKey = security.sessionSigningKey;
  const csrfSigningKey = security.csrfSigningKey;
  if (!isUsableKey(otpHmacKey) || !isUsableKey(sessionSigningKey) || !isUsableKey(csrfSigningKey)) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Session signing is not configured", { retryable: true });
  }

  const emailHash = hmacSha256Hex(otpHmacKey, email);
  const sessionToken = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000).toISOString();

  return withTransaction(async (transaction) => {
    const userRows = await transaction<{ id: string; email: string; locale: string }[]>`
      INSERT INTO users (id, email, email_hash, locale, created_at, updated_at)
      VALUES (${randomUUID()}, ${email}, ${emailHash}, ${input.locale}, now(), now())
      ON CONFLICT (email_hash) DO UPDATE SET email = EXCLUDED.email, locale = EXCLUDED.locale, updated_at = now()
      WHERE users.disabled_at IS NULL
      RETURNING id, email, locale
    `;
    const user = userRows[0];
    if (!user) {
      throw new ApiError(403, "ACCOUNT_DISABLED", "This account is disabled");
    }

    const membershipRows = await transaction<{ id: string; tenant_id: string; role: string }[]>`
      SELECT m.id, m.tenant_id, m.role
      FROM memberships m JOIN tenants t ON t.id = m.tenant_id
      WHERE m.user_id = ${user.id} AND m.status = 'active' AND m.revoked_at IS NULL
        AND t.status = 'active' AND t.deleted_at IS NULL
      ORDER BY m.tenant_id, m.id
    `;
    const memberships = membershipRows.flatMap((row): MembershipChoice[] => {
      const role = toApiRole(row.role);
      return role ? [{ id: row.id, tenantId: row.tenant_id, role }] : [];
    });

    // A merchant bound to exactly one tenant lands straight in it; ambiguity stays unresolved
    // until the user picks a membership, so the server never guesses a tenant.
    const sole = memberships.length === 1 ? memberships[0] : null;
    await issueSessionInTransaction(transaction, {
      sessionId: randomUUID(),
      userId: user.id,
      tenantId: sole?.tenantId ?? null,
      membershipId: sole?.id ?? null,
      sessionTokenHash: hmacSha256Hex(sessionSigningKey, sessionToken),
      csrfTokenHash: hmacSha256Hex(csrfSigningKey, csrfToken),
      expiresAt,
    });

    return {
      user,
      memberships,
      setCookie: [serializeSessionCookie(sessionToken, MAX_AGE_SECONDS), serializeCsrfCookie(csrfToken, MAX_AGE_SECONDS)],
    };
  });
}

function isUsableKey(value: string | null): value is string {
  return typeof value === "string" && Buffer.byteLength(value, "utf8") >= 32;
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
