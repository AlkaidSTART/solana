import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { list } from "@/lib/server/http/responses";
import { conversationListQuerySchema, listConversations } from "@/lib/server/services/conversations/service";
import { ApiError } from "@/lib/server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const search = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = conversationListQuerySchema.safeParse(search);
  if (!parsed.success) throw new ApiError(400, "INVALID_QUERY", "Conversation filters are invalid");
  const result = await listConversations(actor, parsed.data);
  return list(context, result.items, { nextCursor: result.nextCursor, hasNextPage: result.hasNextPage });
});
