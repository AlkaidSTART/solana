import { apiFetch } from "./client";
import type { ListData } from "@/types/api/common";

export interface BillingSummaryRecord {
  tenantId: string;
  availableCredits: number;
  reservedCredits: number;
  trialCredits: number;
  totalPurchasedCredits?: number;
  subscriptionPlan?: string;
  nextRenewalDate?: string;
}

export interface CreditLedgerRecord {
  id: string;
  tenantId: string;
  entryType: "topup" | "consumption" | "trial_grant" | "refund";
  creditsDelta: number;
  balanceAfter: number;
  description?: string;
  solanaTxSignature?: string;
  referenceId?: string;
  createdAt: string;
}

export interface PlanRecord {
  id: string;
  name: string;
  priceUsdc: number;
  creditsIncluded: number;
  description: string;
}

export const billingApi = {
  async getSummary(): Promise<BillingSummaryRecord> {
    return apiFetch<BillingSummaryRecord>("billing/summary");
  },

  async getCreditLedger(params?: {
    type?: string;
    from?: string;
    to?: string;
    cursor?: string;
  }): Promise<ListData<CreditLedgerRecord>> {
    const query = new URLSearchParams();
    if (params?.type) query.set("type", params.type);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.cursor) query.set("cursor", params.cursor);
    const qs = query.toString();
    return apiFetch<ListData<CreditLedgerRecord>>(`billing/credit-ledger${qs ? `?${qs}` : ""}`);
  },

  async getPlans(): Promise<ListData<PlanRecord>> {
    return apiFetch<ListData<PlanRecord>>("billing/plans");
  },
};
