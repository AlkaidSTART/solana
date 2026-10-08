import { apiFetch } from "./client";
import type { ListData } from "@/types/api/common";

export interface WorkflowRecord {
  id: string;
  storeId?: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "paused" | "draft";
  version: string;
  rulesConfig?: Record<string, unknown>;
  triggerDelay?: string;
  languages?: string[];
  quietHours?: string;
  maxFrequency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowVersionRecord {
  id: string;
  workflowId: string;
  versionNumber: number;
  configSnapshot: Record<string, unknown>;
  createdAt: string;
}

export const workflowsApi = {
  async listWorkflows(params?: { storeId?: string; status?: string }): Promise<ListData<WorkflowRecord>> {
    const query = new URLSearchParams();
    if (params?.storeId) query.set("storeId", params.storeId);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return apiFetch<ListData<WorkflowRecord>>(`workflows${qs ? `?${qs}` : ""}`);
  },

  async getWorkflow(workflowId: string): Promise<WorkflowRecord> {
    return apiFetch<WorkflowRecord>(`workflows/${workflowId}`);
  },

  async activateWorkflow(workflowId: string, reason?: string): Promise<{ status: string }> {
    const idempotencyKey = `wf-act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return apiFetch<{ status: string }>(`workflows/${workflowId}/activate`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: { reason: reason || "Manual activation from UI" },
    });
  },

  async pauseWorkflow(workflowId: string, reason?: string): Promise<{ status: string }> {
    const idempotencyKey = `wf-pau-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return apiFetch<{ status: string }>(`workflows/${workflowId}/pause`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: { reason: reason || "Manual pause from UI" },
    });
  },

  async listVersions(workflowId: string): Promise<ListData<WorkflowVersionRecord>> {
    return apiFetch<ListData<WorkflowVersionRecord>>(`workflows/${workflowId}/versions`);
  },

  async restoreVersion(workflowId: string, versionId: string): Promise<{ restored: boolean }> {
    const idempotencyKey = `wf-res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return apiFetch<{ restored: boolean }>(`workflows/${workflowId}/versions/${versionId}/restore`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },
};
