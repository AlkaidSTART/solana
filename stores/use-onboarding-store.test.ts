import { describe, it, expect, beforeEach } from "vitest";
import {
  useOnboardingStore,
  DEFAULT_ONBOARDING_DRAFT,
} from "./use-onboarding-store";

describe("useOnboardingStore", () => {
  beforeEach(() => {
    useOnboardingStore.getState().resetDraft();
  });

  it("should initialize with default onboarding values", () => {
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(DEFAULT_ONBOARDING_DRAFT.currentStep);
    expect(state.selectedPlatform).toBe("woocommerce");
    expect(state.isCompleted).toBe(false);
  });

  it("should clamp steps between 1 and 6", () => {
    const { setStep } = useOnboardingStore.getState();

    setStep(0);
    expect(useOnboardingStore.getState().currentStep).toBe(1);

    setStep(4);
    expect(useOnboardingStore.getState().currentStep).toBe(4);
    expect(useOnboardingStore.getState().hasStarted).toBe(true);
    expect(useOnboardingStore.getState().lastSavedAt).toBeTruthy();

    setStep(10);
    expect(useOnboardingStore.getState().currentStep).toBe(6);
  });

  it("should update draft fields and record lastSavedAt", () => {
    const { updateDraft } = useOnboardingStore.getState();

    updateDraft({
      selectedPlatform: "shopify",
      storeUrl: "https://my-store.myshopify.com",
      wabaId: "99887766",
      phoneId: "11223344",
      enableAbandoned: false,
      enableCod: true,
      testPhone: "+62 811-0000-1111",
      testSent: true,
    });

    const state = useOnboardingStore.getState();
    expect(state.selectedPlatform).toBe("shopify");
    expect(state.storeUrl).toBe("https://my-store.myshopify.com");
    expect(state.wabaId).toBe("99887766");
    expect(state.phoneId).toBe("11223344");
    expect(state.enableAbandoned).toBe(false);
    expect(state.enableCod).toBe(true);
    expect(state.testPhone).toBe("+62 811-0000-1111");
    expect(state.testSent).toBe(true);
    expect(state.hasStarted).toBe(true);
    expect(state.lastSavedAt).toBeTruthy();
  });

  it("should reset draft back to default state", () => {
    const { setStep, updateDraft, resetDraft } = useOnboardingStore.getState();

    setStep(5);
    updateDraft({
      storeUrl: "https://custom-shop.com",
      testSent: true,
    });

    expect(useOnboardingStore.getState().currentStep).toBe(5);

    resetDraft();

    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(DEFAULT_ONBOARDING_DRAFT.currentStep);
    expect(state.storeUrl).toBe(DEFAULT_ONBOARDING_DRAFT.storeUrl);
    expect(state.testSent).toBe(false);
    expect(state.hasStarted).toBe(false);
  });

  it("should mark onboarding as completed", () => {
    const { markCompleted } = useOnboardingStore.getState();

    markCompleted();

    const state = useOnboardingStore.getState();
    expect(state.isCompleted).toBe(true);
    expect(state.lastSavedAt).toBeTruthy();
  });
});
