import { ApiError } from "@/lib/server/http/errors";
import { checkDatabase, withDatabase } from "@/lib/server/db/client";
import type { SessionContext } from "@/lib/server/auth/types";
import type { ApiRole } from "@/types/api/common";
import { getRuntimeCapabilityProjection } from "@/lib/server/config/env";
import { checkQueue } from "@/lib/server/jobs/queue";
import type { CapabilityStatus, DependencyHealth } from "@/lib/server/services/system/status";
import { getOperationScope, projectCapability, summarizeServiceHealth } from "@/lib/server/services/system/status";

interface OperationRow {
  id: string;
  operation_type: string;
  status: string;
  progress: number | null;
  result: unknown;
  error_code: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}

export interface HealthSnapshot {
  service: DependencyHealth;
  database: DependencyHealth;
  queue: DependencyHealth;
  otpEmail: DependencyHealth;
  woocommerce: DependencyHealth;
  whatsapp: DependencyHealth;
  solanaRpc: DependencyHealth;
}

export interface CapabilitiesSnapshot {
  database: CapabilityStatus;
  queue: CapabilityStatus;
  otpEmail: CapabilityStatus;
  woocommerce: CapabilityStatus;
  whatsapp: CapabilityStatus;
  solanaRpc: CapabilityStatus;
}

export interface OperationSnapshot {
  id: string;
  operationType: string;
  status: string;
  progress: number | null;
  result: unknown;
  errorCode: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const [database, queue] = await Promise.all([checkDatabase(), checkQueue()]);
  const config = getRuntimeCapabilityProjection();
  const health = {
    database,
    queue,
    otpEmail: configuredHealth(config.otpDelivery === "configured"),
    woocommerce: configuredHealth(config.woocommerce === "configured"),
    whatsapp: configuredHealth(config.whatsapp === "configured"),
    solanaRpc: configuredHealth(config.solanaRpc === "configured"),
  };

  return { service: summarizeServiceHealth(health), ...health };
}

export async function getCapabilitiesSnapshot(): Promise<CapabilitiesSnapshot> {
  const [databaseHealth, queueHealth] = await Promise.all([checkDatabase(), checkQueue()]);
  const config = getRuntimeCapabilityProjection();

  return {
    database: projectCapability({
      implemented: true,
      configured: databaseHealth !== "unconfigured",
      verified: databaseHealth === "ok",
      blockingReasons: healthBlockers("database", databaseHealth),
    }),
    queue: projectCapability({
      implemented: true,
      configured: queueHealth !== "unconfigured",
      verified: queueHealth === "ok",
      blockingReasons: healthBlockers("queue", queueHealth),
    }),
    otpEmail: projectCapability({
      implemented: true,
      configured: config.otpDelivery === "configured",
      verified: false,
    }),
    woocommerce: projectCapability({
      implemented: false,
      configured: config.woocommerce === "configured",
      verified: false,
    }),
    whatsapp: projectCapability({
      implemented: false,
      configured: config.whatsapp === "configured",
      verified: false,
    }),
    solanaRpc: projectCapability({
      implemented: false,
      configured: config.solanaRpc === "configured",
      verified: false,
    }),
  };
}

export async function getOperationForUser(
  actor: Pick<SessionContext, "userId" | "tenantId"> & { role: ApiRole | null | undefined },
  operationId: string,
): Promise<OperationSnapshot> {
  const scope = getOperationScope(actor);
  return withDatabase(async (database) => {
    const rows = scope.tenantId !== null
      ? await database<OperationRow[]>`
        SELECT id, operation_type, status, progress, result, error_code, created_at, started_at, completed_at
        FROM operations
        WHERE id = ${operationId}
          AND tenant_id = ${scope.tenantId}
          AND (${scope.requestedByUserId}::text IS NULL OR requested_by_user_id = ${scope.requestedByUserId})
        LIMIT 1
      `
      : await database<OperationRow[]>`
        SELECT id, operation_type, status, progress, result, error_code, created_at, started_at, completed_at
        FROM operations
        WHERE id = ${operationId} AND tenant_id IS NULL AND requested_by_user_id = ${scope.requestedByUserId}
        LIMIT 1
      `;

    const operation = rows[0];
    if (!operation) {
      throw new ApiError(404, "NOT_FOUND", "Operation was not found");
    }

    return {
      id: operation.id,
      operationType: operation.operation_type,
      status: operation.status,
      progress: operation.progress,
      // Operation results may contain provider or business evidence; scope is enforced in SQL before it is selected.
      result: operation.result,
      errorCode: operation.error_code,
      createdAt: operation.created_at.toISOString(),
      startedAt: operation.started_at?.toISOString() ?? null,
      completedAt: operation.completed_at?.toISOString() ?? null,
    };
  });
}

function configuredHealth(configured: boolean): DependencyHealth {
  return configured ? "degraded" : "unconfigured";
}

function healthBlockers(name: string, status: DependencyHealth): string[] {
  if (status === "ok") {
    return [];
  }

  return [`${name}_${status}`];
}
