import { describe, it, expect } from "vitest";
import {
  MOCK_SLANG_LEXICON,
  MOCK_AI_TRANSLATION_SAMPLE,
  generateMockAiTranslation,
  MOCK_CONTROL_GROUP_METRICS,
  MOCK_LANDING_FEED_ORDERS,
  MOCK_TELEMETRY_SCENARIOS,
  MOCK_SEA_NODES,
  MOCK_SEA_ROUTES,
  DEFAULT_ONBOARDING_DRAFT,
  MOCK_DEMO_LOGIN_CREDENTIALS,
  MOCK_STORE_RUNTIMES,
  MOCK_WABA_ACCOUNT_INFO,
  MOCK_STORE_FORM_PRESETS,
  MOCK_ROUTING_MATRIX,
  MOCK_QUICK_REPLIES,
  MOCK_DEMO_BUYER_ORDER,
  MOCK_OVERVIEW_SUMMARY_STATS,
} from "@/mock";

describe("Frontend Mock Datasets Decoupling", () => {
  it("provides slang lexicon with 5 items", () => {
    expect(MOCK_SLANG_LEXICON.length).toBe(5);
    const minToken = MOCK_SLANG_LEXICON.find((s) => s.token === "min");
    expect(minToken).toBeDefined();
    expect(minToken?.desc).toContain("Admin");
  });

  it("provides AI translation sample and generator function", () => {
    expect(MOCK_AI_TRANSLATION_SAMPLE.idText).toContain("Jabodetabek");
    expect(MOCK_AI_TRANSLATION_SAMPLE.thText).toBeDefined();

    const generated = generateMockAiTranslation("短裙");
    expect(generated.idText).toContain("短裙");
    expect(generated.enText).toContain("短裙");
    expect(generated.thText).toContain("短裙");
    expect(generated.enSgText).toContain("短裙");
  });

  it("provides control group attribution metrics", () => {
    expect(MOCK_CONTROL_GROUP_METRICS.whatsappActive.conversionRate).toBe("17.8% Conversion");
    expect(MOCK_CONTROL_GROUP_METRICS.silentControl.conversionRate).toBe("12.1% Organic");
    expect(MOCK_CONTROL_GROUP_METRICS.landmarkVerifiedCod.deliveryRate).toContain("90.6%");
    expect(MOCK_CONTROL_GROUP_METRICS.unverifiedBaselineCod.deliveryRate).toContain("83.8%");
  });

  it("provides landing feed orders with dialogue and risk scoring", () => {
    expect(MOCK_LANDING_FEED_ORDERS.length).toBe(4);
    const ord1 = MOCK_LANDING_FEED_ORDERS[0];
    expect(ord1.orderNumber).toBe("ORD-ID-9821");
    expect(ord1.botDialogue.actionBadge).toBeDefined();
  });

  it("provides interactive telemetry scenarios with actions and blockchain gas stats", () => {
    expect(MOCK_TELEMETRY_SCENARIOS.length).toBe(7);
    const codScenario = MOCK_TELEMETRY_SCENARIOS.find((s) => s.id === "cod_confirm");
    expect(codScenario).toBeDefined();
    expect(codScenario?.actions.length).toBeGreaterThan(0);
    expect(codScenario?.solanaStatus).toContain("Finalized");
  });

  it("provides SEA nodes and route pairs for 3D globe visualization", () => {
    expect(MOCK_SEA_NODES.length).toBe(6);
    expect(MOCK_SEA_ROUTES.length).toBe(6);
    const sinNode = MOCK_SEA_NODES.find((n) => n.id === "sin");
    expect(sinNode?.name).toContain("新加坡");
  });

  it("provides default onboarding draft with standard mock properties", () => {
    expect(DEFAULT_ONBOARDING_DRAFT.currentStep).toBe(2);
    expect(DEFAULT_ONBOARDING_DRAFT.selectedPlatform).toBe("woocommerce");
    expect(DEFAULT_ONBOARDING_DRAFT.storeUrl).toContain("tokosepatu.co.id");
    expect(DEFAULT_ONBOARDING_DRAFT.testPhone).toContain("+62");
  });

  it("provides demo merchant login credentials", () => {
    expect(MOCK_DEMO_LOGIN_CREDENTIALS.email).toBe("merchant@crossborder-shop.com");
    expect(MOCK_DEMO_LOGIN_CREDENTIALS.code.length).toBe(6);
  });

  it("provides store runtimes, WABA account details and presets", () => {
    expect(MOCK_STORE_RUNTIMES.length).toBe(2);
    expect(MOCK_STORE_RUNTIMES[0].shortCode).toBe("WC");
    expect(MOCK_WABA_ACCOUNT_INFO.quality).toBe("HIGH");
    expect(MOCK_WABA_ACCOUNT_INFO.tokenDaysLeft).toBeGreaterThan(0);
    expect(MOCK_STORE_FORM_PRESETS.defaultBindPlatform).toBe("WooCommerce");
  });

  it("provides SEA 6-country routing matrix", () => {
    expect(MOCK_ROUTING_MATRIX.length).toBe(6);
    const sg = MOCK_ROUTING_MATRIX.find((m) => m.countryCode === "SG");
    expect(sg?.phonePrefix).toBe("+65");
    expect(sg?.languageCode).toBe("en_SG");
    const id = MOCK_ROUTING_MATRIX.find((m) => m.countryCode === "ID");
    expect(id?.phonePrefix).toBe("+62");
  });

  it("provides quick replies and demo buyer order details", () => {
    expect(MOCK_QUICK_REPLIES.length).toBe(3);
    expect(MOCK_QUICK_REPLIES[0]).toContain("Siap kak");
    expect(MOCK_DEMO_BUYER_ORDER.displayLabel).toContain("COD Rp 389.000");
  });

  it("provides overview summary stats", () => {
    expect(MOCK_OVERVIEW_SUMMARY_STATS.pendingOrdersDefaultCount).toBe("18");
    expect(MOCK_OVERVIEW_SUMMARY_STATS.landmarkVerifiedRate).toBe("90.6%");
    expect(MOCK_OVERVIEW_SUMMARY_STATS.abandonedNetLiftLabel).toContain("Net Lift");
  });
});
