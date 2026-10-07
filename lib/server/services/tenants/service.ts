import { randomUUID } from "node:crypto";

import { z } from "zod";

import type { ActorContext, SessionContext } from "@/lib/server/auth/types";
import { ApiError } from "@/lib/server/http/errors";
import type { RequestContext } from "@/lib/server/http/request";
import { writeAuditEvent } from "@/lib/server/audit/service";
import { withDatabase, withTransaction, type TransactionSql } from "@/lib/server/db/client";
import { executeIdempotent } from "@/lib/server/idempotency/service";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const timeIntervalSchema = z.object({
  start: z.string().regex(TIME_PATTERN),
  end: z.string().regex(TIME_PATTERN),
}).strict().refine(({ start, end }) => start < end, {
  message: "Each support interval must end after it starts",
});

export const supportHoursSchema = z.object({
  mon: z.array(timeIntervalSchema).max(2).optional(),
  tue: z.array(timeIntervalSchema).max(2).optional(),
  wed: z.array(timeIntervalSchema).max(2).optional(),
  thu: z.array(timeIntervalSchema).max(2).optional(),
  fri: z.array(timeIntervalSchema).max(2).optional(),
  sat: z.array(timeIntervalSchema).max(2).optional(),
  sun: z.array(timeIntervalSchema).max(2).optional(),
}).strict().refine((hours) => {
  for (const weekday of WEEKDAYS) {
    const intervals = [...(hours[weekday] ?? [])].sort((left, right) => left.start.localeCompare(right.start));
    for (let index = 1; index < intervals.length; index += 1) {
      const previous = intervals[index - 1];
      const current = intervals[index];
      if (previous && current && previous.end > current.start) {
        return false;
      }
    }
  }
  return true;
}, { message: "Support intervals on the same day must not overlap" });

const tenantFields = {
  name: z.string().trim().min(1).max(120).refine((value) => !/[\u0000-\u001f\u007f]/.test(value), {
    message: "Name cannot contain control characters",
  }),
  market: z.string().trim().regex(/^[A-Z]{2}$/),
  timezone: z.string().trim().min(1).max(64).refine(isValidTimezone, {
    message: "Timezone must be a valid IANA timezone",
  }),
  supportHours: supportHoursSchema,
};

export const createTenantSchema = z.object(tenantFields).strict();
export const updateTenantSchema = z.object({
  name: tenantFields.name.optional(),
  market: tenantFields.market.optional(),
  timezone: tenantFields.timezone.optional(),
  supportHours: tenantFields.supportHours.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one tenant field must be provided",
});

export type CreateTenantInput = z.output<typeof createTenantSchema>;
export type UpdateTenantInput = z.output<typeof updateTenantSchema>;

