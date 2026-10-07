import { randomUUID } from "node:crypto";
import { z } from "zod";

import type { ActorContext } from "@/lib/server/auth/types";
import { writeAuditEvent } from "@/lib/server/audit/service";
import { withDatabase, withTransaction, type TransactionSql } from "@/lib/server/db/client";
import { ApiError } from "@/lib/server/http/errors";
import type { RequestContext } from "@/lib/server/http/request";
import { executeIdempotent } from "@/lib/server/idempotency/service";
import { sha256Hex } from "@/lib/server/security/digests";
import {
  assertWorkflowTypeAvailable,
  evaluatePaymentReminderEligibility,
  evaluateWorkflowReadiness,
  type WorkflowReadinessChecks,
  type WorkflowType,
} from "@/lib/server/services/workflows/rules";

const workflowConfigSchema = z.object({
  templateId: z.string().min(1).max(128),
  locale: z.string().min(2).max(16),
  firstReminderMinutes: z.number().int().min(5).max(120),
  secondReminderMinutes: z.number().int().min(60).max(1440).optional(),
}).strict();

export const createWorkflowSchema = z.object({
  type: z.enum(["payment_reminder", "cod_confirmation"]),
  name: z.string().trim().min(1).max(120),
  config: z.unknown(),
}).strict();
export const patchWorkflowSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  config: z.unknown().optional(),
}).strict().refine((value) => value.name !== undefined || value.config !== undefined);
export const previewWorkflowSchema = z.object({ orderId: z.string().min(1).max(128).optional() }).strict();
export const activateWorkflowSchema = z.object({
  versionId: z.number().int().positive(),
  acceptedWarnings: z.array(z.string().regex(/^[a-z][a-z0-9_:-]{1,63}$/)).max(20).default([]),
}).strict();
export const pauseWorkflowSchema = z.object({
  reason: z.string().trim().min(1).max(500),
}).strict();

interface WorkflowRow {
  id: string; store_id: string; type: WorkflowType; name: string; status: string;
  current_version: number; active_version: number | null; created_at: Date; updated_at: Date;
  config?: unknown; readiness?: unknown;
}
export interface CreatedWorkflow {
  id: string; storeId: string; type: WorkflowType; name: string; status: "draft";
  currentVersion: number; activeVersion: null;
}
export interface WorkflowTransitionResult {
  id: string;
  status: "active" | "paused";
  activeVersion: number | null;
}
type WorkflowTransitionPayload = WorkflowTransitionResult | {
  code: "WORKFLOW_NOT_READY";
  blockingChecks: (keyof WorkflowReadinessChecks)[];
};

export async function listWorkflows(actor: ActorContext, storeId?: string | null, status?: string | null): Promise<{ items: WorkflowRow[] }> {
  if (status && !["draft", "active", "paused", "blocked"].includes(status)) {
    throw new ApiError(400, "INVALID_STATUS_FILTER", "Workflow status filter is invalid");
  }
  const rows = await withDatabase(async (sql) => sql<WorkflowRow[]>`
      SELECT w.id, w.store_id, w.type, w.name, w.status, w.current_version, w.active_version,
        w.created_at, w.updated_at, v.config, v.readiness
      FROM workflows w JOIN workflow_versions v ON v.tenant_id=w.tenant_id AND v.workflow_id=w.id AND v.version=w.current_version
      WHERE w.tenant_id = ${actor.tenantId}
        AND (${storeId ?? null}::text IS NULL OR w.store_id = ${storeId ?? null})
        AND (${status ?? null}::text IS NULL OR w.status = ${status ?? null})
        AND (${actor.role === "Agent"} = false OR w.store_id = ANY(${actor.storeIds}))
      ORDER BY w.updated_at DESC, w.id DESC LIMIT 100
    `);
  const items = await Promise.all(rows.map(async (row) => {
    const config = workflowConfigSchema.safeParse(row.config);
    if (config.success) row.readiness = await getReadinessWithSql(actor.tenantId, row.store_id, config.data.templateId, config.data.locale);
    return row;
  }));
  return { items };
}

