import { requireActor, requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ApiError } from "@/lib/server/http/errors";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { ok } from "@/lib/server/http/responses";
import { archiveKnowledge, archiveKnowledgeSchema, getKnowledge, patchKnowledge, patchKnowledgeSchema } from "@/lib/server/services/knowledge/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: { params: Promise<{ itemId: string }> }) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const { itemId } = await route.params;
  return ok(context, await getKnowledge(actor, itemId));
});

export const PATCH = withApiHandler(async (request, context, route: { params: Promise<{ itemId: string }> }) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { itemId } = await route.params;
  const match = /^\"([1-9]\d*)\"$/.exec(requireHeader(request, "If-Match"));
  const version = Number(match?.[1]);
  if (!Number.isSafeInteger(version)) throw new ApiError(400, "INVALID_IF_MATCH", "If-Match must contain the current quoted item version");
  const input = await parseJson(request, patchKnowledgeSchema);
  return ok(context, await patchKnowledge(actor, itemId, version, input, context));
});

export const DELETE = withApiHandler(async (request, context, route: { params: Promise<{ itemId: string }> }) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { itemId } = await route.params;
  const input = await parseJson(request, archiveKnowledgeSchema);
  const result = await archiveKnowledge(actor, itemId, input.reason, requireHeader(request, "Idempotency-Key"), context);
  return ok(context, result);
});
