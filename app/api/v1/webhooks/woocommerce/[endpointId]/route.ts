import { withApiHandler } from "@/lib/server/http/handler";
import { ApiError } from "@/lib/server/http/errors";
import { readRawBody, requireHeader } from "@/lib/server/http/request";
import { receiveWooCommerceWebhook } from "@/lib/server/services/stores/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WEBHOOK_BYTES = 1024 * 1024;
type WebhookRouteContext = { params: Promise<{ endpointId: string }> };

export const POST = withApiHandler(async (request, _context, routeContext: WebhookRouteContext) => {
  const contentType = request.headers.get("Content-Type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new ApiError(400, "INVALID_CONTENT_TYPE", "Content-Type must be application/json");
  }
  const rawBody = await readRawBody(request, MAX_WEBHOOK_BYTES);

  const { endpointId } = await routeContext.params;
  const result = await receiveWooCommerceWebhook({
    endpointId,
    deliveryId: requireHeader(request, "X-WC-Webhook-Delivery-ID"),
    topic: requireHeader(request, "X-WC-Webhook-Topic"),
    providerEvent: request.headers.get("X-WC-Webhook-Event")?.trim() || null,
    signature: requireHeader(request, "X-WC-Webhook-Signature"),
    rawBody,
  });

  return Response.json(result, {
    status: 200,
    headers: { "Cache-Control": "private, no-store" },
  });
});
