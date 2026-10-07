import { requireUser } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { getAuthSessionSnapshot } from "@/lib/server/services/auth/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context) => {
  const session = await requireUser(request);
  return ok(context, await getAuthSessionSnapshot(session));
});
