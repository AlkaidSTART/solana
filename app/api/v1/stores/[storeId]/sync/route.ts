import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { accepted } from "@/lib/server/http/responses";
import { requestStoreSync, syncStoreSchema } from "@/lib/server/services/stores/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoreRouteContext = { params: Promise<{ storeId: string }> };

export const POST = withApiHandler(async (request, context, routeContext: StoreRouteContext) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { storeId } = await routeContext.params;
  const input = await parseJson(request, syncStoreSchema, 16 * 1024);
  const idempotencyKey = requireHeader(request, "Idempotency-Key");
  const result = await requestStoreSync(actor, storeId, input, idempotencyKey, context);
  return accepted(context, result);
});
