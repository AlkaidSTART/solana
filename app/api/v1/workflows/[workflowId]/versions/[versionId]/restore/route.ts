import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ApiError } from "@/lib/server/http/errors";
import { requireHeader } from "@/lib/server/http/request";
import { ok } from "@/lib/server/http/responses";
import { restoreWorkflowVersion } from "@/lib/server/services/workflows/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request, context, route: { params: Promise<{ workflowId: string; versionId: string }> }) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { workflowId, versionId } = await route.params;
  const version = Number(versionId);
  if (!Number.isSafeInteger(version) || version < 1) throw new ApiError(400, "INVALID_VERSION", "Workflow version is invalid");
  const result = await restoreWorkflowVersion(actor, workflowId, version, requireHeader(request, "Idempotency-Key"), context);
  return ok(context, result.body, { status: result.status });
});
