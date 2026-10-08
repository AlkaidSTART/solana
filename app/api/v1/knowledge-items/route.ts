import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { list } from "@/lib/server/http/responses";
import { listKnowledge } from "@/lib/server/services/knowledge/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const query = new URL(request.url).searchParams;
  const result = await listKnowledge(actor, {
    storeId: query.get("storeId"),
    status: query.get("status"),
    type: query.get("type"),
    locale: query.get("locale"),
    search: query.get("search"),
    cursor: query.get("cursor"),
  });
  return list(context, result.items, result.pageInfo);
});
