import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { accepted } from "@/lib/server/http/responses";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { resumeSchema, transitionConversation } from "@/lib/server/services/conversations/service";

type RouteParameters = { params: Promise<{ conversationId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { conversationId } = await route.params;
  const input = await parseJson(request, resumeSchema, 8 * 1024);
  const result = await transitionConversation(actor, conversationId, "resume", input, requireHeader(request, "Idempotency-Key"), context);
  return accepted(context, result);
});
