import { z } from "zod";

import { assertOrigin, PaymentHttpError, paymentResponse, tenantSession } from "@/lib/server/payments/http";
import { reconcile } from "@/lib/server/payments/reconcile";
import { checkout, paymentServices } from "@/lib/server/payments/service";

type Context = { params: Promise<{ id: string }> };
export const runtime = "nodejs";
async function load(context: Context) {
  const tenant = await tenantSession();
  const id = z.uuid().parse((await context.params).id);
  const services = paymentServices();
  const order = await services.repository.get(id, tenant);
  if (!order) throw new PaymentHttpError(404, "支付订单不存在");
  return { ...services, order, tenant, id };
}
const patchBody = z.object({ status: z.literal("cancelled") });

export async function GET(_request: Request, context: Context) {
  return paymentResponse(async () => checkout((await load(context)).order));
}
export async function POST(request: Request, context: Context) {
  return paymentResponse(async () => {
    assertOrigin(request);
    const { order, chain, repository, tenant, id } = await load(context);
    await reconcile(order, chain, repository);
    const updated = await repository.get(id, tenant);
    if (!updated) throw new PaymentHttpError(404, "支付订单不存在");
    return checkout(updated);
  });
}
export async function PATCH(request: Request, context: Context) {
  return paymentResponse(async () => {
    assertOrigin(request);
    const body = patchBody.parse(await request.json().catch(() => ({})));
    const { repository, order, tenant, id } = await load(context);
    if (body.status === "cancelled") {
      if (order.status !== "awaiting_payment") throw new PaymentHttpError(400, "仅待付款状态的订单可以取消");
      const updated = await repository.cancel(id, tenant);
      if (!updated) throw new PaymentHttpError(404, "支付订单不存在");
      return checkout(updated);
    }
    throw new PaymentHttpError(400, "不支持的状态变更");
  });
}
export async function DELETE(request: Request, context: Context) {
  return paymentResponse(async () => {
    assertOrigin(request);
    const { repository, order, tenant, id } = await load(context);
    if (order.status === "credited") throw new PaymentHttpError(400, "已入账订单为财务凭据，不可删除");
    if (order.status === "confirmed") throw new PaymentHttpError(400, "正在链上确认中的订单不可删除");
    const deleted = await repository.delete(id, tenant);
    if (!deleted) throw new PaymentHttpError(404, "支付订单不存在");
    return { success: true, id };
  });
}
