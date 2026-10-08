import type { ApiRole } from "@/types/api/common";

export interface SessionContext {
  userId: string;
  tenantId: string | null;
  membershipId: string | null;
  role: ApiRole | null;
  storeIds: string[];
  sessionId: string;
  csrfTokenHash: string;
}

export interface ActorContext {
  userId: string;
  tenantId: string;
  membershipId: string;
  role: ApiRole;
  storeIds: string[];
  sessionId: string;
  csrfTokenHash: string;
}

export type Permission =
  | "stores:configure"
  | "stores:unlink"
  | "channels:configure"
  | "channels:unlink"
  | "workflows:manage"
  | "knowledge:manage"
  | "knowledge:read"
  | "orders:read"
  | "conversations:read"
  | "conversations:human-write"
  | "billing:read"
  | "billing:purchase"
  | "team:manage-agents"
  | "data:export-business"
  | "billing:export"
  | "data:delete-request"
  | "tenant:delete";
