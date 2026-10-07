import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { getOrder } from "@/lib/server/services/orders/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: { params: Promise<{ orderId: string }> }) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const { orderId } = await route.params;
  return ok(context, await getOrder(actor, orderId));
});
