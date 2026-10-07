import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { ok } from "@/lib/server/http/responses";
import { activateWorkflowSchema, setWorkflowActive } from "@/lib/server/services/workflows/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request, context, route: { params: Promise<{ workflowId: string }> }) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { workflowId } = await route.params;
  const input = await parseJson(request, activateWorkflowSchema);
  return ok(context, await setWorkflowActive(actor, workflowId, true, requireHeader(request, "Idempotency-Key"), context, input));
});
