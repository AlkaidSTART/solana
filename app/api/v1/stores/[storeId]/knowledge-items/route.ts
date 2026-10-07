import { requireActor, requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { list, ok } from "@/lib/server/http/responses";
import { createKnowledge, knowledgeContentSchema, listKnowledge } from "@/lib/server/services/knowledge/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: { params: Promise<{ storeId: string }> }) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const { storeId } = await route.params;
  const query = new URL(request.url).searchParams;
  const result = await listKnowledge(actor, {
    storeId,
    status: query.get("status"),
    type: query.get("type"),
    locale: query.get("locale"),
    search: query.get("search"),
    cursor: query.get("cursor"),
  });
  return list(context, result.items, result.pageInfo);
});

export const POST = withApiHandler(async (request, context, route: { params: Promise<{ storeId: string }> }) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { storeId } = await route.params;
  const input = await parseJson(request, knowledgeContentSchema);
  const result = await createKnowledge(actor, storeId, input, requireHeader(request, "Idempotency-Key"), context);
  return ok(context, result.body, { status: result.status });
});
