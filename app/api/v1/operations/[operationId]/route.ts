import { requireActor, requireUser } from "@/lib/server/auth/session";
import type { SessionContext } from "@/lib/server/auth/types";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { getOperationForUser } from "@/lib/server/services/system/service";

interface OperationRouteContext {
  params: Promise<{ operationId: string }>;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, routeContext: OperationRouteContext) => {
  const session: SessionContext = await requireUser(request);
  const actor = session.tenantId !== null ? await requireActor(request) : session;
  const { operationId } = await routeContext.params;
  return ok(context, await getOperationForUser(actor, operationId));
});
