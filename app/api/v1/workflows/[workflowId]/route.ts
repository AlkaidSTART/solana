import { requireActor, requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ApiError } from "@/lib/server/http/errors";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { ok } from "@/lib/server/http/responses";
import { getWorkflow, patchWorkflow, patchWorkflowSchema } from "@/lib/server/services/workflows/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: { params: Promise<{ workflowId: string }> }) => {
  const actor = await requireActor(request, ["Owner", "Admin"]);
  const { workflowId } = await route.params;
  return ok(context, await getWorkflow(actor, workflowId));
});

export const PATCH = withApiHandler(async (request, context, route: { params: Promise<{ workflowId: string }> }) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { workflowId } = await route.params;
  const match = /^\"([1-9]\d*)\"$/.exec(requireHeader(request, "If-Match"));
  const version = Number(match?.[1]);
  if (!Number.isSafeInteger(version)) throw new ApiError(400, "INVALID_IF_MATCH", "If-Match must contain the current quoted workflow version");
  const input = await parseJson(request, patchWorkflowSchema);
  return ok(context, await patchWorkflow(actor, workflowId, version, input, context));
});