interface TenantRecord {
  id: string;
  name: string;
  market: string;
  timezone: string;
  support_hours: unknown;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export interface TenantView {
  id: string;
  name: string;
  market: string;
  timezone: string;
  supportHours: z.output<typeof supportHoursSchema>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedTenant extends TenantView {
  ownerMembership: {
    id: string;
    role: "Owner";
    status: "active";
  };
}

export async function createTenant(
  user: Pick<SessionContext, "userId">,
  input: CreateTenantInput,
  idempotencyKey: string,
  requestContext: RequestContext,
): Promise<CreatedTenant> {
  const result = await executeIdempotent(
    { userId: user.userId, tenantId: null },
    "tenant.create",
    idempotencyKey,
    input,
    async (transaction) => {
      const tenantId = randomUUID();
      const membershipId = randomUUID();
      const tenantRows = await transaction<TenantRecord[]>`
        INSERT INTO tenants (id, name, market, timezone, support_hours, status, version, created_at, updated_at)
        VALUES (
          ${tenantId}, ${input.name}, ${input.market}, ${input.timezone},
          ${JSON.stringify(input.supportHours)}::jsonb, 'active', 1, now(), now()
        )
        RETURNING id, name, market, timezone, support_hours, version, created_at, updated_at
      `;
      const tenantRow = tenantRows[0];
      if (!tenantRow) {
        throw new ApiError(503, "TENANT_CREATE_UNAVAILABLE", "Tenant could not be created", { retryable: true });
      }

      await transaction`
        INSERT INTO memberships (
          id, tenant_id, user_id, role, status, accepted_at, created_at, updated_at
        ) VALUES (
          ${membershipId}, ${tenantId}, ${user.userId}, 'owner', 'active', now(), now(), now()
        )
      `;
      await writeAuditEvent({
        actor: { userId: user.userId, tenantId },
        action: "tenant.created",
        resourceType: "tenant",
        resourceId: tenantId,
        requestId: requestContext.requestId,
        metadata: { market: input.market },
      }, transaction);

      const tenant = toTenantView(tenantRow);
      const body: CreatedTenant = {
        ...tenant,
        ownerMembership: { id: membershipId, role: "Owner", status: "active" },
      };
      return { status: 200, body };
    },
  );

  return result.body;
}

export async function getCurrentTenant(actor: ActorContext): Promise<TenantView> {
  const rows = await withDatabase((sql) => sql<TenantRecord[]>`
    SELECT id, name, market, timezone, support_hours, version, created_at, updated_at
    FROM tenants
    WHERE id = ${actor.tenantId} AND status = 'active' AND deleted_at IS NULL
  `);
  const tenant = rows[0];
  if (!tenant) {
    throw new ApiError(404, "TENANT_NOT_FOUND", "Tenant was not found");
  }
  return toTenantView(tenant);
}

export function parseTenantIfMatch(value: string): number {
  const match = /^"([1-9]\d*)"$/.exec(value.trim());
  const versionText = match?.[1];
  const version = versionText ? Number(versionText) : Number.NaN;
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new ApiError(400, "INVALID_IF_MATCH", "If-Match must contain the current quoted tenant version");
  }
  return version;
}

export async function updateCurrentTenant(
  actor: ActorContext,
  expectedVersion: number,
  input: UpdateTenantInput,
  requestContext: RequestContext,
): Promise<TenantView> {
  return withTransaction(async (transaction) => {
    const updated = await updateTenantVersion(transaction, actor, expectedVersion, input);
    if (!updated) {
      const current = await transaction<{ version: number }[]>`
        SELECT version FROM tenants
        WHERE id = ${actor.tenantId} AND status = 'active' AND deleted_at IS NULL
      `;
      if (!current[0]) {
        throw new ApiError(404, "TENANT_NOT_FOUND", "Tenant was not found");
      }
      throw new ApiError(409, "VERSION_CONFLICT", "Tenant was changed by another request", {
        details: { expectedVersion, currentVersion: current[0].version },
      });
    }

    await writeAuditEvent({
      actor,
      action: "tenant.updated",
      resourceType: "tenant",
      resourceId: updated.id,
      requestId: requestContext.requestId,
      metadata: {
        fields: Object.keys(input).sort(),
        version: updated.version,
      },
    }, transaction);
    return toTenantView(updated);
  });
}

async function updateTenantVersion(
  transaction: TransactionSql,
  actor: ActorContext,
  expectedVersion: number,
  input: UpdateTenantInput,
): Promise<TenantRecord | null> {
  const rows = await transaction<TenantRecord[]>`
    UPDATE tenants
    SET name = coalesce(${input.name ?? null}, name),
        market = coalesce(${input.market ?? null}, market),
        timezone = coalesce(${input.timezone ?? null}, timezone),
        support_hours = coalesce(${input.supportHours ? JSON.stringify(input.supportHours) : null}::jsonb, support_hours),
        version = version + 1,
        updated_at = now()
    WHERE id = ${actor.tenantId}
      AND version = ${expectedVersion}
      AND status = 'active'
      AND deleted_at IS NULL
    RETURNING id, name, market, timezone, support_hours, version, created_at, updated_at
  `;
  return rows[0] ?? null;
}

function toTenantView(record: TenantRecord): TenantView {
  const supportHours = supportHoursSchema.safeParse(record.support_hours);
  if (!supportHours.success) {
    throw new ApiError(500, "TENANT_CONFIGURATION_INVALID", "Tenant configuration is invalid");
  }
  return {
    id: record.id,
    name: record.name,
    market: record.market,
    timezone: record.timezone,
    supportHours: supportHours.data,
    version: record.version,
    createdAt: new Date(record.created_at).toISOString(),
    updatedAt: new Date(record.updated_at).toISOString(),
  };
}

function isValidTimezone(value: string): boolean {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
