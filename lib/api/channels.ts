import { apiFetch } from "./client";

export interface ChannelItem {
  id: string;
  tenantId: string;
  storeId?: string;
  provider: string;
  phoneNumberId: string;
  businessAccountId: string;
  displayPhoneNumber?: string;
  displayPhoneLast4?: string;
  status: "active" | "warning" | "error" | "unverified";
  qualityRating?: string;
  tier?: string;
  lastWebhookAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateItem {
  id: string;
  channelId: string;
  providerTemplateId?: string | null;
  name: string;
  locale: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  status: "approved" | "pending" | "rejected";
  bodyText?: string;
  components?: unknown[];
}

export interface SendTestMessageInput {
  templateId: string;
  testRecipient: string;
  variables?: Record<string, string>;
}

export const channelsApi = {
  async listChannels(params?: { storeId?: string; status?: string }): Promise<ChannelItem[]> {
    const query = new URLSearchParams();
    if (params?.storeId) query.set("storeId", params.storeId);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return apiFetch<ChannelItem[]>(`channels${qs ? `?${qs}` : ""}`);
  },

  async getChannel(channelId: string): Promise<ChannelItem> {
    return apiFetch<ChannelItem>(`channels/${channelId}`);
  },

  async verifyChannel(channelId: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`channels/${channelId}/verify`, {
      method: "POST",
    });
  },

  async listTemplates(channelId: string, params?: { locale?: string; status?: string }): Promise<TemplateItem[]> {
    const query = new URLSearchParams();
    if (params?.locale) query.set("locale", params.locale);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return apiFetch<TemplateItem[]>(`channels/${channelId}/templates${qs ? `?${qs}` : ""}`);
  },

  async syncTemplates(channelId: string): Promise<{ syncedCount: number }> {
    return apiFetch<{ syncedCount: number }>(`channels/${channelId}/templates/sync`, {
      method: "POST",
    });
  },

  async sendTestMessage(channelId: string, input: SendTestMessageInput): Promise<{ operationId: string }> {
    const idempotencyKey = `msg-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return apiFetch<{ operationId: string }>(`channels/${channelId}/test-messages`, {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
      body: input,
    });
  },
};
