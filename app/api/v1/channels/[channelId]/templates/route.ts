import { requireActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { getChannel, listTemplates } from "@/lib/server/integrations/whatsapp/channels";

type RouteParameters = { params: Promise<{ channelId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const { channelId } = await route.params;
  await getChannel(actor, channelId);
  const search = new URL(request.url).searchParams;
  const templates = await listTemplates(actor, channelId, {
    locale: search.get("locale")?.trim() || undefined,
    status: search.get("status")?.trim() || undefined,
  });
  return ok(context, templates);
});
