import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ApiError } from "@/lib/server/http/errors";
import { requireHeader } from "@/lib/server/http/request";
import { ok } from "@/lib/server/http/responses";
import { publishKnowledge } from "@/lib/server/services/knowledge/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request, context, route: { params: Promise<{ itemId: string }> }) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { itemId } = await route.params;
  const match = /^\"([1-9]\d*)\"$/.exec(requireHeader(request, "If-Match"));
  const version = Number(match?.[1]);
  if (!Number.isSafeInteger(version)) throw new ApiError(400, "INVALID_IF_MATCH", "If-Match must contain the current quoted item version");
  return ok(context, await publishKnowledge(actor, itemId, version, context));
});
