import { requireActor, requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { ok } from "@/lib/server/http/responses";
import {
  deleteStoreSchema,
  disableStore,
  getStore,
  parseStoreIfMatch,
  updateStore,
  updateStoreSchema,
} from "@/lib/server/services/stores/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoreRouteContext = { params: Promise<{ storeId: string }> };

const STORE_READ_ROLES = ["Owner", "Admin", "Agent"] as const;
const STORE_CONFIGURE_ROLES = ["Owner", "Admin"] as const;

export const GET = withApiHandler(async (request, context, routeContext: StoreRouteContext) => {
  const actor = await requireActor(request, STORE_READ_ROLES);
  const { storeId } = await routeContext.params;
  const store = await getStore(actor, storeId);
  return ok(context, store, { headers: { ETag: `"${store.version}"` } });
});

export const PATCH = withApiHandler(async (request, context, routeContext: StoreRouteContext) => {
  const actor = await requireWriteActor(request, STORE_CONFIGURE_ROLES);
  const { storeId } = await routeContext.params;
  const expectedVersion = parseStoreIfMatch(requireHeader(request, "If-Match"));
  const input = await parseJson(request, updateStoreSchema, 16 * 1024);
  const store = await updateStore(actor, storeId, expectedVersion, input, context);
  return ok(context, store, { headers: { ETag: `"${store.version}"` } });
});

export const DELETE = withApiHandler(async (request, context, routeContext: StoreRouteContext) => {
  const actor = await requireWriteActor(request, ["Owner"]);
  const { storeId } = await routeContext.params;
  const input = await parseJson(request, deleteStoreSchema, 16 * 1024);
  const idempotencyKey = requireHeader(request, "Idempotency-Key");
  const store = await disableStore(actor, storeId, input, idempotencyKey, context);
  return ok(context, store);
});
