import { requireActor } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/http/errors";
import { withApiHandler } from "@/lib/server/http/handler";
import { list } from "@/lib/server/http/responses";
import { listOrders } from "@/lib/server/services/orders/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, context) => {
  const actor = await requireActor(request, ["Owner", "Admin", "Agent"]);
  const query = new URL(request.url).searchParams;
  const codValue = query.get("isCod");
  if (codValue !== null && codValue !== "true" && codValue !== "false") {
    throw new ApiError(400, "INVALID_COD_FILTER", "isCod filter must be true or false");
  }
  const result = await listOrders(actor, {
    storeId: query.get("storeId"),
    orderStatus: query.get("orderStatus"),
    paymentStatus: query.get("paymentStatus"),
    isCod: codValue === null ? null : codValue === "true",
    locale: query.get("locale"),
    workflowState: query.get("workflowState"),
    search: query.get("search"),
    cursor: query.get("cursor"),
  });
  return list(context, result.items, result.pageInfo);
});
