import { z } from "zod";

import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { accepted, ok } from "@/lib/server/http/responses";
import { recheckPaymentOrder } from "@/lib/server/services/billing/service";

type RouteParameters = { params: Promise<{ paymentOrderId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emptyBodySchema = z.object({}).strict();

export const POST = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireWriteActor(request, ["Owner", "Finance"]);
  const { paymentOrderId } = await route.params;
  if (request.body) await parseJson(request, emptyBodySchema, 1024);
  const idempotencyKey = requireHeader(request, "Idempotency-Key");
  const result = await recheckPaymentOrder(actor, paymentOrderId, idempotencyKey, context);
  const { httpStatus, ...body } = result;
  return httpStatus === 200
    ? ok(context, body)
    : accepted(context, body);
});
