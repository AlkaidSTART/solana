import { requireActor, requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ApiError } from "@/lib/server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request) => {
  await requireWriteActor(request, ["Owner", "Admin"]);
  throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Order exports are a Phase 2 capability");
});

export const GET = withApiHandler(async (request) => {
  await requireActor(request, ["Owner", "Admin"]);
  throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Order exports are a Phase 2 capability");
});
