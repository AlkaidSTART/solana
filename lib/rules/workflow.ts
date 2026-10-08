/**
 * SolaFlow AI Core Business Rules Engine
 * Implements PRD v1.1 specifications for:
 * 1. 15-minute abandoned recovery eligibility (PRD 5.1 & 4.3)
 * 2. COD order pre-fulfillment intent state machine (PRD 5.2)
 * 3. 24-hour Credits billing window and message quota (PRD 6.1)
 * 4. RBAC tenant permissions matrix (PRD 7.1)
 */

export interface OrderReminderInput {
  order: {
    paymentMethod: string;
    status: "pending" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded";
    createdAt: string;
    buyerPhone: string | null;
    marketingConsent: boolean;
  };
  context: {
    now: string;
    timezone: string;
    hasApprovedTemplate: boolean;
    isUnsubscribed: boolean;
    sentCountInLast24h: number;
    isHumanActive: boolean;
  };
}

export type ReminderDecision =
  | { eligible: true; reason: "eligible" }
  | {
      eligible: false;
      reason:
        | "ineligible_cod_order"
        | "ineligible_order_status"
        | "missing_contact"
        | "missing_marketing_consent"
        | "missing_approved_template"
        | "suppressed_unsubscribed"
        | "suppressed_human_takeover"
        | "too_early"
        | "event_late_terminated"
        | "suppressed_quiet_hours"
        | "suppressed_rate_limit";
    };

/**
 * Checks whether an order is eligible for abandoned reminder (PRD 5.1 & 4.3)
 */
export function checkReminderEligibility(input: OrderReminderInput): ReminderDecision {
  const { order, context } = input;

  // 1. Non-COD check
  if (order.paymentMethod.toLowerCase() === "cod") {
    return { eligible: false, reason: "ineligible_cod_order" };
  }

  // 2. Order status check (must be pending payment)
  if (order.status !== "pending") {
    return { eligible: false, reason: "ineligible_order_status" };
  }

  // 3. Buyer contact information
  if (!order.buyerPhone || order.buyerPhone.trim().length === 0) {
    return { eligible: false, reason: "missing_contact" };
  }

  // 4. Marketing consent check
  if (!order.marketingConsent) {
    return { eligible: false, reason: "missing_marketing_consent" };
  }

  // 5. Approved template check
  if (!context.hasApprovedTemplate) {
    return { eligible: false, reason: "missing_approved_template" };
  }

  // 6. Global unsubscribe safety stop
  if (context.isUnsubscribed) {
    return { eligible: false, reason: "suppressed_unsubscribed" };
  }

  // 7. Human takeover safety stop
  if (context.isHumanActive) {
    return { eligible: false, reason: "suppressed_human_takeover" };
  }

  // 8. Order creation age check (15 minutes min, 2 hours late-event cutoff)
  const nowMs = Date.parse(context.now);
  const createdMs = Date.parse(order.createdAt);
  const ageSeconds = (nowMs - createdMs) / 1000;

  if (ageSeconds < 15 * 60) {
    return { eligible: false, reason: "too_early" };
  }
  if (ageSeconds > 2 * 3600) {
    return { eligible: false, reason: "event_late_terminated" };
  }

  // 9. Quiet hours check (21:00 to 09:00 in store/buyer timezone)
  const localHour = getLocalHour(context.now, context.timezone);
  if (localHour >= 21 || localHour < 9) {
    return { eligible: false, reason: "suppressed_quiet_hours" };
  }

  // 10. Rolling 24-hour rate limit (max 2 outbound marketing messages)
  if (context.sentCountInLast24h >= 2) {
    return { eligible: false, reason: "suppressed_rate_limit" };
  }

  return { eligible: true, reason: "eligible" };
}

/**
 * Extracts hour in given IANA timezone (0-23)
 */
export function getLocalHour(isoDate: string, timezone: string): number {
  const date = new Date(isoDate);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  });
  const parts = formatter.format(date);
  return parseInt(parts, 10) % 24;
}

export type CodStatus =
  | "waiting_delay"
  | "awaiting_confirmation"
  | "confirmed"
  | "address_change_requested"
  | "cancellation_requested"
  | "no_response"
  | "closed";

export interface CodEventInput {
  orderCreatedAt: string;
  deadlineAt: string;
  isFulfilled: boolean;
  action:
    | "check_eligibility"
    | "buyer_confirm"
    | "buyer_request_address_change"
    | "buyer_request_cancellation"
    | "timeout_12h"
    | "seller_fulfill";
  now: string;
}

export interface CodTransitionResult {
  status: CodStatus;
  requiresHumanReview: boolean;
  reason?: string;
}

/**
 * COD pre-fulfillment state machine (PRD 5.2)
 */
