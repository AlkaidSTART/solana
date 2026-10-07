import { billingSchema } from "@/lib/payments/contracts";
import { paymentResponse, tenantSession } from "@/lib/server/payments/http";
import { paymentServices } from "@/lib/server/payments/service";

export const runtime = "nodejs";
export async function GET() {
  return paymentResponse(async () => {
    const tenant = await tenantSession();
    return billingSchema.parse(await paymentServices().repository.billing(tenant));
  });
}
