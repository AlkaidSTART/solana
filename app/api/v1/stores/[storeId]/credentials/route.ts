import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson } from "@/lib/server/http/request";
import { ok } from "@/lib/server/http/responses";
import { putStoreCredentials, storeCredentialsSchema } from "@/lib/server/services/stores/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoreRouteContext = { params: Promise<{ storeId: string }> };

export const PUT = withApiHandler(async (request, context, routeContext: StoreRouteContext) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { storeId } = await routeContext.params;
  const input = await parseJson(request, storeCredentialsSchema, 16 * 1024);
  const result = await putStoreCredentials(actor, storeId, input, context);
  return ok(context, result, { headers: { ETag: `"${result.version}"` } });
});
