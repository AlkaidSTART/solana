import { z } from "zod";

import { requireActor, requireWriteActor } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/http/errors";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { list, ok } from "@/lib/server/http/responses";
import {
  createPaymentOrder,
  createPaymentOrderSchema,
  listPaymentOrders,
} from "@/lib/server/services/billing/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paymentOrdersQuerySchema = z.object({
  status: z.string().trim().max(64).nullable(),
  purpose: z.string().trim().max(64).nullable(),
  cursor: z.string().trim().max(512).nullable(),
}).strict();

export const GET = withApiHandler(async (request, context) => {
  const actor = await requireActor(request, ["Owner", "Finance"]);
  const query = new URL(request.url).searchParams;
  const parsed = paymentOrdersQuerySchema.safeParse({
    status: query.get("status"),
    purpose: query.get("purpose"),
    cursor: query.get("cursor"),
  });
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_QUERY", "Payment order query is invalid");
  }
  const page = await listPaymentOrders(actor, parsed.data);
  return list(context, page.items, page.pageInfo);
});

export const POST = withApiHandler(async (request, context) => {
  const actor = await requireWriteActor(request, ["Owner", "Finance"]);
  const input = await parseJson(request, createPaymentOrderSchema, 8 * 1024);
  const idempotencyKey = requireHeader(request, "Idempotency-Key");
  const order = await createPaymentOrder(actor, input, idempotencyKey, context);
  return ok(context, order);
});
