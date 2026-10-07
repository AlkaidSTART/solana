import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { accepted } from "@/lib/server/http/responses";
import { requireHeader, parseJson } from "@/lib/server/http/request";
import { queueChannelOperation, testMessageSchema } from "@/lib/server/integrations/whatsapp/channels";

type RouteParameters = { params: Promise<{ channelId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { channelId } = await route.params;
  const input = await parseJson(request, testMessageSchema, 16 * 1024);
  const operation = await queueChannelOperation(
    actor,
    channelId,
    "whatsapp.channel.test_message",
    input,
    requireHeader(request, "Idempotency-Key"),
    context,
  );
  return accepted(context, operation);
});
