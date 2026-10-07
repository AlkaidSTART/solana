import { requireActor, requireWriteActor } from "@/lib/server/auth/session";
import { requireHeader, parseJson } from "@/lib/server/http/request";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import {
  getCurrentTenant,
  parseTenantIfMatch,
  updateCurrentTenant,
  updateTenantSchema,
} from "@/lib/server/services/tenants/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context) => {
  const actor = await requireActor(request);
  const tenant = await getCurrentTenant(actor);
  return ok(context, tenant, { headers: { ETag: `"${tenant.version}"` } });
});

export const PATCH = withApiHandler(async (request, context) => {
  const actor = await requireWriteActor(request, ["Owner"]);
  const expectedVersion = parseTenantIfMatch(requireHeader(request, "If-Match"));
  const input = await parseJson(request, updateTenantSchema, 16 * 1024);
  const tenant = await updateCurrentTenant(actor, expectedVersion, input, context);
  return ok(context, tenant, { headers: { ETag: `"${tenant.version}"` } });
});
