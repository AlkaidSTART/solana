import { apiFetch } from "./client";
import type { ApiRole } from "@/types/api/common";

export interface AuthUser {
  id: string;
  email: string;
  locale: string;
}

export interface AuthMembership {
  id: string;
  tenantId: string;
  role: ApiRole;
  tenantName?: string;
}

export interface AuthSessionSnapshot {
  user: AuthUser;
  memberships: AuthMembership[];
  activeMembership: AuthMembership | null;
  activeTenantId: string | null;
}

export interface OtpRequestInput {
  email: string;
  locale: string;
}

export interface OtpRequestResult {
  challengeId: string;
  expiresAt: string;
  retryAfterSeconds: number;
  deliveryStatus: "pending" | "sent" | "failed" | "unknown";
}

export interface OtpVerifyInput {
  challengeId: string;
  code: string;
}

export interface OtpVerifyResult {
  user: AuthUser;
  memberships: AuthMembership[];
}

export const authApi = {
  async getSession(): Promise<AuthSessionSnapshot> {
    return apiFetch<AuthSessionSnapshot>("auth/session");
  },

  async requestOtp(data: OtpRequestInput): Promise<OtpRequestResult> {
    const idempotencyKey = `otp-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return apiFetch<OtpRequestResult>("auth/otp/request", {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
      body: data,
    });
  },

  async verifyOtp(data: OtpVerifyInput): Promise<OtpVerifyResult> {
    return apiFetch<OtpVerifyResult>("auth/otp/verify", {
      method: "POST",
      body: data,
    });
  },

  /** Exchanges an already verified Neon Auth identity for this repository's own session. */
  async establishNeonSession(locale: string): Promise<OtpVerifyResult> {
    return apiFetch<OtpVerifyResult>("auth/neon/session", {
      method: "POST",
      body: { locale },
    });
  },

  async switchTenant(tenantId: string): Promise<{ activeMembership: AuthMembership }> {
    return apiFetch<{ activeMembership: AuthMembership }>("auth/switch-tenant", {
      method: "POST",
      body: { tenantId },
    });
  },

  async logout(): Promise<void> {
    return apiFetch<void>("auth/logout", {
      method: "POST",
    });
  },
};
