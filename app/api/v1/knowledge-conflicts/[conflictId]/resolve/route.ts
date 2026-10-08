import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson } from "@/lib/server/http/request";
import { ok } from "@/lib/server/http/responses";
import { resolveConflict, resolveConflictSchema } from "@/lib/server/services/knowledge/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request, context, route: { params: Promise<{ conflictId: string }> }) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { conflictId } = await route.params;
  const input = await parseJson(request, resolveConflictSchema);
  return ok(context, await resolveConflict(actor, conflictId, input, context));
});
