import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { listChannels } from "@/lib/server/integrations/whatsapp/channels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const search = new URL(request.url).searchParams;
  const storeId = search.get("storeId")?.trim() || undefined;
  const status = search.get("status")?.trim() || undefined;
  const channels = await listChannels(actor, { storeId, status });
  return ok(context, channels);
});
