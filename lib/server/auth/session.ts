import { randomBytes } from "node:crypto";

import { ApiError } from "@/lib/server/http/errors";
import { withDatabase, withTransaction, type TransactionSql } from "@/lib/server/db/client";
import { getRuntimeConfig } from "@/lib/server/config/env";
import { hmacSha256Hex } from "@/lib/server/security/digests";
import { requireRole } from "@/lib/server/auth/roles";
import { assertCsrf } from "@/lib/server/auth/csrf";
import type { ActorContext, SessionContext } from "@/lib/server/auth/types";
import type { ApiRole } from "@/types/api/common";

const SESSION_COOKIE_BASE = "solaflow_session";
const CSRF_COOKIE_BASE = "solaflow_csrf";
const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

interface SessionRow {
  user_id: string;
  tenant_id: string | null;
  membership_id: string | null;
  role: string | null;
  store_ids: string[] | null;
  session_id: string;
  csrf_token_hash: string;
}

export async function resolveSession(request: Request): Promise<SessionContext | null> {
  const token = readCookie(request.headers.get("Cookie"), sessionCookieName());
  if (!token || token.length < 32 || token.length > 512) {
    return null;
  }

  const config = getRuntimeConfig();
  const tokenHash = signingDigest(config.security.sessionSigningKey, token, "Session");
  const rows = await withDatabase((database) => database<SessionRow[]>`
    SELECT
      s.user_id,
      s.tenant_id,
      s.membership_id,
      m.role,
      COALESCE(array_remove(array_agg(DISTINCT sg.store_id), NULL), ARRAY[]::text[]) AS store_ids,
      s.id AS session_id,
      s.csrf_token_hash
    FROM sessions s
    JOIN users u ON u.id = s.user_id AND u.disabled_at IS NULL
    LEFT JOIN memberships m
      ON m.id = s.membership_id
      AND m.tenant_id = s.tenant_id
      AND m.user_id = s.user_id
      AND m.status = 'active'
      AND m.revoked_at IS NULL
    LEFT JOIN tenants t
      ON t.id = s.tenant_id
      AND t.status = 'active'
      AND t.deleted_at IS NULL
    LEFT JOIN store_grants sg
      ON sg.membership_id = m.id
      AND sg.tenant_id = m.tenant_id
      AND sg.revoked_at IS NULL
    WHERE s.token_hash = ${tokenHash}
      AND s.revoked_at IS NULL
      AND s.expires_at > now()
      AND (
        (s.tenant_id IS NULL AND s.membership_id IS NULL)
        OR (m.id IS NOT NULL AND t.id IS NOT NULL)
      )
    GROUP BY s.id, s.user_id, s.tenant_id, s.membership_id, m.role, s.csrf_token_hash
    LIMIT 1
  `);
  const row = rows[0];
  if (!row || (row.role !== null && !toApiRole(row.role))) {
    return null;
  }

  return {
    userId: row.user_id,
    tenantId: row.tenant_id,
    membershipId: row.membership_id,
    role: row.role === null ? null : toApiRole(row.role),
    storeIds: row.store_ids ?? [],
    sessionId: row.session_id,
    csrfTokenHash: row.csrf_token_hash,
  };
}

export async function resolveActor(request: Request): Promise<ActorContext | null> {
  const session = await resolveSession(request);
  if (!session || !session.tenantId || !session.membershipId || !session.role) {
    return null;
  }

  return {
    userId: session.userId,
    tenantId: session.tenantId,
    membershipId: session.membershipId,
    role: session.role,
    storeIds: session.storeIds,
    sessionId: session.sessionId,
    csrfTokenHash: session.csrfTokenHash,
  };
}

