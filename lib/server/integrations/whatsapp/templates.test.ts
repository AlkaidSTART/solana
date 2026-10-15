import { describe, expect, it } from "vitest";

import { mapTemplateCategory, mapTemplateStatus, normalizeGraphTemplate } from "./templates";
import { normalizePhoneNumberVerification } from "./verify";

describe("WhatsApp template normalization", () => {
  it("maps every provider category we can send against", () => {
    expect(mapTemplateCategory("MARKETING")).toBe("marketing");
    expect(mapTemplateCategory("utility")).toBe("utility");
    expect(mapTemplateCategory("AUTHENTICATION")).toBe("authentication");
    expect(mapTemplateCategory("SOMETHING_NEW")).toBe("unknown");
    expect(mapTemplateCategory(undefined)).toBe("unknown");
  });

  it("only treats an approved template as sendable", () => {
    expect(mapTemplateStatus("APPROVED")).toBe("approved");
    expect(mapTemplateStatus("PENDING")).toBe("pending");
    expect(mapTemplateStatus("IN_APPEAL")).toBe("pending");
    expect(mapTemplateStatus("PENDING_DELETION")).toBe("pending");
    expect(mapTemplateStatus("REJECTED")).toBe("rejected");
    expect(mapTemplateStatus("DISABLED")).toBe("rejected");
    expect(mapTemplateStatus("DELETED")).toBe("rejected");
    expect(mapTemplateStatus("PAUSED")).toBe("paused");
    expect(mapTemplateStatus("")).toBe("unknown");
  });

  it("keeps provider templates with a usable name and locale", () => {
    const template = normalizeGraphTemplate({
      id: "1259544702043867",
      name: "order_confirmation",
      language: "en_US",
      category: "UTILITY",
      status: "APPROVED",
      components: [{ type: "BODY", text: "Hi {{1}}" }],
    });

    expect(template).toEqual({
      providerTemplateId: "1259544702043867",
      name: "order_confirmation",
      locale: "en_US",
      category: "utility",
      status: "approved",
      componentsDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });

  it("drops entries that cannot be matched to a stored template", () => {
    expect(normalizeGraphTemplate({ language: "en_US", category: "UTILITY" })).toBeNull();
    expect(normalizeGraphTemplate({ name: "no_locale" })).toBeNull();
    expect(normalizeGraphTemplate({ name: "bad_locale", language: "english" })).toBeNull();
    expect(normalizeGraphTemplate(null)).toBeNull();
  });

  it("digests component changes so template edits are detectable", () => {
    const base = { name: "t", language: "id" };
    const first = normalizeGraphTemplate({ ...base, components: [{ type: "BODY", text: "A" }] });
    const second = normalizeGraphTemplate({ ...base, components: [{ type: "BODY", text: "B" }] });

    expect(first?.componentsDigest).not.toBe(second?.componentsDigest);
  });
});

describe("WhatsApp channel verification normalization", () => {
  it("keeps the provider asset evidence used to activate a channel", () => {
    expect(normalizePhoneNumberVerification({
      id: "106540352242922",
      display_phone_number: "15551797781",
      verified_name: "SolaFlow Test",
      quality_rating: "GREEN",
      platform_type: "CLOUD_API",
    })).toEqual({
      providerAssetId: "106540352242922",
      displayPhoneNumber: "15551797781",
      verifiedName: "SolaFlow Test",
      qualityRating: "GREEN",
      platformType: "CLOUD_API",
    });
  });

  it("requires a provider asset id before a credential can be trusted", () => {
    expect(normalizePhoneNumberVerification({ verified_name: "SolaFlow Test" })).toBeNull();
    expect(normalizePhoneNumberVerification({ id: "" })).toBeNull();
    expect(normalizePhoneNumberVerification({ id: "has spaces" })).toBeNull();
    expect(normalizePhoneNumberVerification("106540352242922")).toBeNull();
  });

  it("leaves missing optional fields null instead of inventing values", () => {
    expect(normalizePhoneNumberVerification({ id: "106540352242922", quality_rating: 42 })).toEqual({
      providerAssetId: "106540352242922",
      displayPhoneNumber: null,
      verifiedName: null,
      qualityRating: null,
      platformType: null,
    });
  });
});
