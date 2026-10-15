import { createLocalSession, paymentResponse, tenantSession } from "@/lib/server/payments/http";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return paymentResponse(async () => ({ tenantId: await createLocalSession(request) }));
}

export async function GET(request: Request) {
  return paymentResponse(async () => ({ tenantId: await tenantSession(request) }));
}
