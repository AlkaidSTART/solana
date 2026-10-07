import { randomUUID } from "node:crypto";
import { isIP } from "node:net";

import { ApiError } from "@/lib/server/http/errors";
import { withDatabase, withTransaction } from "@/lib/server/db/client";
import { getRuntimeConfig } from "@/lib/server/config/env";
import { hmacSha256Hex } from "@/lib/server/security/digests";
import {
  createCsrfToken,
  createOpaqueSessionToken,
  hashSessionToken,
  issueSessionInTransaction,
  serializeCsrfCookie,
  serializeSessionCookie,
} from "@/lib/server/auth/session";
import type { SessionContext } from "@/lib/server/auth/types";
import type { ApiRole } from "@/types/api/common";

interface MembershipRow {
  id: string;
  tenant_id: string;
  tenant_name: string;
  market: string;
  timezone: string;
  role: string;
  store_ids: string[] | null;
}

export interface AuthSessionSnapshot {
  user: { id: string; email: string; locale: string };
  memberships: Array<{
    membershipId: string;
    tenant: { id: string; name: string; market: string; timezone: string };
    role: ApiRole;
    storeIds: string[];
  }>;
  currentTenant: { id: string; name: string; market: string; timezone: string } | null;
  role: ApiRole | null;
  storeIds: string[];
  onboarding: {
    status: "tenant_required" | "tenant_selection_required" | "unavailable";
    evidence: "no_tenant_membership" | "membership_selection_required" | "checks_not_implemented";
  };
}

export function appendSetCookies(response: Response, cookies: readonly string[]): Response {
  for (const cookie of cookies) {
    response.headers.append("Set-Cookie", cookie);
  }
  return response;
}

export function hashRequestIp(
  request: Request,
  otpHmacKey: string,
  trustProxyHeaders = false,
): string {
  const forwarded = trustProxyHeaders
    ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    : undefined;
  const real = trustProxyHeaders ? request.headers.get("x-real-ip")?.trim() : undefined;
  const candidate = forwarded && isIP(forwarded) ? forwarded : real && isIP(real) ? real : "unavailable";
  return hmacSha256Hex(otpHmacKey, `otp-ip:${candidate}`);
}

export async function getAuthSessionSnapshot(session: SessionContext): Promise<AuthSessionSnapshot> {
  return withDatabase(async (database) => {
    const users = await database<{ id: string; email: string; locale: string }[]>`
      SELECT id, email, locale FROM users WHERE id = ${session.userId} AND disabled_at IS NULL
    `;
    const user = users[0];
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication is required");
    }

    const rows = await database<MembershipRow[]>`
      SELECT
        m.id, m.tenant_id, t.name AS tenant_name, t.market, t.timezone, m.role,
        COALESCE(array_agg(DISTINCT sg.store_id) FILTER (WHERE sg.store_id IS NOT NULL), ARRAY[]::text[]) AS store_ids
      FROM memberships m
      JOIN tenants t ON t.id = m.tenant_id AND t.status = 'active' AND t.deleted_at IS NULL
      LEFT JOIN store_grants sg ON sg.membership_id = m.id AND sg.tenant_id = m.tenant_id AND sg.revoked_at IS NULL
      WHERE m.user_id = ${session.userId} AND m.status = 'active' AND m.revoked_at IS NULL
      GROUP BY m.id, m.tenant_id, t.name, t.market, t.timezone, m.role
      ORDER BY t.name, m.id
    `;
    const memberships = rows.flatMap((row) => {
      const role = toApiRole(row.role);
      return role ? [{
        membershipId: row.id,
        tenant: { id: row.tenant_id, name: row.tenant_name, market: row.market, timezone: row.timezone },
        role,
        storeIds: row.store_ids ?? [],
      }] : [];
    });
    const current = memberships.find((membership) => membership.membershipId === session.membershipId) ?? null;
    const onboarding: AuthSessionSnapshot["onboarding"] = session.tenantId
      ? { status: "unavailable", evidence: "checks_not_implemented" }
      : memberships.length > 0
        ? { status: "tenant_selection_required", evidence: "membership_selection_required" }
        : { status: "tenant_required", evidence: "no_tenant_membership" };

    return {
      user,
      memberships,
      currentTenant: current?.tenant ?? null,
      role: current?.role ?? null,
      storeIds: current?.storeIds ?? [],
      onboarding,
    };
  });
}

