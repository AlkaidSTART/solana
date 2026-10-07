import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson } from "@/lib/server/http/request";
import { ok } from "@/lib/server/http/responses";
import { previewWorkflow, previewWorkflowSchema } from "@/lib/server/services/workflows/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request, context, route: { params: Promise<{ workflowId: string }> }) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { workflowId } = await route.params;
  const input = await parseJson(request, previewWorkflowSchema);
  return ok(context, await previewWorkflow(actor, workflowId, input.orderId));
});
