import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { accepted } from "@/lib/server/http/responses";
import { claimPaymentSignature, paymentClaimSchema } from "@/lib/server/services/billing/service";

type RouteParameters = { params: Promise<{ paymentOrderId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireWriteActor(request, ["Owner", "Finance"]);
  const { paymentOrderId } = await route.params;
  const input = await parseJson(request, paymentClaimSchema, 4 * 1024);
  const idempotencyKey = requireHeader(request, "Idempotency-Key");
  const result = await claimPaymentSignature(actor, paymentOrderId, input.signature, idempotencyKey, context);
  return accepted(context, result);
});
