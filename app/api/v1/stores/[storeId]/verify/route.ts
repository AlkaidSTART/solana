import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { requireHeader } from "@/lib/server/http/request";
import { accepted } from "@/lib/server/http/responses";
import { requestStoreVerification } from "@/lib/server/services/stores/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoreRouteContext = { params: Promise<{ storeId: string }> };

export const POST = withApiHandler(async (request, context, routeContext: StoreRouteContext) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { storeId } = await routeContext.params;
  const idempotencyKey = requireHeader(request, "Idempotency-Key");
  const result = await requestStoreVerification(actor, storeId, idempotencyKey, context);
  return accepted(context, result);
});
