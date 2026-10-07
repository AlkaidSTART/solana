import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { list } from "@/lib/server/http/responses";
import { listConflicts } from "@/lib/server/services/knowledge/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context) => {
  const actor = await requireActor(request, ["Owner", "Admin"]);
  const query = new URL(request.url).searchParams;
  const result = await listConflicts(actor, query.get("storeId"), query.get("status"));
  return list(context, result.items, { nextCursor: null, hasNextPage: false });
});