export function evaluateCodTransition(input: CodEventInput): CodTransitionResult {
  // If already fulfilled on e-commerce platform, close automated flow
  if (input.isFulfilled || input.action === "seller_fulfill") {
    return { status: "closed", requiresHumanReview: false, reason: "already_fulfilled" };
  }

  // Deadline check: do not block indefinitely
  const nowMs = Date.parse(input.now);
  const deadlineMs = Date.parse(input.deadlineAt);
  if (nowMs >= deadlineMs) {
    return { status: "closed", requiresHumanReview: true, reason: "passed_deadline" };
  }

  switch (input.action) {
    case "check_eligibility": {
      const createdMs = Date.parse(input.orderCreatedAt);
      const ageSeconds = (nowMs - createdMs) / 1000;
      if (ageSeconds < 5 * 60) {
        return { status: "waiting_delay", requiresHumanReview: false, reason: "under_5_minutes" };
      }
      return { status: "awaiting_confirmation", requiresHumanReview: false, reason: "ready_to_send" };
    }
    case "buyer_confirm":
      return { status: "confirmed", requiresHumanReview: false };
    case "buyer_request_address_change":
      return { status: "address_change_requested", requiresHumanReview: true };
    case "buyer_request_cancellation":
      return { status: "cancellation_requested", requiresHumanReview: true };
    case "timeout_12h":
      return { status: "no_response", requiresHumanReview: true };
  }
}

export interface BillingWindow {
  windowStartedAt: string;
  windowExpiresAt: string;
  creditsConsumed: number;
  outboundCount: number;
}

export type MessageDeliveryStatus = "queued" | "sent" | "delivered" | "read" | "failed";

export interface CreditEvaluationResult {
  shouldConsumeCredit: boolean;
  shouldReleaseReservation: boolean;
  stopAutomatedForQuota: boolean;
  activeWindow: BillingWindow | null;
  reason: string;
}

/**
 * 24-hour Credits billing window evaluation (PRD 6.1)
 * 1 Credit = 1 merchant + 1 store + 1 buyer in a 24-hour window, max 20 outbound messages.
 */
export function evaluateCreditsBilling(
  currentWindow: BillingWindow | null,
  deliveryStatus: MessageDeliveryStatus,
  now: string
): CreditEvaluationResult {
  const nowMs = Date.parse(now);

  // 1. Check if existing window is still active
  const isWindowActive =
    currentWindow !== null &&
    nowMs >= Date.parse(currentWindow.windowStartedAt) &&
    nowMs < Date.parse(currentWindow.windowExpiresAt);

  if (isWindowActive && currentWindow) {
    // Within active window
    const newOutboundCount = currentWindow.outboundCount + 1;
    const reachedLimit = newOutboundCount >= 20;

    return {
      shouldConsumeCredit: false, // Already consumed for this 24h window
      shouldReleaseReservation: false,
      stopAutomatedForQuota: reachedLimit,
      activeWindow: {
        ...currentWindow,
        outboundCount: newOutboundCount,
      },
      reason: reachedLimit ? "quota_limit_reached_switch_to_human" : "within_active_window",
    };
  }

  // 2. Outside active window (or brand new conversation)
  if (deliveryStatus === "delivered" || deliveryStatus === "read") {
    // Delivered proves outbound reach: consume 1 Credit and open 24h window
    const windowStartedAt = new Date(nowMs).toISOString();
    const windowExpiresAt = new Date(nowMs + 24 * 3600 * 1000).toISOString();

    return {
      shouldConsumeCredit: true,
      shouldReleaseReservation: false,
      stopAutomatedForQuota: false,
      activeWindow: {
        windowStartedAt,
        windowExpiresAt,
        creditsConsumed: 1,
        outboundCount: 1,
      },
      reason: "first_delivered_consumes_1_credit",
    };
  }

  if (deliveryStatus === "failed") {
    // Confirmed failure: release reserved credit
    return {
      shouldConsumeCredit: false,
      shouldReleaseReservation: true,
      stopAutomatedForQuota: false,
      activeWindow: null,
      reason: "failed_delivery_releases_reservation",
    };
  }

  // Status is queued or sent: credit remains reserved, not yet consumed
  return {
    shouldConsumeCredit: false,
    shouldReleaseReservation: false,
    stopAutomatedForQuota: false,
    activeWindow: null,
    reason: "awaiting_delivery_confirmation",
  };
}

export type TenantRole = "owner" | "admin" | "staff" | "finance";

export type TenantAction =
  | "manage_stores_and_channels"
  | "view_and_handle_conversations"
  | "purchase_and_view_finance"
  | "invite_staff"
  | "grant_finance_role"
  | "delete_tenant"
  | "manual_unbacked_recharge";

/**
 * RBAC permission guard (PRD 7.1)
 */
export function checkTenantPermission(role: TenantRole, action: TenantAction): boolean {
  // Invariant: Unbacked manual recharge is strictly prohibited across all roles
  if (action === "manual_unbacked_recharge") {
    return false;
  }

  switch (role) {
    case "owner":
      return true;
    case "admin":
      return (
        action === "manage_stores_and_channels" ||
        action === "view_and_handle_conversations" ||
        action === "invite_staff"
      );
    case "staff":
      return action === "view_and_handle_conversations";
    case "finance":
      return action === "purchase_and_view_finance";
    default:
      return false;
  }
}
