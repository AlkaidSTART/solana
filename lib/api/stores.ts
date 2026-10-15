import { apiFetch } from "./client";
import type { ListData } from "@/types/api/common";

export interface StoreItem {
  id: string;
  tenantId: string;
  name: string;
  platform: "woocommerce" | "shopify";
  baseUrl: string;
  timezone: string;
  status: "connected" | "warning" | "disconnected" | "active" | "error";
  monthlyOrders?: number;
  currency?: string;
  webhookSecretMasked?: string;
  lastHeartbeat?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreInput {
  name: string;
  platform: "woocommerce";
  baseUrl: string;
  timezone: string;
  supportHours?: {
    start: string;
    end: string;
    days: number[];
  };
}

export const storesApi = {
  async listStores(params?: { status?: string; cursor?: string }): Promise<ListData<StoreItem>> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.cursor) query.set("cursor", params.cursor);
    const qs = query.toString();
    return apiFetch<ListData<StoreItem>>(`stores${qs ? `?${qs}` : ""}`);
  },

  async getStore(storeId: string): Promise<StoreItem> {
    return apiFetch<StoreItem>(`stores/${storeId}`);
  },

  async createStore(data: CreateStoreInput): Promise<StoreItem> {
    return apiFetch<StoreItem>("stores", {
      method: "POST",
      body: data,
    });
  },

  async verifyStore(storeId: string): Promise<{ verified: boolean; latencyMs?: number }> {
    return apiFetch<{ verified: boolean; latencyMs?: number }>(`stores/${storeId}/verify`, {
      method: "POST",
    });
  },

  async syncStore(storeId: string, scope: "products" | "orders" | "all" = "all"): Promise<{ syncStatus: string }> {
    return apiFetch<{ syncStatus: string }>(`stores/${storeId}/sync`, {
      method: "POST",
      body: { scope },
    });
  },
};
