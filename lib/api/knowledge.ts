import { apiFetch } from "./client";
import type { ListData } from "@/types/api/common";

export interface KnowledgeItemRecord {
  id: string;
  storeId?: string;
  category: "FAQ" | "PRODUCT" | "LOGISTICS";
  zh: string;
  idGaul: string;
  en: string;
  th: string;
  enSg?: string;
  ms?: string;
  vi?: string;
  fil?: string;
  status: "PUBLISHED" | "PENDING_REVIEW" | "DRAFT";
  lastUpdated: string;
}

export interface KnowledgeConflictRecord {
  id: string;
  storeId?: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  itemIds: string[];
  status: "open" | "resolved";
}

export const knowledgeApi = {
  async listItems(params?: {
    storeId?: string;
    status?: string;
    category?: string;
    search?: string;
    cursor?: string;
  }): Promise<ListData<KnowledgeItemRecord>> {
    const query = new URLSearchParams();
    if (params?.storeId) query.set("storeId", params.storeId);
    if (params?.status) query.set("status", params.status);
    if (params?.category) query.set("type", params.category);
    if (params?.search) query.set("search", params.search);
    if (params?.cursor) query.set("cursor", params.cursor);
    const qs = query.toString();
    return apiFetch<ListData<KnowledgeItemRecord>>(`knowledge-items${qs ? `?${qs}` : ""}`);
  },

  async getItem(itemId: string): Promise<KnowledgeItemRecord> {
    return apiFetch<KnowledgeItemRecord>(`knowledge-items/${itemId}`);
  },

  async createItem(data: Partial<KnowledgeItemRecord>): Promise<KnowledgeItemRecord> {
    return apiFetch<KnowledgeItemRecord>("knowledge-items", {
      method: "POST",
      body: data,
    });
  },

  async updateItem(itemId: string, patch: Partial<KnowledgeItemRecord>): Promise<KnowledgeItemRecord> {
    return apiFetch<KnowledgeItemRecord>(`knowledge-items/${itemId}`, {
      method: "PATCH",
      body: patch,
    });
  },

  async publishItem(itemId: string): Promise<{ published: boolean }> {
    return apiFetch<{ published: boolean }>(`knowledge-items/${itemId}/publish`, {
      method: "POST",
    });
  },

  async getAiTranslationSuggestions(
    itemId: string
  ): Promise<{ suggestions: Record<string, string> }> {
    return apiFetch<{ suggestions: Record<string, string> }>(
      `knowledge-items/${itemId}/translation-suggestions`,
      { method: "POST" }
    );
  },

  async listConflicts(): Promise<ListData<KnowledgeConflictRecord>> {
    return apiFetch<ListData<KnowledgeConflictRecord>>("knowledge-conflicts");
  },
};
