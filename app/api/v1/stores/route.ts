import { requireActor, requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson } from "@/lib/server/http/request";
import { list, ok } from "@/lib/server/http/responses";
import {
  createStore,
  createStoreSchema,
  listStores,
  parseStoreStatus,
} from "@/lib/server/services/stores/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORE_READ_ROLES = ["Owner", "Admin", "Agent"] as const;
const STORE_CONFIGURE_ROLES = ["Owner", "Admin"] as const;

export const GET = withApiHandler(async (request, context) => {
  const actor = await requireActor(request, STORE_READ_ROLES);
  const query = new URL(request.url).searchParams;
  const page = await listStores(actor, {
    status: parseStoreStatus(query.get("status")),
    cursor: query.get("cursor"),
  });
  return list(context, page.items, page.pageInfo);
});

export const POST = withApiHandler(async (request, context) => {
  const actor = await requireWriteActor(request, STORE_CONFIGURE_ROLES);
  const input = await parseJson(request, createStoreSchema, 16 * 1024);
  const store = await createStore(actor, input, context);
  return ok(context, store, { status: 201, headers: { ETag: `"${store.version}"` } });
});
