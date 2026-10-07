import { requireHeader, parseJson } from "@/lib/server/http/request";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { requireWriteUser } from "@/lib/server/auth/session";
import { createTenant, createTenantSchema } from "@/lib/server/services/tenants/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request, context) => {
  const user = await requireWriteUser(request);
  const input = await parseJson(request, createTenantSchema, 16 * 1024);
  const idempotencyKey = requireHeader(request, "Idempotency-Key");
  const tenant = await createTenant(user, input, idempotencyKey, context);
  return ok(context, tenant);
});
