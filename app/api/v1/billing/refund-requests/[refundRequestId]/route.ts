import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { refundCapabilityUnavailable } from "@/lib/server/services/billing/service";

type RouteParameters = { params: Promise<{ refundRequestId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, _context, route: RouteParameters) => {
  await requireActor(request, ["Owner", "Finance"]);
  await route.params;
  refundCapabilityUnavailable();
});