export async function issueSession(input: {
  userId: string;
  tenantId?: string | null;
  membershipId?: string | null;
  maxAgeSeconds?: number;
}): Promise<{ sessionId: string; expiresAt: string; setCookie: string[] }> {
  const tenantId = input.tenantId ?? null;
  const membershipId = input.membershipId ?? null;
  if ((tenantId === null) !== (membershipId === null)) {
    throw new ApiError(400, "INVALID_SESSION_MEMBERSHIP", "Tenant and membership must be set together");
  }

  const maxAgeSeconds = input.maxAgeSeconds ?? DEFAULT_SESSION_MAX_AGE_SECONDS;
  if (!Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds < 1) {
    throw new RangeError("Session max age must be a positive safe integer");
  }

  const sessionId = randomBytes(16).toString("hex");
  const sessionToken = createOpaqueSessionToken();
  const csrfToken = createCsrfToken();
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);
  const config = getRuntimeConfig();
  const sessionTokenHash = signingDigest(config.security.sessionSigningKey, sessionToken, "Session");
  const csrfTokenHash = signingDigest(config.security.csrfSigningKey, csrfToken, "CSRF");
  await withTransaction((transaction) => issueSessionInTransaction(transaction, {
    sessionId, userId: input.userId, tenantId, membershipId, sessionTokenHash, csrfTokenHash,
    expiresAt: expiresAt.toISOString(),
  }));

  return {
    sessionId,
    expiresAt: expiresAt.toISOString(),
    setCookie: [
      serializeSessionCookie(sessionToken, maxAgeSeconds),
      serializeCsrfCookie(csrfToken, maxAgeSeconds),
    ],
  };
}

export async function requireUser(request: Request): Promise<SessionContext> {
  const session = await resolveSession(request);
  if (!session) {
    throw new ApiError(401, "UNAUTHENTICATED", "Authentication is required");
  }

  return session;
}

export async function requireActor(
  request: Request,
  allowedRoles?: readonly ApiRole[],
): Promise<ActorContext> {
  const session = await resolveSession(request);
  if (!session) {
    throw new ApiError(401, "UNAUTHENTICATED", "Authentication is required");
  }
  if (!session.tenantId || !session.membershipId || !session.role) {
    throw new ApiError(403, "TENANT_MEMBERSHIP_REQUIRED", "Select an active tenant membership to continue");
  }

  const actor: ActorContext = {
    userId: session.userId,
    tenantId: session.tenantId,
    membershipId: session.membershipId,
    role: session.role,
    storeIds: session.storeIds,
    sessionId: session.sessionId,
    csrfTokenHash: session.csrfTokenHash,
  };
  return allowedRoles ? requireRole(actor, allowedRoles) : actor;
}

export function createOpaqueSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function createCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

export function serializeSessionCookie(
  token: string,
  maxAgeSeconds = DEFAULT_SESSION_MAX_AGE_SECONDS,
): string {
  return serializeCookie(sessionCookieName(), token, {
    httpOnly: true,
    maxAgeSeconds,
  });
}

export function clearSessionCookie(): string {
  return serializeCookie(sessionCookieName(), "", { httpOnly: true, maxAgeSeconds: 0 });
}

export function serializeCsrfCookie(
  token: string,
  maxAgeSeconds = DEFAULT_SESSION_MAX_AGE_SECONDS,
): string {
  return serializeCookie(csrfCookieName(), token, { httpOnly: false, maxAgeSeconds });
}

export function clearCsrfCookie(): string {
  return serializeCookie(csrfCookieName(), "", { httpOnly: false, maxAgeSeconds: 0 });
}

export function hashSessionToken(token: string): string {
  return signingDigest(getRuntimeConfig().security.sessionSigningKey, token, "Session");
}

