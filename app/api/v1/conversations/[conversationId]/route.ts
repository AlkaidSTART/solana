import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { getConversation } from "@/lib/server/services/conversations/service";

type RouteParameters = { params: Promise<{ conversationId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const { conversationId } = await route.params;
  return ok(context, await getConversation(actor, conversationId));
});