export async function switchTenantSession(
  session: SessionContext,
  membershipId: string,
): Promise<{
  membership: AuthSessionSnapshot["memberships"][number];
  setCookie: readonly [string, string];
}> {
  const config = getRuntimeConfig();
  const sessionKey = config.security.sessionSigningKey;
  const csrfKey = config.security.csrfSigningKey;
  if (!sessionKey || Buffer.byteLength(sessionKey, "utf8") < 32 || !csrfKey || Buffer.byteLength(csrfKey, "utf8") < 32) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Session signing is not configured", { retryable: true });
  }

  const sessionToken = createOpaqueSessionToken();
  const csrfToken = createCsrfToken();
  const maxAgeSeconds = 60 * 60 * 24 * 30;
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000).toISOString();
  return withTransaction(async (transaction) => {
    const rows = await transaction<MembershipRow[]>`
      SELECT
        m.id, m.tenant_id, t.name AS tenant_name, t.market, t.timezone, m.role,
        COALESCE(sg.store_ids, ARRAY[]::text[]) AS store_ids
      FROM memberships m
      JOIN tenants t ON t.id = m.tenant_id AND t.status = 'active' AND t.deleted_at IS NULL
      LEFT JOIN LATERAL (
        SELECT array_agg(DISTINCT sg.store_id) AS store_ids
        FROM store_grants sg
        WHERE sg.membership_id = m.id AND sg.tenant_id = m.tenant_id AND sg.revoked_at IS NULL
      ) sg ON TRUE
      WHERE m.id = ${membershipId} AND m.user_id = ${session.userId}
        AND m.status = 'active' AND m.revoked_at IS NULL
      FOR SHARE OF m, t
    `;
    const row = rows[0];
    const role = row ? toApiRole(row.role) : null;
    if (!row || !role) {
      throw new ApiError(404, "MEMBERSHIP_NOT_FOUND", "Membership was not found");
    }

    const revoked = await transaction<{ id: string }[]>`
      UPDATE sessions SET revoked_at = now()
      WHERE id = ${session.sessionId} AND user_id = ${session.userId} AND revoked_at IS NULL
      RETURNING id
    `;
    if (!revoked[0]) {
      throw new ApiError(401, "UNAUTHENTICATED", "Session is no longer active");
    }

    await issueSessionInTransaction(transaction, {
      sessionId,
      userId: session.userId,
      tenantId: row.tenant_id,
      membershipId: row.id,
      sessionTokenHash: hashSessionToken(sessionToken),
      csrfTokenHash: hmacSha256Hex(csrfKey, csrfToken),
      expiresAt,
    });

    return {
      membership: {
        membershipId: row.id,
        tenant: { id: row.tenant_id, name: row.tenant_name, market: row.market, timezone: row.timezone },
        role,
        storeIds: row.store_ids ?? [],
      },
      setCookie: createAuthCookies(sessionToken, csrfToken, maxAgeSeconds),
    };
  });
}

function createAuthCookies(sessionToken: string, csrfToken: string, maxAgeSeconds: number): [string, string] {
  return [serializeSessionCookie(sessionToken, maxAgeSeconds), serializeCsrfCookie(csrfToken, maxAgeSeconds)];
}

export async function revokeSession(session: SessionContext): Promise<void> {
  await withTransaction(async (transaction) => {
    await transaction`
      UPDATE sessions SET revoked_at = COALESCE(revoked_at, now())
      WHERE id = ${session.sessionId} AND user_id = ${session.userId}
    `;
  });
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
