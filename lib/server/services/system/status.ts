import type { ApiRole, EvidenceStatus } from "@/types/api/common";

export type DependencyHealth = "ok" | "degraded" | "down" | "unconfigured";

export interface CapabilityEvidence {
  implemented: boolean;
  configured: boolean;
  verified: boolean;
  blockingReasons?: string[];
}

export interface CapabilityStatus {
  status: EvidenceStatus;
  blockingReasons: string[];
}

export interface OperationActorScope {
  userId: string;
  tenantId: string | null;
  role?: ApiRole | null | undefined;
}

export type OperationScope =
  | { tenantId: string; requestedByUserId: string | null }
  | { tenantId: null; requestedByUserId: string };

export interface HealthComponents {
  database: DependencyHealth;
  queue: DependencyHealth;
  otpEmail: DependencyHealth;
  woocommerce: DependencyHealth;
  whatsapp: DependencyHealth;
  solanaRpc: DependencyHealth;
}

export function projectCapability(evidence: CapabilityEvidence): CapabilityStatus {
  const blockingReasons = [...(evidence.blockingReasons ?? [])];
  if (!evidence.implemented) {
    return {
      status: "unavailable",
      blockingReasons: appendReason(blockingReasons, "integration_not_implemented"),
    };
  }
  if (!evidence.configured) {
    return {
      status: "unavailable",
      blockingReasons: appendReason(blockingReasons, "configuration_missing"),
    };
  }
  if (evidence.verified) {
    return { status: "verified", blockingReasons };
  }

  return {
    status: "implemented",
    blockingReasons: appendReason(blockingReasons, "verification_pending"),
  };
}

export function getOperationScope(actor: OperationActorScope): OperationScope {
  if (actor.tenantId === null) {
    const scope: OperationScope = { tenantId: null, requestedByUserId: actor.userId };
    return scope;
  }

  const tenantWideRead = actor.role === "Owner" || actor.role === "Admin";
  if (tenantWideRead) {
    const scope: OperationScope = { tenantId: actor.tenantId, requestedByUserId: null };
    return scope;
  }

  const scope: OperationScope = { tenantId: actor.tenantId, requestedByUserId: actor.userId };
  return scope;
}

export function summarizeServiceHealth(
  components: HealthComponents,
): DependencyHealth {
  if (components.database === "down") {
    return "down";
  }
  if (Object.values(components).some((status) => status !== "ok")) {
    return "degraded";
  }

  return "ok";
}

function appendReason(reasons: string[], reason: string): string[] {
  return reasons.includes(reason) ? reasons : [...reasons, reason];
}