export async function getWorkflow(actor: ActorContext, workflowId: string): Promise<WorkflowRow> {
  const rows = await withDatabase((sql) => sql<WorkflowRow[]>`
    SELECT w.id, w.store_id, w.type, w.name, w.status, w.current_version, w.active_version,
      w.created_at, w.updated_at, v.config, v.readiness
    FROM workflows w JOIN workflow_versions v
      ON v.tenant_id = w.tenant_id AND v.workflow_id = w.id AND v.version = w.current_version
    WHERE w.tenant_id = ${actor.tenantId} AND w.id = ${workflowId}
      AND (${actor.role === "Agent"} = false OR w.store_id = ANY(${actor.storeIds}))
  `);
  if (!rows[0]) throw notFound();
  if (rows[0].config && typeof rows[0].config === "object") {
    const config = workflowConfigSchema.safeParse(rows[0].config);
    if (config.success) {
      rows[0].readiness = await getReadinessWithSql(actor.tenantId, rows[0].store_id, config.data.templateId, config.data.locale);
    }
  }
  return rows[0];
}

export async function createWorkflow(
  actor: ActorContext, storeId: string, input: z.output<typeof createWorkflowSchema>, key: string,
  context: RequestContext,
): Promise<CreatedWorkflow> {
  const type = input.type as WorkflowType;
  assertWorkflowTypeAvailable(type);
  const config = workflowConfigSchema.parse(input.config);
  const result = await executeIdempotent<CreatedWorkflow>(actor, "workflow.create", key, { storeId, input }, async (tx) => {
    await requireStore(tx, actor, storeId);
    const checks = await getReadiness(tx, actor.tenantId, storeId, config.templateId, config.locale);
    const id = randomUUID();
    await tx`INSERT INTO workflows (id, tenant_id, store_id, type, name, current_version, created_by_user_id)
      VALUES (${id}, ${actor.tenantId}, ${storeId}, ${type}, ${input.name}, 1, ${actor.userId})`;
    await tx`INSERT INTO workflow_versions
      (id, tenant_id, workflow_id, version, config, readiness, created_by_user_id)
      VALUES (${randomUUID()}, ${actor.tenantId}, ${id}, 1, ${JSON.stringify(config)}::jsonb,
        ${JSON.stringify(checks)}::jsonb, ${actor.userId})`;
    await writeAuditEvent({ actor, action: "workflow.created", resourceType: "workflow", resourceId: id,
      requestId: context.requestId, metadata: { type, version: 1 } }, tx);
    return { status: 201, body: { id, storeId, type, name: input.name, status: "draft", currentVersion: 1, activeVersion: null } };
  });
  return result.body;
}

