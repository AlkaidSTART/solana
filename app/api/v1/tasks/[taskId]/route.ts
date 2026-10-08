import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { getAutomationTask } from "@/lib/server/services/workflows/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: { params: Promise<{ taskId: string }> }) => {
  const actor = await requireActor(request, ["Owner", "Admin"]);
  const { taskId } = await route.params;
  return ok(context, await getAutomationTask(actor, taskId));
});
