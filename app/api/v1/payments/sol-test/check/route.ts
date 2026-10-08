import { solTestRequest } from "@/lib/server/payments/sol-test/http";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return solTestRequest(request, "check");
}
