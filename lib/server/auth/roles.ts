import { ApiError } from "@/lib/server/http/errors";
import type { ActorContext, Permission } from "@/lib/server/auth/types";
import type { ApiRole } from "@/types/api/common";

export const ROLE_PERMISSIONS: Readonly<Record<ApiRole, readonly Permission[]>> = {
  Owner: [
    "stores:configure",
    "stores:unlink",
    "channels:configure",
    "channels:unlink",
    "workflows:manage",
    "knowledge:manage",
    "knowledge:read",
    "orders:read",
    "conversations:read",
    "conversations:human-write",
    "billing:read",
    "billing:purchase",
    "team:manage-agents",
    "data:export-business",
    "billing:export",
    "data:delete-request",
    "tenant:delete",
  ],
  Admin: [
    "stores:configure",
    "channels:configure",
    "workflows:manage",
    "knowledge:manage",
    "knowledge:read",
    "orders:read",
    "conversations:read",
    "conversations:human-write",
    "team:manage-agents",
    "data:export-business",
    "data:delete-request",
  ],
  Agent: [
    "knowledge:read",
    "orders:read",
    "conversations:read",
    "conversations:human-write",
  ],
  Finance: ["billing:read", "billing:export"],
};

export function hasPermission(role: ApiRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function requireRole<TActor extends Pick<ActorContext, "role">>(
  actor: TActor,
  allowedRoles: readonly ApiRole[],
): TActor {
  if (!allowedRoles.includes(actor.role)) {
    throw new ApiError(403, "FORBIDDEN", "Your role does not allow this action");
  }

  return actor;
}
