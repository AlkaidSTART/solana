import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { list } from "@/lib/server/http/responses";
import { listAutomationTasks } from "@/lib/server/services/workflows/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context) => {
  const actor = await requireActor(request, ["Owner", "Admin"]);
  const result = await listAutomationTasks(actor, new URL(request.url).searchParams.get("storeId"));
  return list(context, result.items, { nextCursor: null, hasNextPage: false });
});
