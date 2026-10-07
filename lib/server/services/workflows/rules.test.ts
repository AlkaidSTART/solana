import { describe, expect, it } from "vitest";

import {
  assertWorkflowTypeAvailable,
  evaluatePaymentReminderEligibility,
  evaluateWorkflowReadiness,
  isPaymentStatusRegression,
} from "@/lib/server/services/workflows/rules";

describe("Phase 1 workflow rules", () => {
  it("allows a recent unpaid non-COD WooCommerce order", () => {
    expect(evaluatePaymentReminderEligibility({
      platform: "woocommerce",
      paymentStatus: "pending",
      orderStatus: "pending",
      isCod: false,
      createdAt: "2026-10-07T10:00:00.000Z",
      now: "2026-10-07T10:15:00.000Z",
    })).toEqual({ eligible: true, reason: null });
  });

  it("blocks COD and orders that are paid, cancelled, or fulfilled", () => {
    const base = {
      platform: "woocommerce" as const,
      paymentStatus: "pending" as const,
      orderStatus: "pending" as const,
      isCod: false,
      createdAt: "2026-10-07T10:00:00.000Z",
      now: "2026-10-07T10:15:00.000Z",
    };
    expect(evaluatePaymentReminderEligibility({ ...base, isCod: true }).eligible).toBe(false);
    expect(evaluatePaymentReminderEligibility({ ...base, paymentStatus: "paid" }).eligible).toBe(false);
    expect(evaluatePaymentReminderEligibility({ ...base, orderStatus: "cancelled" }).eligible).toBe(false);
    expect(evaluatePaymentReminderEligibility({ ...base, orderStatus: "fulfilled" }).eligible).toBe(false);
  });

  it("does not allow stale pending events to regress paid or refunded orders", () => {
    expect(isPaymentStatusRegression("paid", "pending")).toBe(true);
    expect(isPaymentStatusRegression("refunded", "pending")).toBe(true);
    expect(isPaymentStatusRegression("paid", "refunded")).toBe(false);
    expect(isPaymentStatusRegression("refunded", "paid")).toBe(true);
    expect(isPaymentStatusRegression("pending", "paid")).toBe(false);
  });

  it("blocks workflow activation when any readiness evidence is missing", () => {
    expect(evaluateWorkflowReadiness({
      store: true,
      channel: true,
      template: true,
      consent: false,
      worker: true,
      credits: true,
    })).toEqual({ ready: false, blockingChecks: ["consent"] });
  });

  it("reports COD confirmation as unavailable in Phase 1", () => {
    expect(() => assertWorkflowTypeAvailable("cod_confirmation")).toThrowError(
      expect.objectContaining({ status: 503, code: "CAPABILITY_UNAVAILABLE" }),
    );
  });
});