export async function patchWorkflow(
  actor: ActorContext, workflowId: string, expectedVersion: number,
  input: z.output<typeof patchWorkflowSchema>, context: RequestContext,
): Promise<WorkflowRow> {
  return withTransaction(async (tx) => {
    const rows = await tx<WorkflowRow[]>`SELECT id, store_id, type, name, status, current_version, active_version,
      created_at, updated_at FROM workflows WHERE tenant_id = ${actor.tenantId} AND id = ${workflowId}
      AND (${actor.role === "Agent"} = false OR store_id = ANY(${actor.storeIds})) FOR UPDATE`;
    const current = rows[0];
    if (!current) throw notFound();
    if (current.current_version !== expectedVersion) throw conflict();
    assertWorkflowTypeAvailable(current.type);
    const old = await tx<{ config: unknown }[]>`SELECT config FROM workflow_versions
      WHERE tenant_id = ${actor.tenantId} AND workflow_id = ${workflowId} AND version = ${expectedVersion}`;
    const config = workflowConfigSchema.parse(input.config ?? old[0]?.config);
    const nextVersion = expectedVersion + 1;
    const checks = await getReadiness(tx, actor.tenantId, current.store_id, config.templateId, config.locale);
    await tx`INSERT INTO workflow_versions (id, tenant_id, workflow_id, version, config, readiness, created_by_user_id)
      VALUES (${randomUUID()}, ${actor.tenantId}, ${workflowId}, ${nextVersion}, ${JSON.stringify(config)}::jsonb,
        ${JSON.stringify(checks)}::jsonb, ${actor.userId})`;
    await tx`UPDATE workflows SET name = coalesce(${input.name ?? null}, name), current_version = ${nextVersion},
      status = CASE WHEN status = 'active' THEN 'paused' ELSE status END, updated_at = now()
      WHERE tenant_id = ${actor.tenantId} AND id = ${workflowId}`;
    await stopAutomationTasks(tx, { tenantId: actor.tenantId, storeId: current.store_id, reason: "workflow_paused" });
    await writeAuditEvent({ actor, action: "workflow.version_created", resourceType: "workflow", resourceId: workflowId,
      requestId: context.requestId, metadata: { version: nextVersion } }, tx);
    return { ...current, name: input.name ?? current.name, current_version: nextVersion, status: current.status === "active" ? "paused" : current.status };
  });
}

export async function listWorkflowVersions(actor: ActorContext, workflowId: string): Promise<{ items: unknown[] }> {
  const workflow = await getWorkflow(actor, workflowId);
  const items = await withDatabase((sql) => sql`
    SELECT version, config, readiness, created_by_user_id, created_at FROM workflow_versions
    WHERE tenant_id = ${actor.tenantId} AND workflow_id = ${workflow.id} ORDER BY version DESC
  `);
  return { items };
}

export async function listAutomationTasks(actor: ActorContext, storeId?: string | null) {
  if (actor.role === "Agent" && storeId && !actor.storeIds.includes(storeId)) throw notFound();
  return withDatabase(async (sql) => ({ items: await sql`
    SELECT t.id, t.store_id AS "storeId", t.workflow_id AS "workflowId", t.workflow_version AS "workflowVersion",
      t.order_id AS "orderId", t.task_kind AS "taskKind", t.status, t.scheduled_at AS "scheduledAt",
      t.stop_reason AS "stopReason", t.attempt_count AS "attemptCount",
      t.created_at AS "createdAt", t.updated_at AS "updatedAt"
    FROM automation_tasks t WHERE t.tenant_id = ${actor.tenantId}
      AND (${storeId ?? null}::text IS NULL OR t.store_id = ${storeId ?? null})
      AND (${actor.role === "Agent"} = false OR t.store_id = ANY(${actor.storeIds}))
    ORDER BY t.updated_at DESC, t.id DESC LIMIT 100
  ` }));
}

export async function getAutomationTask(actor: ActorContext, taskId: string) {
  return withDatabase(async (sql) => {
    const rows = await sql`
      SELECT t.id, t.store_id AS "storeId", t.workflow_id AS "workflowId", t.workflow_version AS "workflowVersion",
        t.order_id AS "orderId", t.task_kind AS "taskKind", t.status, t.scheduled_at AS "scheduledAt",
        t.stop_reason AS "stopReason", t.attempt_count AS "attemptCount", t.created_at AS "createdAt", t.updated_at AS "updatedAt",
        coalesce((SELECT jsonb_agg(jsonb_build_object('id', e.id, 'type', e.event_type, 'occurredAt', e.occurred_at,
          'attemptCount', e.attempt_count, 'reasonCode', e.reason_code) ORDER BY e.occurred_at)
          FROM automation_task_events e WHERE e.tenant_id = t.tenant_id AND e.task_id = t.id), '[]'::jsonb) AS events
      FROM automation_tasks t WHERE t.tenant_id = ${actor.tenantId} AND t.id = ${taskId}
        AND (${actor.role === "Agent"} = false OR t.store_id = ANY(${actor.storeIds}))
    `;
    if (!rows[0]) throw notFound();
    return rows[0];
  });
}

