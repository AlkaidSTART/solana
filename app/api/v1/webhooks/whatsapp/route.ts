import { withApiHandler } from "@/lib/server/http/handler";
import { ApiError } from "@/lib/server/http/errors";
import { readRawBody } from "@/lib/server/http/request";
import { ingestWebhook, verifyWebhookChallenge } from "@/lib/server/integrations/whatsapp/webhooks";

const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request) => {
  const challenge = verifyWebhookChallenge(new URL(request.url));
  return new Response(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
});

export const POST = withApiHandler(async (request, context) => {
  const contentType = request.headers.get("Content-Type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new ApiError(400, "INVALID_CONTENT_TYPE", "Webhook Content-Type must be application/json");
  }
  const rawBody = await readRawBody(request, MAX_WEBHOOK_BODY_BYTES);
  const result = await ingestWebhook(rawBody, request.headers.get("X-Hub-Signature-256"), context);
  if (result.conflictEventId) {
    throw new ApiError(409, "WEBHOOK_EVENT_CONFLICT", "WhatsApp reused an event ID with different content");
  }
  return Response.json({
    received: true,
    duplicate: result.eventCount > 0 && result.duplicateCount === result.eventCount,
    eventCount: result.eventCount,
  }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
});
