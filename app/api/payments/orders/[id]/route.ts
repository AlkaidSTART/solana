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