export async function restoreWorkflowVersion(actor: ActorContext, workflowId: string, version: number, key: string, context: RequestContext) {
  return executeIdempotent(actor, "workflow.restore", key, { workflowId, version }, async (tx) => {
    const found = await tx<{ config: unknown }[]>`SELECT v.config FROM workflow_versions v JOIN workflows w
      ON w.tenant_id = v.tenant_id AND w.id = v.workflow_id
      WHERE w.tenant_id = ${actor.tenantId} AND w.id = ${workflowId}
        AND v.version = ${version} FOR UPDATE OF w`;
    const workflowRows = await tx<WorkflowRow[]>`SELECT id, store_id, type, name, status, current_version, active_version,
      created_at, updated_at FROM workflows WHERE tenant_id = ${actor.tenantId} AND id = ${workflowId} FOR UPDATE`;
    const current = workflowRows[0];
    if (!current || (actor.role === "Agent" && !actor.storeIds.includes(current.store_id)) || !found[0]) throw notFound();
    const config = workflowConfigSchema.parse(found[0].config);
    const next = current.current_version + 1;
    const checks = await getReadiness(tx, actor.tenantId, current.store_id, config.templateId, config.locale);
    await tx`INSERT INTO workflow_versions (id, tenant_id, workflow_id, version, config, readiness, created_by_user_id)
      VALUES (${randomUUID()}, ${actor.tenantId}, ${workflowId}, ${next}, ${JSON.stringify(config)}::jsonb, ${JSON.stringify(checks)}::jsonb, ${actor.userId})`;
    await tx`UPDATE workflows SET current_version = ${next}, status = 'draft', updated_at = now()
      WHERE tenant_id = ${actor.tenantId} AND id = ${workflowId}`;
    await stopAutomationTasks(tx, { tenantId: actor.tenantId, storeId: current.store_id, reason: "workflow_paused" });
    await writeAuditEvent({ actor, action: "workflow.version_restored", resourceType: "workflow", resourceId: workflowId,
      requestId: context.requestId, metadata: { version, newVersion: next } }, tx);
    return { status: 200, body: { id: workflowId, currentVersion: next, restoredFromVersion: version, status: "draft" } };
  });
}

export async function evaluateReadiness(actor: ActorContext, workflowId: string) {
  const workflow = await getWorkflow(actor, workflowId);
  const config = workflowConfigSchema.parse(workflow.config);
  return getReadinessWithSql(actor.tenantId, workflow.store_id, config.templateId, config.locale);
}

