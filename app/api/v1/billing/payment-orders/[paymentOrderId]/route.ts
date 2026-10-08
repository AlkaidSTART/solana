import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { getPaymentOrder } from "@/lib/server/services/billing/service";

type RouteParameters = { params: Promise<{ paymentOrderId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireActor(request, ["Owner", "Finance"]);
  const { paymentOrderId } = await route.params;
  return ok(context, await getPaymentOrder(actor, paymentOrderId));
});
