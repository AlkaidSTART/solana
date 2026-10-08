import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { list } from "@/lib/server/http/responses";
import { listOrderEvents } from "@/lib/server/services/orders/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: { params: Promise<{ orderId: string }> }) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const { orderId } = await route.params;
  const result = await listOrderEvents(actor, orderId);
  return list(context, result.items, { nextCursor: null, hasNextPage: false });
});
