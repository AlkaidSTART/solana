import { describe, expect, it } from "vitest";

import {
  checkReminderEligibility,
  checkTenantPermission,
  evaluateCodTransition,
  evaluateCreditsBilling,
  getLocalHour,
  type BillingWindow,
  type CodEventInput,
  type OrderReminderInput,
} from "./workflow";

describe("Workflow Business Rules & Decision Engine", () => {
  describe("Scenario A: Abandoned Order 15-Minute Recovery (PRD 5.1 & 4.3)", () => {
    const baseInput: OrderReminderInput = {
      order: {
        paymentMethod: "stripe_card",
        status: "pending",
        createdAt: "2026-10-07T10:00:00.000Z",
        buyerPhone: "+628123456789",
        marketingConsent: true,
      },
      context: {
        now: "2026-10-07T10:16:00.000Z", // 16 minutes later (17:16 WIB, daytime)
        timezone: "Asia/Jakarta",
        hasApprovedTemplate: true,
        isUnsubscribed: false,
        sentCountInLast24h: 0,
        isHumanActive: false,
      },
    };

    it("accepts eligible pending order at 16 minutes daytime with consent", () => {
      const result = checkReminderEligibility(baseInput);
      expect(result.eligible).toBe(true);
      expect(result.reason).toBe("eligible");
    });

    it("rejects COD orders from abandoned payment recovery", () => {
      const input: OrderReminderInput = {
        ...baseInput,
        order: { ...baseInput.order, paymentMethod: "cod" },
      };
      expect(checkReminderEligibility(input)).toEqual({
        eligible: false,
        reason: "ineligible_cod_order",
      });
    });

    it.each(["processing", "on-hold", "completed", "cancelled", "refunded"] as const)(
      "rejects non-pending order status: %s",
      (status) => {
        const input: OrderReminderInput = {
          ...baseInput,
          order: { ...baseInput.order, status },
        };
        expect(checkReminderEligibility(input)).toEqual({
          eligible: false,
          reason: "ineligible_order_status",
        });
      }
    );

    it("rejects when buyer contact phone is missing or blank", () => {
      const inputNull: OrderReminderInput = {
        ...baseInput,
        order: { ...baseInput.order, buyerPhone: null },
      };
      expect(checkReminderEligibility(inputNull)).toEqual({
        eligible: false,
        reason: "missing_contact",
      });

      const inputBlank: OrderReminderInput = {
        ...baseInput,
        order: { ...baseInput.order, buyerPhone: "   " },
      };
      expect(checkReminderEligibility(inputBlank)).toEqual({
        eligible: false,
        reason: "missing_contact",
      });
    });

    it("rejects when buyer has not granted marketing consent", () => {
      const input: OrderReminderInput = {
        ...baseInput,
        order: { ...baseInput.order, marketingConsent: false },
      };
      expect(checkReminderEligibility(input)).toEqual({
        eligible: false,
        reason: "missing_marketing_consent",
      });
    });

    it("rejects when WhatsApp template is not approved", () => {
      const input: OrderReminderInput = {
        ...baseInput,
        context: { ...baseInput.context, hasApprovedTemplate: false },
      };
      expect(checkReminderEligibility(input)).toEqual({
        eligible: false,
        reason: "missing_approved_template",
      });
    });

    it("stops automatically when buyer has unsubscribed", () => {
      const input: OrderReminderInput = {
        ...baseInput,
        context: { ...baseInput.context, isUnsubscribed: true },
      };
      expect(checkReminderEligibility(input)).toEqual({
        eligible: false,
        reason: "suppressed_unsubscribed",
      });
    });

    it("stops automatically when human agent is active on conversation", () => {
      const input: OrderReminderInput = {
        ...baseInput,
        context: { ...baseInput.context, isHumanActive: true },
      };
      expect(checkReminderEligibility(input)).toEqual({
        eligible: false,
        reason: "suppressed_human_takeover",
      });
    });

    it("rejects when age is under 15 minutes", () => {
      const input: OrderReminderInput = {
        ...baseInput,
        context: {
          ...baseInput.context,
          now: "2026-10-07T10:14:00.000Z", // 14 minutes later
        },
      };
      expect(checkReminderEligibility(input)).toEqual({
        eligible: false,
        reason: "too_early",
      });
    });

    it("terminates when order age exceeds 2 hours late-event cutoff", () => {
      const input: OrderReminderInput = {
        ...baseInput,
        context: {
          ...baseInput.context,
          now: "2026-10-07T12:05:00.000Z", // 2 hours 5 mins later
        },
      };
      expect(checkReminderEligibility(input)).toEqual({
        eligible: false,
        reason: "event_late_terminated",
      });
    });

    it("suppresses outbound message during 21:00 - 09:00 quiet hours", () => {
      // 22:30 WIB is 15:30 UTC
      const nightInput: OrderReminderInput = {
        ...baseInput,
        order: { ...baseInput.order, createdAt: "2026-10-07T15:00:00.000Z" },
        context: {
          ...baseInput.context,
          now: "2026-10-07T15:30:00.000Z", // 22:30 in Asia/Jakarta
        },
      };
      expect(checkReminderEligibility(nightInput)).toEqual({
        eligible: false,
        reason: "suppressed_quiet_hours",
      });

      // 03:00 WIB is 20:00 UTC previous day
      const dawnInput: OrderReminderInput = {
        ...baseInput,
        order: { ...baseInput.order, createdAt: "2026-10-07T19:40:00.000Z" },
        context: {
          ...baseInput.context,
          now: "2026-10-07T20:00:00.000Z", // 03:00 in Asia/Jakarta
        },
      };
      expect(checkReminderEligibility(dawnInput)).toEqual({
        eligible: false,
        reason: "suppressed_quiet_hours",
      });
    });

    it("suppresses when rolling 24-hour rate limit (2 messages) is reached", () => {
      const input: OrderReminderInput = {
        ...baseInput,
        context: { ...baseInput.context, sentCountInLast24h: 2 },
      };
      expect(checkReminderEligibility(input)).toEqual({
        eligible: false,
        reason: "suppressed_rate_limit",
      });
    });
  });

  describe("Timezone helper", () => {
    it("computes accurate local hour for Jakarta (UTC+7)", () => {
      // 2026-10-07 10:00 UTC -> 17:00 WIB
      expect(getLocalHour("2026-10-07T10:00:00.000Z", "Asia/Jakarta")).toBe(17);
      // 2026-10-07 15:00 UTC -> 22:00 WIB
      expect(getLocalHour("2026-10-07T15:00:00.000Z", "Asia/Jakarta")).toBe(22);
    });
  });

  describe("Scenario B: COD Intent State Machine (PRD 5.2)", () => {
    const baseCod: CodEventInput = {
      orderCreatedAt: "2026-10-07T08:00:00.000Z",
      deadlineAt: "2026-10-08T08:00:00.000Z",
      isFulfilled: false,
      action: "check_eligibility",
      now: "2026-10-07T08:06:00.000Z", // 6 minutes after creation
    };

    it("delays checking when under 5 minutes from creation", () => {
      const input: CodEventInput = {
        ...baseCod,
        now: "2026-10-07T08:03:00.000Z", // 3 minutes
      };
      const res = evaluateCodTransition(input);
      expect(res.status).toBe("waiting_delay");
      expect(res.requiresHumanReview).toBe(false);
    });

    it("moves to awaiting_confirmation after 5 minutes", () => {
      const res = evaluateCodTransition(baseCod);
      expect(res.status).toBe("awaiting_confirmation");
      expect(res.requiresHumanReview).toBe(false);
    });

    it("marks confirmed without human intervention on buyer positive response", () => {
      const res = evaluateCodTransition({ ...baseCod, action: "buyer_confirm" });
      expect(res.status).toBe("confirmed");
      expect(res.requiresHumanReview).toBe(false);
    });

    it("flags address change request and pauses for merchant manual review", () => {
      const res = evaluateCodTransition({
        ...baseCod,
        action: "buyer_request_address_change",
      });
      expect(res.status).toBe("address_change_requested");
      expect(res.requiresHumanReview).toBe(true);
    });

    it("flags cancellation request and pauses for merchant manual review", () => {
      const res = evaluateCodTransition({
        ...baseCod,
        action: "buyer_request_cancellation",
      });
      expect(res.status).toBe("cancellation_requested");
      expect(res.requiresHumanReview).toBe(true);
    });

    it("escalates to human queue on 12-hour timeout", () => {
      const res = evaluateCodTransition({ ...baseCod, action: "timeout_12h" });
      expect(res.status).toBe("no_response");
      expect(res.requiresHumanReview).toBe(true);
    });

    it("closes automated flow when order is already fulfilled on eCommerce store", () => {
      const res = evaluateCodTransition({ ...baseCod, isFulfilled: true });
      expect(res.status).toBe("closed");
      expect(res.requiresHumanReview).toBe(false);
    });

    it("closes flow and requires merchant decision when past shipping deadline", () => {
      const res = evaluateCodTransition({
        ...baseCod,
        now: "2026-10-08T09:00:00.000Z", // 1 hour past deadline
      });
      expect(res.status).toBe("closed");
      expect(res.requiresHumanReview).toBe(true);
      expect(res.reason).toBe("passed_deadline");
    });
  });

  describe("Scenario C: 24-Hour Credits Billing Window (PRD 6.1)", () => {
    const t0 = "2026-10-07T00:00:00.000Z";

    it("consumes 1 credit and creates 24h window on first delivered message", () => {
      const res = evaluateCreditsBilling(null, "delivered", t0);
      expect(res.shouldConsumeCredit).toBe(true);
      expect(res.shouldReleaseReservation).toBe(false);
      expect(res.activeWindow).not.toBeNull();
      expect(res.activeWindow?.creditsConsumed).toBe(1);
      expect(res.activeWindow?.outboundCount).toBe(1);
      expect(res.activeWindow?.windowStartedAt).toBe(t0);
      expect(res.activeWindow?.windowExpiresAt).toBe("2026-10-08T00:00:00.000Z");
    });

    it("consumes 1 credit when read status arrives first", () => {
      const res = evaluateCreditsBilling(null, "read", t0);
      expect(res.shouldConsumeCredit).toBe(true);
      expect(res.activeWindow?.creditsConsumed).toBe(1);
    });

    it("does not consume credit while status is queued or sent", () => {
      const queuedRes = evaluateCreditsBilling(null, "queued", t0);
      expect(queuedRes.shouldConsumeCredit).toBe(false);
      expect(queuedRes.shouldReleaseReservation).toBe(false);
      expect(queuedRes.activeWindow).toBeNull();

      const sentRes = evaluateCreditsBilling(null, "sent", t0);
      expect(sentRes.shouldConsumeCredit).toBe(false);
      expect(sentRes.activeWindow).toBeNull();
    });

    it("releases reservation when message delivery fails definitively", () => {
      const res = evaluateCreditsBilling(null, "failed", t0);
      expect(res.shouldConsumeCredit).toBe(false);
      expect(res.shouldReleaseReservation).toBe(true);
      expect(res.activeWindow).toBeNull();
    });

    it("does not double-charge credits for subsequent messages in active 24h window", () => {
      const activeWindow: BillingWindow = {
        windowStartedAt: "2026-10-07T00:00:00.000Z",
        windowExpiresAt: "2026-10-08T00:00:00.000Z",
        creditsConsumed: 1,
        outboundCount: 1,
      };

      const res = evaluateCreditsBilling(activeWindow, "delivered", "2026-10-07T05:00:00.000Z");
      expect(res.shouldConsumeCredit).toBe(false);
      expect(res.activeWindow?.creditsConsumed).toBe(1);
      expect(res.activeWindow?.outboundCount).toBe(2);
      expect(res.stopAutomatedForQuota).toBe(false);
    });

    it("halts automation and switches to human when 20 outbound messages reached", () => {
      const activeWindow: BillingWindow = {
        windowStartedAt: "2026-10-07T00:00:00.000Z",
        windowExpiresAt: "2026-10-08T00:00:00.000Z",
        creditsConsumed: 1,
        outboundCount: 19,
      };

      const res = evaluateCreditsBilling(activeWindow, "delivered", "2026-10-07T12:00:00.000Z");
      expect(res.shouldConsumeCredit).toBe(false);
      expect(res.activeWindow?.outboundCount).toBe(20);
      expect(res.stopAutomatedForQuota).toBe(true);
      expect(res.reason).toBe("quota_limit_reached_switch_to_human");
    });
  });

  describe("Scenario D: RBAC Permissions Matrix (PRD 7.1)", () => {
    it("owner has access to all valid business operations", () => {
      expect(checkTenantPermission("owner", "manage_stores_and_channels")).toBe(true);
      expect(checkTenantPermission("owner", "view_and_handle_conversations")).toBe(true);
      expect(checkTenantPermission("owner", "purchase_and_view_finance")).toBe(true);
      expect(checkTenantPermission("owner", "invite_staff")).toBe(true);
      expect(checkTenantPermission("owner", "grant_finance_role")).toBe(true);
      expect(checkTenantPermission("owner", "delete_tenant")).toBe(true);
    });

    it("admin cannot handle finance or grant finance permissions", () => {
      expect(checkTenantPermission("admin", "manage_stores_and_channels")).toBe(true);
      expect(checkTenantPermission("admin", "view_and_handle_conversations")).toBe(true);
      expect(checkTenantPermission("admin", "invite_staff")).toBe(true);
      expect(checkTenantPermission("admin", "purchase_and_view_finance")).toBe(false);
      expect(checkTenantPermission("admin", "grant_finance_role")).toBe(false);
      expect(checkTenantPermission("admin", "delete_tenant")).toBe(false);
    });

    it("staff can only view and handle conversations", () => {
      expect(checkTenantPermission("staff", "view_and_handle_conversations")).toBe(true);
      expect(checkTenantPermission("staff", "manage_stores_and_channels")).toBe(false);
      expect(checkTenantPermission("staff", "purchase_and_view_finance")).toBe(false);
      expect(checkTenantPermission("staff", "invite_staff")).toBe(false);
    });

    it("finance can only purchase and view finance", () => {
      expect(checkTenantPermission("finance", "purchase_and_view_finance")).toBe(true);
      expect(checkTenantPermission("finance", "manage_stores_and_channels")).toBe(false);
      expect(checkTenantPermission("finance", "view_and_handle_conversations")).toBe(false);
      expect(checkTenantPermission("finance", "delete_tenant")).toBe(false);
    });

    it("strictly rejects unbacked manual recharge across all roles (invariant)", () => {
      expect(checkTenantPermission("owner", "manual_unbacked_recharge")).toBe(false);
      expect(checkTenantPermission("admin", "manual_unbacked_recharge")).toBe(false);
      expect(checkTenantPermission("staff", "manual_unbacked_recharge")).toBe(false);
      expect(checkTenantPermission("finance", "manual_unbacked_recharge")).toBe(false);
    });
  });
});
