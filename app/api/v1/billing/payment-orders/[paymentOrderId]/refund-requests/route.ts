import { z } from "zod";

import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { refundCapabilityUnavailable } from "@/lib/server/services/billing/service";

type RouteParameters = { params: Promise<{ paymentOrderId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const refundRequestSchema = z.object({
  reason: z.string().trim().min(3).max(2000),
}).strict();

export const POST = withApiHandler(async (request, _context, route: RouteParameters) => {
  await requireWriteActor(request, ["Owner", "Finance"]);
  await route.params;
  await parseJson(request, refundRequestSchema, 8 * 1024);
  requireHeader(request, "Idempotency-Key");
  refundCapabilityUnavailable();
});
