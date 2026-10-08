export interface ControlGroupMetric {
  whatsappActive: {
    label: string;
    conversionRate: string;
    percentWidth: string;
    recoveredCount: number;
    gmv: string;
  };
  silentControl: {
    label: string;
    conversionRate: string;
    percentWidth: string;
    organicCount: number;
    gmv: string;
  };
  landmarkVerifiedCod: {
    label: string;
    deliveryRate: string;
    percentWidth: string;
    interceptedFakeAddresses: number;
  };
  unverifiedBaselineCod: {
    label: string;
    deliveryRate: string;
    percentWidth: string;
    excessNote: string;
  };
}

export const MOCK_CONTROL_GROUP_METRICS: ControlGroupMetric = {
  whatsappActive: {
    label: "WhatsApp Active (80%, 1,240 orders)",
    conversionRate: "17.8% Conversion",
    percentWidth: "17.8%",
    recoveredCount: 221,
    gmv: "$ 6,851.00",
  },
  silentControl: {
    label: "Silent Control (20%, 310 orders)",
    conversionRate: "12.1% Organic",
    percentWidth: "12.1%",
    organicCount: 38,
    gmv: "$ 1,178.00",
  },
  landmarkVerifiedCod: {
    label: "Landmark Verified (COD)",
    deliveryRate: "90.6% Delivered (9.4% RTS)",
    percentWidth: "90.6%",
    interceptedFakeAddresses: 38,
  },
  unverifiedBaselineCod: {
    label: "Unverified Baseline",
    deliveryRate: "83.8% Delivered (16.2% RTS)",
    percentWidth: "83.8%",
    excessNote: "RTS Rate exceeds baseline by +6.8%",
  },
};

export interface OverviewSummaryStats {
  pendingOrdersDefaultCount: string;
  recoveredGmvDefaultAmount: string;
  landmarkVerifiedRate: string;
  abandonedNetLiftLabel: string;
}

export const MOCK_OVERVIEW_SUMMARY_STATS: OverviewSummaryStats = {
  pendingOrdersDefaultCount: "18",
  recoveredGmvDefaultAmount: "$ 1,420.00",
  landmarkVerifiedRate: "90.6%",
  abandonedNetLiftLabel: "Net Lift: +5.7% (Abs) / +47.1% (Rel)",
};

