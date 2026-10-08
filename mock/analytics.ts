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