export async function setWorkflowActive(
  actor: ActorContext, workflowId: string, active: boolean, key: string, context: RequestContext,
  transitionInput: { versionId?: number; acceptedWarnings?: string[]; reason?: string },
) {
  return executeIdempotent<WorkflowTransitionPayload>(actor, active ? "workflow.activate" : "workflow.pause", key, { workflowId, ...transitionInput }, async (tx) => {
    const rows = await tx<WorkflowRow[]>`SELECT id, store_id, type, name, status, current_version, active_version,
      created_at, updated_at FROM workflows WHERE tenant_id = ${actor.tenantId} AND id = ${workflowId} FOR UPDATE`;
    const workflow = rows[0];
    if (!workflow || (actor.role === "Agent" && !actor.storeIds.includes(workflow.store_id))) throw notFound();
    assertWorkflowTypeAvailable(workflow.type);
    if (active) {
      if (transitionInput.versionId !== workflow.current_version) {
        throw new ApiError(409, "VERSION_CONFLICT", "Workflow version changed before activation");
      }
      const conf = await tx<{ config: unknown }[]>`SELECT config FROM workflow_versions WHERE tenant_id = ${actor.tenantId}
        AND workflow_id = ${workflowId} AND version = ${workflow.current_version}`;
      const config = workflowConfigSchema.parse(conf[0]?.config);
      const checks = await getReadiness(tx, actor.tenantId, workflow.store_id, config.templateId, config.locale);
      const readiness = evaluateWorkflowReadiness(checks);
      if (!readiness.ready) {
        await tx`UPDATE workflows SET status = 'blocked', updated_at = now() WHERE tenant_id = ${actor.tenantId} AND id = ${workflowId}`;
        await writeAuditEvent({ actor, action: "workflow.activation_blocked", resourceType: "workflow", resourceId: workflowId,
          requestId: context.requestId, metadata: { blockingChecks: readiness.blockingChecks } }, tx);
        return { status: 422, body: { code: "WORKFLOW_NOT_READY", blockingChecks: readiness.blockingChecks } };
      }
      await tx`UPDATE workflows SET status = 'active', active_version = current_version, updated_at = now()
        WHERE tenant_id = ${actor.tenantId} AND id = ${workflowId}`;
    } else {
      await tx`UPDATE workflows SET status = 'paused', updated_at = now() WHERE tenant_id = ${actor.tenantId} AND id = ${workflowId}`;
      await stopAutomationTasks(tx, { tenantId: actor.tenantId, storeId: workflow.store_id, reason: "workflow_paused" });
    }
    await writeAuditEvent({ actor, action: active ? "workflow.activated" : "workflow.paused", resourceType: "workflow", resourceId: workflowId,
      requestId: context.requestId, metadata: active
        ? { version: workflow.current_version, acceptedWarnings: transitionInput.acceptedWarnings ?? [] }
        : { version: workflow.current_version, reasonDigest: sha256Hex(transitionInput.reason ?? "") } }, tx);
    return { status: 200, body: { id: workflowId, status: active ? "active" : "paused", activeVersion: active ? workflow.current_version : workflow.active_version } };
    }).then((result) => {
      if ("code" in result.body) {
        throw new ApiError(422, "WORKFLOW_NOT_READY", "Workflow readiness requirements are not met", {
          details: { blockingChecks: result.body.blockingChecks },
        });
      }
    return result.body;
  });
}

export async function previewWorkflow(actor: ActorContext, workflowId: string, orderId?: string) {
  const workflow = await getWorkflow(actor, workflowId);
  assertWorkflowTypeAvailable(workflow.type);
  if (!orderId) return { eligible: false, reasons: ["order_required"], readiness: await evaluateReadiness(actor, workflowId) };
  const rows = await withDatabase((sql) => sql<{ platform: string; payment_status: string; order_status: string; is_cod: boolean; platform_created_at: Date }[]>`
    SELECT platform, payment_status, order_status, is_cod, platform_created_at FROM orders
    WHERE tenant_id = ${actor.tenantId} AND store_id = ${workflow.store_id} AND id = ${orderId}
  `);
  const order = rows[0];
  if (!order) throw notFound();
  const eligibility = evaluatePaymentReminderEligibility({ platform: order.platform, paymentStatus: order.payment_status,
    orderStatus: order.order_status, isCod: order.is_cod, createdAt: order.platform_created_at.toISOString(), now: new Date().toISOString() });
  const readiness = await evaluateReadiness(actor, workflowId);
  return { ...eligibility, readiness, wouldSchedule: eligibility.eligible && readiness.ready, sideEffects: false };
}

