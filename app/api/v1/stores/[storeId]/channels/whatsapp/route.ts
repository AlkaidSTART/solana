import { requireActor, requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { accepted, ok } from "@/lib/server/http/responses";
import { requireHeader, parseJson } from "@/lib/server/http/request";
import { createManualChannel, createChannelSchema, listChannels } from "@/lib/server/integrations/whatsapp/channels";

type RouteParameters = { params: Promise<{ storeId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const { storeId } = await route.params;
  const channels = await listChannels(actor, { storeId });
  return ok(context, channels);
});

export const POST = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { storeId } = await route.params;
  const input = await parseJson(request, createChannelSchema, 16 * 1024);
  const result = await createManualChannel(
    actor,
    storeId,
    input,
    requireHeader(request, "Idempotency-Key"),
    context,
  );
  return accepted(context, result);
});
