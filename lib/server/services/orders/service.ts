import type { ActorContext } from "@/lib/server/auth/types";
import { withDatabase } from "@/lib/server/db/client";
import { ApiError } from "@/lib/server/http/errors";

interface OrderListRow {
  id: string;
  createdAt: Date;
  [key: string]: unknown;
}

interface OrderCursor {
  createdAt: string;
  id: string;
}

export async function listOrders(actor: ActorContext, options: {
  storeId?: string | null; orderStatus?: string | null; paymentStatus?: string | null; isCod?: boolean | null;
  locale?: string | null; workflowState?: string | null; search?: string | null; cursor?: string | null;
}) {
  const { storeId } = options;
  assertStoreScope(actor, storeId);
  if (options.orderStatus && !["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed", "deleted"].includes(options.orderStatus)) {
    throw new ApiError(400, "INVALID_ORDER_STATUS", "Order status filter is invalid");
  }
  if (options.paymentStatus && !["pending", "paid", "failed", "refunded", "unknown"].includes(options.paymentStatus)) {
    throw new ApiError(400, "INVALID_PAYMENT_STATUS", "Payment status filter is invalid");
  }
  if (options.search && (options.search.length > 100 || /[\u0000-\u001f\u007f]/.test(options.search))) {
    throw new ApiError(400, "INVALID_SEARCH", "Order search text is invalid");
  }
  if (options.workflowState && !["scheduled", "suppressed", "handoff", "submitted", "sent", "delivered", "delivery_unknown", "failed", "stopped"].includes(options.workflowState)) {
    throw new ApiError(400, "INVALID_WORKFLOW_STATE", "Workflow state filter is invalid");
  }
  const cursor = decodeOrderCursor(options.cursor ?? null);
  return withDatabase(async (sql) => {
    const rows = await sql<OrderListRow[]>`
      SELECT o.id, o.store_id AS "storeId", o.platform_order_id AS "platformOrderId", o.order_status AS "orderStatus",
        o.payment_status AS "paymentStatus", o.fulfillment_status AS "fulfillmentStatus", o.is_cod AS "isCod",
        o.locale, o.currency, o.total_minor AS "totalMinor", o.platform_created_at AS "createdAt", o.updated_at AS "updatedAt",
        (SELECT t.status FROM automation_tasks t WHERE t.tenant_id = o.tenant_id AND t.order_id = o.id
          ORDER BY t.created_at DESC LIMIT 1) AS "workflowState"
      FROM orders o WHERE o.tenant_id = ${actor.tenantId}
        AND (${storeId ?? null}::text IS NULL OR o.store_id = ${storeId ?? null})
        AND (${options.orderStatus ?? null}::text IS NULL OR o.order_status = ${options.orderStatus ?? null})
        AND (${options.paymentStatus ?? null}::text IS NULL OR o.payment_status = ${options.paymentStatus ?? null})
        AND (${options.isCod ?? null}::boolean IS NULL OR o.is_cod = ${options.isCod ?? null})
        AND (${options.locale ?? null}::text IS NULL OR o.locale = ${options.locale ?? null})
        AND (${options.search ?? null}::text IS NULL OR o.platform_order_id ILIKE ('%' || ${options.search ?? null} || '%'))
        AND (${options.workflowState ?? null}::text IS NULL OR EXISTS (SELECT 1 FROM automation_tasks tf
          WHERE tf.tenant_id=o.tenant_id AND tf.order_id=o.id AND tf.status=${options.workflowState ?? null}))
        AND (${actor.role === "Agent"} = false OR o.store_id = ANY(${actor.storeIds}))
        AND (${cursor?.createdAt ?? null}::timestamptz IS NULL
          OR (o.platform_created_at, o.id) < (${cursor?.createdAt ?? null}::timestamptz, ${cursor?.id ?? null}::text))
      ORDER BY o.platform_created_at DESC, o.id DESC LIMIT 101
    `;
    const hasNextPage = rows.length > 100;
    const items = hasNextPage ? rows.slice(0, 100) : rows;
    const last = items.at(-1);
    return {
      items,
      pageInfo: {
        hasNextPage,
        nextCursor: hasNextPage && last
          ? encodeOrderCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
          : null,
      },
    };
  });
}

export async function getOrder(actor: ActorContext, orderId: string) {
  return withDatabase(async (sql) => {
    const rows = await sql`
      SELECT o.id, o.store_id AS "storeId", o.platform_order_id AS "platformOrderId", o.order_status AS "orderStatus",
        o.payment_status AS "paymentStatus", o.fulfillment_status AS "fulfillmentStatus", o.is_cod AS "isCod",
        o.locale, o.currency, o.total_minor AS "totalMinor", o.platform_created_at AS "createdAt", o.updated_at AS "updatedAt"
      FROM orders o WHERE o.tenant_id = ${actor.tenantId} AND o.id = ${orderId}
        AND (${actor.role === "Agent"} = false OR o.store_id = ANY(${actor.storeIds})) LIMIT 1
    `;
    if (!rows[0]) throw notFound();
    return rows[0];
  });
}

export async function listOrderEvents(actor: ActorContext, orderId: string) {
  const order = await getOrder(actor, orderId) as { id: string };
  return withDatabase(async (sql) => ({ items: await sql`
    SELECT id, event_type AS "eventType", event_at AS "eventAt", received_at AS "receivedAt", order_version AS "orderVersion"
    FROM order_events WHERE tenant_id = ${actor.tenantId} AND order_id = ${order.id}
    ORDER BY event_at DESC, id DESC LIMIT 100
  ` }));
}

export function codOrderActionUnavailable(): never {
  throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "COD order actions are a Phase 2 capability");
}

function assertStoreScope(actor: ActorContext, storeId?: string | null): void {
  if (actor.role === "Agent" && storeId && !actor.storeIds.includes(storeId)) throw notFound();
}
function encodeOrderCursor(cursor: OrderCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}
function decodeOrderCursor(value: string | null): OrderCursor | null {
  if (value === null) return null;
  if (!/^[A-Za-z0-9_-]{1,512}$/.test(value)) throw invalidCursor();
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    if (Buffer.from(decoded, "utf8").toString("base64url") !== value) throw new TypeError("Non-canonical cursor");
    const parsed = JSON.parse(decoded) as unknown;
    if (
      typeof parsed !== "object"
      || parsed === null
      || Object.keys(parsed).length !== 2
      || !("createdAt" in parsed)
      || !("id" in parsed)
      || typeof parsed.createdAt !== "string"
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(parsed.createdAt)
      || !Number.isFinite(Date.parse(parsed.createdAt))
      || typeof parsed.id !== "string"
      || parsed.id.length < 1
      || parsed.id.length > 128
    ) throw new TypeError("Invalid cursor");
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    throw invalidCursor();
  }
}
function invalidCursor(): ApiError { return new ApiError(400, "INVALID_CURSOR", "Order cursor is invalid"); }
function notFound(): ApiError { return new ApiError(404, "NOT_FOUND", "Order was not found"); }
