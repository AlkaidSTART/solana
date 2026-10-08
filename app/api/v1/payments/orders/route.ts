import { z } from "zod";

import { creditInput } from "@/lib/payments/contracts";
import { assertOrigin, paymentResponse, readBody, tenantSession } from "@/lib/server/payments/http";
import { createQuote } from "@/lib/server/payments/service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return paymentResponse(async () => {
    assertOrigin(request);
    const tenant = await tenantSession();
    const key = z.uuid().parse(request.headers.get("idempotency-key"));
    const input = creditInput.parse(await readBody(request));
    return createQuote(tenant, input.credits, key);
  });
}
