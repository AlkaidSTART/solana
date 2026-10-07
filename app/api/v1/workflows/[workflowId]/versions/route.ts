import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { list } from "@/lib/server/http/responses";
import { listWorkflowVersions } from "@/lib/server/services/workflows/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: { params: Promise<{ workflowId: string }> }) => {
  const actor = await requireActor(request, ["Owner", "Admin"]);
  const { workflowId } = await route.params;
  const result = await listWorkflowVersions(actor, workflowId);
  return list(context, result.items, { nextCursor: null, hasNextPage: false });
});
