import { z } from "zod";

export class PaymentApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
export async function paymentRequest<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/payments/${path}`, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(30_000) });
  const data: unknown = await response.json();
  if (!response.ok) {
    const failure = z.object({ error: z.string() }).safeParse(data);
    throw new PaymentApiError(response.status, failure.success ? failure.data.error : "支付服务不可用，请重试");
  }
  return schema.parse(data);
}
