import { requireActor, requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { requireHeader, parseJson } from "@/lib/server/http/request";
import { deleteChannelSchema, getChannel, queueChannelOperation } from "@/lib/server/integrations/whatsapp/channels";

type RouteParameters = { params: Promise<{ channelId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const { channelId } = await route.params;
  return ok(context, await getChannel(actor, channelId));
});

export const DELETE = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireWriteActor(request, ["Owner"]);
  const { channelId } = await route.params;
  const input = await parseJson(request, deleteChannelSchema, 8 * 1024);
  const operation = await queueChannelOperation(
    actor,
    channelId,
    "whatsapp.channel.delete",
    input,
    requireHeader(request, "Idempotency-Key"),
    context,
  );
  return ok(context, operation);
});
