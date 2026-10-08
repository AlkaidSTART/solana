import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { getBillingCatalog } from "@/lib/server/services/billing/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context) => {
  await requireActor(request, ["Owner", "Finance"]);
  return ok(context, getBillingCatalog());
});
