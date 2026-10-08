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
});
