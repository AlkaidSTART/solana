import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { resolveSchema, transitionConversation } from "@/lib/server/services/conversations/service";

type RouteParameters = { params: Promise<{ conversationId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin", "Agent"]);
  const { conversationId } = await route.params;
  const input = await parseJson(request, resolveSchema, 8 * 1024);
  const result = await transitionConversation(actor, conversationId, "resolve", input, requireHeader(request, "Idempotency-Key"), context);
  return ok(context, result);
});
