import { ApiError } from "@/lib/server/http/errors";

export type WorkflowType = "payment_reminder" | "cod_confirmation";

export interface PaymentReminderEligibilityInput {
  platform: string;
  paymentStatus: string;
  orderStatus: string;
  isCod: boolean;
  createdAt: string;
  now: string;
}

export interface WorkflowReadinessChecks {
  store: boolean;
  channel: boolean;
  template: boolean;
  consent: boolean;
  worker: boolean;
  credits: boolean;
}

export function evaluatePaymentReminderEligibility(
  order: PaymentReminderEligibilityInput,
): { eligible: boolean; reason: string | null } {
  if (order.platform !== "woocommerce") return blocked("unsupported_platform");
  if (order.isCod) return blocked("cod_order");
  if (order.paymentStatus !== "pending") return blocked("payment_not_confirmed_pending");
  if (["cancelled", "fulfilled", "deleted"].includes(order.orderStatus)) return blocked("order_closed");
  if (order.orderStatus !== "pending") return blocked("order_status_unverified");

  const createdAt = Date.parse(order.createdAt);
  const now = Date.parse(order.now);
  if (!Number.isFinite(createdAt) || !Number.isFinite(now)) return blocked("invalid_order_time");
  const ageMilliseconds = now - createdAt;
  if (ageMilliseconds < 0) return blocked("order_time_in_future");
  if (ageMilliseconds > 2 * 60 * 60 * 1000) return blocked("order_event_too_late");
  return { eligible: true, reason: null };
}

export function isPaymentStatusRegression(current: string, incoming: string): boolean {
  if (current === "refunded") return incoming !== "refunded";
  if (current === "paid") return ["pending", "failed", "unknown"].includes(incoming);
  return false;
}

export function evaluateWorkflowReadiness(
  checks: WorkflowReadinessChecks,
): { ready: boolean; blockingChecks: (keyof WorkflowReadinessChecks)[] } {
  const blockingChecks = (Object.keys(checks) as (keyof WorkflowReadinessChecks)[])
    .filter((key) => !checks[key]);
  return { ready: blockingChecks.length === 0, blockingChecks };
}

export function assertWorkflowTypeAvailable(type: WorkflowType): void {
  if (type === "cod_confirmation") {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "COD confirmation workflows are unavailable in Phase 1");
  }
}

function blocked(reason: string): { eligible: false; reason: string } {
  return { eligible: false, reason };
}
