export interface OnboardingDraftData {
  currentStep: number;
  selectedPlatform: "woocommerce" | "shopify";
  storeUrl: string;
  wabaId: string;
  phoneId: string;
  enableAbandoned: boolean;
  enableCod: boolean;
  testPhone: string;
  testSent: boolean;
  isCompleted: boolean;
  hasStarted: boolean;
  lastSavedAt: string | null;
}

export const DEFAULT_ONBOARDING_DRAFT: OnboardingDraftData = {
  currentStep: 2,
  selectedPlatform: "woocommerce",
  storeUrl: "https://tokosepatu.co.id",
  wabaId: "902819280192",
  phoneId: "102938192039",
  enableAbandoned: true,
  enableCod: true,
  testPhone: "+62 812-9812-4412",
  testSent: false,
  isCompleted: false,
  hasStarted: false,
  lastSavedAt: null,
};