export async function stopAutomationTasks(
  tx: TransactionSql,
  input: { tenantId: string; storeId?: string; orderId?: string; reason: "payment_received" | "cancelled" | "fulfilled" | "deleted" | "opted_out" | "handoff" | "workflow_paused" | "store_disabled" | "expired" | "manual" },
): Promise<number> {
  const changed = await tx<{ id: string }[]>`UPDATE automation_tasks SET status = 'stopped', stop_reason = ${input.reason}, updated_at = now()
    WHERE tenant_id = ${input.tenantId} AND (${input.storeId ?? null}::text IS NULL OR store_id = ${input.storeId ?? null})
      AND (${input.orderId ?? null}::text IS NULL OR order_id = ${input.orderId ?? null})
      AND status IN ('scheduled', 'suppressed', 'handoff') RETURNING id`;
  for (const task of changed) await tx`INSERT INTO automation_task_events
    (id, tenant_id, task_id, event_type, event_key, attempt_count, reason_code)
    VALUES (${randomUUID()}, ${input.tenantId}, ${task.id}, 'stopped', ${`stop:${input.reason}:${task.id}`}, 0, ${input.reason})
    ON CONFLICT (tenant_id, task_id, event_key) DO NOTHING`;
  return changed.length;
}

async function getReadiness(tx: TransactionSql, tenantId: string, storeId: string, templateId: string, locale: string): Promise<WorkflowReadinessChecks> {
  const rows = await tx<{ store_ready: boolean; channel_ready: boolean; template_ready: boolean; consent_ready: boolean }[]>`
    SELECT (s.status = 'active' AND s.connection_status = 'verified') AS store_ready,
      EXISTS (SELECT 1 FROM channels c WHERE c.tenant_id = s.tenant_id AND c.store_id = s.id AND c.status = 'active'
        AND coalesce(c.verification_evidence, '{}'::jsonb) <> '{}'::jsonb) AS channel_ready,
      EXISTS (SELECT 1 FROM whatsapp_templates t JOIN channels c ON c.tenant_id = t.tenant_id AND c.id = t.channel_id
        WHERE c.tenant_id = s.tenant_id AND c.store_id = s.id AND c.status = 'active'
          AND t.status = 'approved' AND t.locale = ${locale}
          AND (t.id = ${templateId} OR t.provider_template_id = ${templateId})
          AND coalesce(t.approval_evidence, '{}'::jsonb) <> '{}'::jsonb) AS template_ready,
      EXISTS (SELECT 1 FROM consents co JOIN contacts ct ON ct.tenant_id = co.tenant_id
        AND ct.store_id = co.store_id AND ct.id = co.contact_id
        WHERE co.tenant_id = s.tenant_id AND co.store_id = s.id AND co.revoked_at IS NULL
          AND co.purpose IN ('marketing', 'utility', 'all')
          AND NOT EXISTS (SELECT 1 FROM suppression_entries se WHERE se.tenant_id = ct.tenant_id
            AND se.store_id = ct.store_id AND se.contact_id = ct.id AND se.revoked_at IS NULL)) AS consent_ready
    FROM stores s WHERE s.tenant_id = ${tenantId} AND s.id = ${storeId}
  `;
  const row = rows[0];
  return { store: row?.store_ready ?? false, channel: row?.channel_ready ?? false, template: row?.template_ready ?? false,
    consent: row?.consent_ready ?? false, worker: false, credits: false };
}

async function getReadinessWithSql(tenantId: string, storeId: string, templateId: string, locale: string) {
  const checks = await withTransaction((tx) => getReadiness(tx, tenantId, storeId, templateId, locale));
  return { ...checks, ...evaluateWorkflowReadiness(checks), unavailableReasons: ["worker_not_configured", "billing_readiness_not_implemented"] };
}

async function requireStore(tx: TransactionSql, actor: ActorContext, storeId: string): Promise<void> {
  const rows = await tx<{ id: string }[]>`SELECT id FROM stores WHERE tenant_id = ${actor.tenantId} AND id = ${storeId}
    AND (${actor.role === "Agent"} = false OR id = ANY(${actor.storeIds}))`;
  if (!rows[0]) throw notFound();
}

function notFound(): ApiError { return new ApiError(404, "NOT_FOUND", "Resource was not found"); }
function conflict(): ApiError { return new ApiError(409, "VERSION_CONFLICT", "Workflow was changed by another request"); }
