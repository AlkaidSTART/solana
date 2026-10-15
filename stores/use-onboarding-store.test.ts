import { describe, it, expect, beforeEach } from "vitest";
import {
  useOnboardingStore,
  DEFAULT_ONBOARDING_DRAFT,
} from "./use-onboarding-store";

describe("useOnboardingStore - 免费接入向导退出与进度保留", () => {
  beforeEach(() => {
    useOnboardingStore.getState().resetDraft();
  });

  describe("初始状态与边界", () => {
    it("初始状态应为默认配置且未激活、未开始状态", () => {
      const state = useOnboardingStore.getState();
      expect(state.currentStep).toBe(DEFAULT_ONBOARDING_DRAFT.currentStep);
      expect(state.selectedPlatform).toBe("woocommerce");
      expect(state.isCompleted).toBe(false);
      expect(state.hasStarted).toBe(false);
      expect(state.testSent).toBe(false);
    });

    it("设置步骤时严格钳制在 1~6 之间", () => {
      const { setStep } = useOnboardingStore.getState();

      setStep(-1);
      expect(useOnboardingStore.getState().currentStep).toBe(1);

      setStep(4);
      expect(useOnboardingStore.getState().currentStep).toBe(4);
      expect(useOnboardingStore.getState().hasStarted).toBe(true);
      expect(useOnboardingStore.getState().lastSavedAt).toBeTruthy();

      setStep(99);
      expect(useOnboardingStore.getState().currentStep).toBe(6);
    });
  });

  describe("任意阶段退出与表单数据保留", () => {
    it("场景 1: 在步骤 2 (电商授权) 退出并保留输入店铺信息", () => {
      const { setStep, updateDraft } = useOnboardingStore.getState();

      setStep(2);
      updateDraft({
        selectedPlatform: "shopify",
        storeUrl: "https://sea-merchant-fashion.myshopify.com",
      });

      // 模拟用户在此时离开页面
      const savedState = useOnboardingStore.getState();
      expect(savedState.currentStep).toBe(2);
      expect(savedState.selectedPlatform).toBe("shopify");
      expect(savedState.storeUrl).toBe("https://sea-merchant-fashion.myshopify.com");
      expect(savedState.hasStarted).toBe(true);
      expect(savedState.lastSavedAt).toBeTruthy();
    });

    it("场景 2: 在步骤 3 (WhatsApp 绑定) 退出并保留 WABA 凭据", () => {
      const { setStep, updateDraft } = useOnboardingStore.getState();

      setStep(3);
      updateDraft({
        wabaId: "waba_custom_99210",
        phoneId: "phone_custom_88102",
      });

      // 模拟退出后再次获取
      const savedState = useOnboardingStore.getState();
      expect(savedState.currentStep).toBe(3);
      expect(savedState.wabaId).toBe("waba_custom_99210");
      expect(savedState.phoneId).toBe("phone_custom_88102");
    });

    it("场景 3: 在步骤 4 (规则模板) 退出并保留自动化开关配置", () => {
      const { setStep, updateDraft } = useOnboardingStore.getState();

      setStep(4);
      updateDraft({
        enableAbandoned: false,
        enableCod: true,
      });

      const savedState = useOnboardingStore.getState();
      expect(savedState.currentStep).toBe(4);
      expect(savedState.enableAbandoned).toBe(false);
      expect(savedState.enableCod).toBe(true);
    });

    it("场景 4: 在步骤 5 (仿真演练) 退出并保留仿真演练发送状态", () => {
      const { setStep, updateDraft } = useOnboardingStore.getState();

      setStep(5);
      updateDraft({
        testPhone: "+62 813-9999-8888",
        testSent: true,
      });

      const savedState = useOnboardingStore.getState();
      expect(savedState.currentStep).toBe(5);
      expect(savedState.testPhone).toBe("+62 813-9999-8888");
      expect(savedState.testSent).toBe(true);
    });

    it("场景 5: 在步骤 6 (激活界面) 暂存退出，尚未完成激活", () => {
      const { setStep } = useOnboardingStore.getState();

      setStep(6);

      const savedState = useOnboardingStore.getState();
      expect(savedState.currentStep).toBe(6);
      expect(savedState.isCompleted).toBe(false);
    });
  });

  describe("重置草稿与激活完成闭环", () => {
    it("支持用户主动确认重置草稿并回到初始状态", () => {
      const { setStep, updateDraft, resetDraft } = useOnboardingStore.getState();

      setStep(4);
      updateDraft({
        selectedPlatform: "shopify",
        storeUrl: "https://temp-store.com",
        testSent: true,
      });

      expect(useOnboardingStore.getState().hasStarted).toBe(true);

      // 用户点击“从头开始 / 清空重填”
      resetDraft();

      const state = useOnboardingStore.getState();
      expect(state.currentStep).toBe(DEFAULT_ONBOARDING_DRAFT.currentStep);
      expect(state.selectedPlatform).toBe(DEFAULT_ONBOARDING_DRAFT.selectedPlatform);
      expect(state.storeUrl).toBe(DEFAULT_ONBOARDING_DRAFT.storeUrl);
      expect(state.hasStarted).toBe(false);
      expect(state.testSent).toBe(false);
      expect(state.isCompleted).toBe(false);
    });

    it("步骤 6 激活完成后成功标记 isCompleted 为 true", () => {
      const { setStep, markCompleted } = useOnboardingStore.getState();

      setStep(6);
      markCompleted();

      const state = useOnboardingStore.getState();
      expect(state.isCompleted).toBe(true);
      expect(state.lastSavedAt).toBeTruthy();
    });
  });
});
