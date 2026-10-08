import { ok } from "@/lib/server/http/responses";
import { withApiHandler } from "@/lib/server/http/handler";
import { getHealthSnapshot } from "@/lib/server/services/system/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (_request, context) => {
  return ok(context, await getHealthSnapshot());
});
