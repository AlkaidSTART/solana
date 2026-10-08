import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { accepted } from "@/lib/server/http/responses";
import { requireHeader, parseJson } from "@/lib/server/http/request";
import { rotateChannelCredentials, rotateCredentialsSchema } from "@/lib/server/integrations/whatsapp/channels";

type RouteParameters = { params: Promise<{ channelId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PUT = withApiHandler(async (request, context, route: RouteParameters) => {
  const actor = await requireWriteActor(request, ["Owner", "Admin"]);
  const { channelId } = await route.params;
  const input = await parseJson(request, rotateCredentialsSchema, 8 * 1024);
  const operation = await rotateChannelCredentials(
    actor,
    channelId,
    input,
    requireHeader(request, "Idempotency-Key"),
    context,
  );
  return accepted(context, operation);
});