export async function issueSessionInTransaction(
  transaction: TransactionSql,
  input: {
    sessionId: string;
    userId: string;
    tenantId: string | null;
    membershipId: string | null;
    sessionTokenHash: string;
    csrfTokenHash: string;
    expiresAt: string;
  },
): Promise<void> {
  if ((input.tenantId === null) !== (input.membershipId === null)) {
    throw new ApiError(400, "INVALID_SESSION_MEMBERSHIP", "Tenant and membership must be set together");
  }
  const activeUser = await transaction<{ id: string }[]>`
    SELECT id FROM users WHERE id = ${input.userId} AND disabled_at IS NULL FOR SHARE
  `;
  if (!activeUser[0]) {
    throw new ApiError(401, "UNAUTHENTICATED", "An active user is required to create a session");
  }
  if (input.tenantId !== null && input.membershipId !== null) {
    const eligible = await transaction<{ id: string }[]>`
      SELECT m.id
      FROM memberships m
      JOIN tenants t ON t.id = m.tenant_id AND t.status = 'active' AND t.deleted_at IS NULL
      JOIN users u ON u.id = m.user_id AND u.disabled_at IS NULL
      WHERE m.id = ${input.membershipId}
        AND m.tenant_id = ${input.tenantId}
        AND m.user_id = ${input.userId}
        AND m.status = 'active'
        AND m.revoked_at IS NULL
      FOR SHARE OF m, t, u
    `;
    if (!eligible[0]) {
      throw new ApiError(403, "TENANT_MEMBERSHIP_REQUIRED", "An active tenant membership is required");
    }
  }
  await transaction`
    INSERT INTO sessions (
      id, user_id, token_hash, tenant_id, membership_id, csrf_token_hash, created_at, expires_at, last_seen_at
    ) VALUES (
      ${input.sessionId}, ${input.userId}, ${input.sessionTokenHash}, ${input.tenantId}, ${input.membershipId},
      ${input.csrfTokenHash}, now(), ${input.expiresAt}, now()
    )
  `;
}

export async function requireWriteActor(
  request: Request,
  allowedRoles?: readonly ApiRole[],
): Promise<ActorContext> {
  const actor = await requireActor(request, allowedRoles);
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
    const config = getRuntimeConfig();
    const signingKey = config.security.csrfSigningKey;
    if (!signingKey || Buffer.byteLength(signingKey, "utf8") < 32) {
      throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "CSRF signing is not configured", { retryable: true });
    }
    await assertCsrf(request, actor.csrfTokenHash, { allowedOrigins: config.allowedOrigins, signingKey });
  }
  return actor;
}

export async function requireWriteUser(request: Request): Promise<SessionContext> {
  const session = await requireUser(request);
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
    const config = getRuntimeConfig();
    const signingKey = config.security.csrfSigningKey;
    if (!signingKey || Buffer.byteLength(signingKey, "utf8") < 32) {
      throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "CSRF signing is not configured", { retryable: true });
    }
    await assertCsrf(request, session.csrfTokenHash, { allowedOrigins: config.allowedOrigins, signingKey });
  }
  return session;
}

function signingDigest(key: string | null, value: string, label: string): string {
  if (!key || Buffer.byteLength(key, "utf8") < 32) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", `${label} signing is not configured`, { retryable: true });
  }
  return hmacSha256Hex(key, value);
}

function serializeCookie(
  name: string,
  value: string,
  options: { httpOnly: boolean; maxAgeSeconds: number },
): string {
  if (!Number.isSafeInteger(options.maxAgeSeconds) || options.maxAgeSeconds < 0) {
    throw new RangeError("Cookie max age must be a non-negative safe integer");
  }

  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${options.maxAgeSeconds}`,
  ];
  if (options.httpOnly) {
    parts.push("HttpOnly");
  }
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function sessionCookieName(): string {
  return process.env.NODE_ENV === "production" ? `__Host-${SESSION_COOKIE_BASE}` : SESSION_COOKIE_BASE;
}

function csrfCookieName(): string {
  return process.env.NODE_ENV === "production" ? `__Host-${CSRF_COOKIE_BASE}` : CSRF_COOKIE_BASE;
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

    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }

  return null;
}

function toApiRole(value: string): ApiRole | null {
  switch (value) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "agent":
      return "Agent";
    case "finance":
      return "Finance";
    default:
      return null;
  }
}
