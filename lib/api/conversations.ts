import { apiFetch } from "./client";
import type { ListData } from "@/types/api/common";

export interface ConversationRecord {
  id: string;
  storeId?: string;
  customerName?: string;
  customerPhone?: string;
  language: string;
  status: "automated" | "waiting_human" | "human_active" | "resolved";
  unread?: boolean;
  isHumanTakeover: boolean;
  windowExpiresIn?: string;
  lastMessage?: string;
  lastTimestamp?: string;
  sentiment?: "normal" | "urgent" | "angry";
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessageRecord {
  id: string;
  conversationId: string;
  sender: "buyer" | "agent" | "system";
  text: string;
  translationZh?: string;
  translationEn?: string;
  timestamp: string;
  slangTokens?: { token: string; explanation: string }[];
}

export const conversationsApi = {
  async listConversations(params?: {
    storeId?: string;
    status?: string;
    search?: string;
    cursor?: string;
  }): Promise<ListData<ConversationRecord>> {
    const query = new URLSearchParams();
    if (params?.storeId) query.set("storeId", params.storeId);
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.cursor) query.set("cursor", params.cursor);
    const qs = query.toString();
    return apiFetch<ListData<ConversationRecord>>(`conversations${qs ? `?${qs}` : ""}`);
  },

  async getConversation(conversationId: string): Promise<ConversationRecord> {
    return apiFetch<ConversationRecord>(`conversations/${conversationId}`);
  },

  async listMessages(conversationId: string): Promise<{ items: ConversationMessageRecord[] }> {
    return apiFetch<{ items: ConversationMessageRecord[] }>(`conversations/${conversationId}/messages`);
  },

  async sendMessage(
    conversationId: string,
    data: { text: string; language?: string }
  ): Promise<ConversationMessageRecord> {
    const idempotencyKey = `msg-send-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return apiFetch<ConversationMessageRecord>(`conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: {
        text: data.text,
        language: data.language || "id",
      },
    });
  },

  async claim(conversationId: string): Promise<{ claimed: boolean }> {
    return apiFetch<{ claimed: boolean }>(`conversations/${conversationId}/claim`, {
      method: "POST",
    });
  },

  async handoff(conversationId: string, reason?: string): Promise<{ handoff: boolean }> {
    return apiFetch<{ handoff: boolean }>(`conversations/${conversationId}/handoff`, {
      method: "POST",
      body: { assigneeId: "agent-me", reason: reason || "Manual takeover by agent" },
    });
  },

  async resume(conversationId: string): Promise<{ resumed: boolean }> {
    return apiFetch<{ resumed: boolean }>(`conversations/${conversationId}/resume`, {
      method: "POST",
      body: { workflowVersionId: "latest", reason: "Agent returned control to bot" },
    });
  },

  async resolve(conversationId: string, resolutionCode?: string): Promise<{ resolved: boolean }> {
    return apiFetch<{ resolved: boolean }>(`conversations/${conversationId}/resolve`, {
      method: "POST",
      body: { resolutionCode: resolutionCode || "COMPLETED" },
    });
  },
};
