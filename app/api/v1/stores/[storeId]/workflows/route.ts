import { requireActor, requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { list, ok } from "@/lib/server/http/responses";
import { createWorkflow, createWorkflowSchema, listWorkflows } from "@/lib/server/services/workflows/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: { params: Promise<{ storeId: string }> }) => {
  const actor = await requireActor(request, ["Owner", "Admin"]);
  const { storeId } = await route.params;
  const result = await listWorkflows(actor, storeId, new URL(request.url).searchParams.get("status"));
  return list(context, result.items, { nextCursor: null, hasNextPage: false });
});

export const POST = withApiHandler(async (request, context, route: { params: Promise<{ storeId: string }> }) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { storeId } = await route.params;
  const input = await parseJson(request, createWorkflowSchema);
  const workflow = await createWorkflow(actor, storeId, input, requireHeader(request, "Idempotency-Key"), context);
  return ok(context, workflow, { status: 201 });
});
