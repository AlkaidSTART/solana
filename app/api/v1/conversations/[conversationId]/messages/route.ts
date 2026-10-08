import { requireActor, requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { ApiError } from "@/lib/server/http/errors";
import {
  createHumanMessage,
  createHumanMessageSchema,
  listMessages,
  messageListQuerySchema,
} from "@/lib/server/services/conversations/service";

type RouteParameters = { params: Promise<{ conversationId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const { conversationId } = await route.params;
  const search = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = messageListQuerySchema.safeParse(search);
  if (!parsed.success) throw new ApiError(400, "INVALID_QUERY", "Message pagination is invalid");
  return ok(context, await listMessages(actor, conversationId, parsed.data));
});

export const POST = withApiHandler(async (request, _context, route: RouteParameters) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin", "Agent"]);
  const { conversationId } = await route.params;
  const input = await parseJson(request, createHumanMessageSchema, 8 * 1024);
  requireHeader(request, "Idempotency-Key");
  return createHumanMessage(actor, conversationId, input);
});
