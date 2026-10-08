import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

export interface OnboardingStore extends OnboardingDraftData {
  hasHydrated: boolean;
  setHasHydrated: (status: boolean) => void;
  setStep: (step: number) => void;
  updateDraft: (data: Partial<Omit<OnboardingDraftData, "hasHydrated">>) => void;
  resetDraft: () => void;
  markCompleted: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...DEFAULT_ONBOARDING_DRAFT,
      hasHydrated: false,

      setHasHydrated: (status) => set({ hasHydrated: status }),

      setStep: (step) =>
        set((state) => {
          const clamped = Math.max(1, Math.min(6, step));
          return {
            currentStep: clamped,
            hasStarted: clamped > 1 || state.hasStarted,
            lastSavedAt: new Date().toISOString(),
          };
        }),

      updateDraft: (data) =>
        set((state) => ({
          ...state,
          ...data,
          hasStarted: true,
          lastSavedAt: new Date().toISOString(),
        })),

      resetDraft: () =>
        set({
          ...DEFAULT_ONBOARDING_DRAFT,
          hasHydrated: true,
        }),

      markCompleted: () =>
        set({
          isCompleted: true,
          lastSavedAt: new Date().toISOString(),
        }),
    }),
    {
      name: "solaflow_onboarding_draft",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
      partialize: (state) => ({
        currentStep: state.currentStep,
        selectedPlatform: state.selectedPlatform,
        storeUrl: state.storeUrl,
        wabaId: state.wabaId,
        phoneId: state.phoneId,
        enableAbandoned: state.enableAbandoned,
        enableCod: state.enableCod,
        testPhone: state.testPhone,
        testSent: state.testSent,
        isCompleted: state.isCompleted,
        hasStarted: state.hasStarted,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
);
