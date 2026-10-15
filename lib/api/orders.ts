import { apiFetch } from "./client";
import type { ListData } from "@/types/api/common";

export interface OrderListParams {
  storeId?: string;
  orderStatus?: string;
  paymentStatus?: string;
  isCod?: boolean;
  locale?: string;
  workflowState?: string;
  search?: string;
  cursor?: string;
}

export interface ApiOrderRecord {
  id: string;
  storeId: string;
  platformOrderId: string;
  orderStatus: string;
  paymentStatus: string;
  fulfillmentStatus?: string;
  isCod: boolean;
  locale: string;
  currency: string;
  totalMinor: number | string;
  createdAt: string;
  updatedAt: string;
  workflowState?: string;
}

export interface OrderDetailRecord extends ApiOrderRecord {
  customerName?: string;
  customerPhone?: string;
  originalAddress?: string;
  modifiedAddress?: string;
  riskScore?: number;
}

export interface OrderEventRecord {
  id: string;
  eventType: string;
  eventAt: string;
  receivedAt: string;
  orderVersion: number;
}

export const ordersApi = {
  async listOrders(params?: OrderListParams): Promise<ListData<ApiOrderRecord>> {
    const query = new URLSearchParams();
    if (params?.storeId) query.set("storeId", params.storeId);
    if (params?.orderStatus) query.set("orderStatus", params.orderStatus);
    if (params?.paymentStatus) query.set("paymentStatus", params.paymentStatus);
    if (params?.isCod !== undefined) query.set("isCod", String(params.isCod));
    if (params?.locale) query.set("locale", params.locale);
    if (params?.workflowState) query.set("workflowState", params.workflowState);
    if (params?.search) query.set("search", params.search);
    if (params?.cursor) query.set("cursor", params.cursor);

    const qs = query.toString();
    return apiFetch<ListData<ApiOrderRecord>>(`orders${qs ? `?${qs}` : ""}`);
  },

  async getOrder(orderId: string): Promise<OrderDetailRecord> {
    return apiFetch<OrderDetailRecord>(`orders/${orderId}`);
  },

  async listOrderEvents(orderId: string): Promise<{ items: OrderEventRecord[] }> {
    return apiFetch<{ items: OrderEventRecord[] }>(`orders/${orderId}/events`);
  },

  async submitCodAction(orderId: string, action: "approve" | "reject", reason?: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`orders/${orderId}/cod-actions`, {
      method: "POST",
      body: { action, reason },
    });
  },

  async exportOrders(data: { format: "csv" | "json"; storeId?: string }): Promise<{ exportUrl?: string }> {
    return apiFetch<{ exportUrl?: string }>("order-exports", {
      method: "POST",
      body: data,
    });
  },
};
