import { apiFetch } from "./client";

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  defaultLocale: string;
  currency: string;
  attributionWindowDays?: number;
  controlGroupEnabled?: boolean;
  confidenceRate?: number;
}

export interface CapabilitiesInfo {
  environment: string;
  database: "configured" | "unconfigured";
  redis: "configured" | "unconfigured";
  security: "configured" | "unconfigured";
  otpDelivery: "configured" | "unconfigured";
  woocommerce: "configured" | "unconfigured";
  whatsapp: "configured" | "unconfigured";
  solanaPayment: "configured" | "unconfigured";
  solanaCluster: string | null;
}

export const tenantApi = {
  async getTenant(): Promise<TenantInfo> {
    return apiFetch<TenantInfo>("tenant");
  },

  async updateTenant(patch: Partial<TenantInfo>): Promise<TenantInfo> {
    return apiFetch<TenantInfo>("tenant", {
      method: "PATCH",
      body: patch,
    });
  },

  async getCapabilities(): Promise<CapabilitiesInfo> {
    return apiFetch<CapabilitiesInfo>("capabilities");
  },
};
