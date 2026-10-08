import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { accepted } from "@/lib/server/http/responses";
import { requireHeader } from "@/lib/server/http/request";
import { queueChannelOperation } from "@/lib/server/integrations/whatsapp/channels";

type RouteParameters = { params: Promise<{ channelId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { channelId } = await route.params;
  const operation = await queueChannelOperation(
    actor,
    channelId,
    "whatsapp.channel.templates_sync",
    {},
    requireHeader(request, "Idempotency-Key"),
    context,
  );
  return accepted(context, operation);
});
