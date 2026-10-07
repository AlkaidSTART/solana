import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LOCALES,
  MARKETS,
  UI_TRANSLATIONS,
  getMarketMeta,
  getI18nText,
  getMarketByPhone,
  getMarketByCountryCode,
  type SupportedLocale,
  type UiTranslations,
} from "./index";

describe("i18n Southeast Asia & Singapore Specifications", () => {
  it("should support 8 core locales including Singapore and SEA markets", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(8);
    expect(SUPPORTED_LOCALES).toContain("en_SG");
    expect(SUPPORTED_LOCALES).toContain("id_ID");
    expect(SUPPORTED_LOCALES).toContain("ms_MY");
    expect(SUPPORTED_LOCALES).toContain("th_TH");
    expect(SUPPORTED_LOCALES).toContain("vi_VN");
    expect(SUPPORTED_LOCALES).toContain("fil_PH");
    expect(SUPPORTED_LOCALES).toContain("zh_CN");
    expect(SUPPORTED_LOCALES).toContain("en_US");
  });

  it("should configure Singapore market with exact SG specifications", () => {
    const sg = MARKETS.en_SG;
    expect(sg.countryCode).toBe("SG");
    expect(sg.countryNameZh).toBe("新加坡");
    expect(sg.phonePrefix).toBe("+65");
    expect(sg.currency).toBe("SGD");
    expect(sg.currencySymbol).toBe("S$");
    expect(sg.timezone).toBe("Asia/Singapore");
    expect(sg.flag).toBe("🇸🇬");
    expect(sg.slangTokens.some((t) => t.token.includes("lah"))).toBe(true);
    expect(sg.slangTokens.some((t) => t.token.includes("PayNow"))).toBe(true);
  });

  it("should have complete UI translation keys for all supported locales", () => {
    const requiredKeys: (keyof UiTranslations)[] = [
      "nav_overview",
      "nav_stores",
      "nav_workflows",
      "nav_orders",
      "nav_inbox",
      "nav_knowledge",
      "nav_billing",
      "nav_settings",
      "store_label",
      "waba_status",
      "webhook_status",
      "credits_label",
      "official_site",
      "demo_badge",
      "hero_headline",
      "hero_subhead",
      "hero_cta_start",
      "hero_cta_console",
    ];

    for (const locale of SUPPORTED_LOCALES) {
      const dict = UI_TRANSLATIONS[locale];
      expect(dict, `Missing dictionary for locale ${locale}`).toBeDefined();

      for (const key of requiredKeys) {
        expect(dict[key], `Missing key "${key}" in locale "${locale}"`).toBeTypeOf("string");
        expect(dict[key].length).toBeGreaterThan(0);
      }
    }
  });

  it("should correctly resolve market by phone number prefix", () => {
    expect(getMarketByPhone("+65 9123 4567")?.countryCode).toBe("SG");
    expect(getMarketByPhone("+62 813-8821-9901")?.countryCode).toBe("ID");
    expect(getMarketByPhone("+60 12-345 6789")?.countryCode).toBe("MY");
    expect(getMarketByPhone("+66 81-999-8888")?.countryCode).toBe("TH");
    expect(getMarketByPhone("+84 90 123 4567")?.countryCode).toBe("VN");
    expect(getMarketByPhone("+63 917 123 4567")?.countryCode).toBe("PH");
    expect(getMarketByPhone("+1 555-0199")?.countryCode).toBe("US");
    expect(getMarketByPhone("+86 13800138000")?.countryCode).toBe("CN");
    expect(getMarketByPhone("+999 123456")).toBeUndefined();
  });

  it("should correctly resolve market by ISO country code", () => {
    expect(getMarketByCountryCode("SG")?.locale).toBe("en_SG");
    expect(getMarketByCountryCode("id")?.locale).toBe("id_ID");
    expect(getMarketByCountryCode("MY")?.locale).toBe("ms_MY");
    expect(getMarketByCountryCode("th")?.locale).toBe("th_TH");
    expect(getMarketByCountryCode("VN")?.locale).toBe("vi_VN");
    expect(getMarketByCountryCode("ph")?.locale).toBe("fil_PH");
    expect(getMarketByCountryCode("ZZ")).toBeUndefined();
  });

  it("should retrieve translated text with getI18nText and fallback smoothly", () => {
    expect(getI18nText("zh_CN", "nav_overview")).toBe("监控总览");
    expect(getI18nText("en_SG", "nav_knowledge")).toBe("Singlish Knowledge Base");
    expect(getI18nText("ms_MY", "nav_orders")).toBe("Pusat Pesanan");
    expect(getI18nText("th_TH", "nav_billing")).toBe("ศูนย์การเงินและเครดิต");
    expect(getI18nText("vi_VN", "waba_status")).toBe("WABA: Hoạt động");
    expect(getI18nText("fil_PH", "waba_status")).toBe("WABA: Aktibo po");

    // Fallback on unknown locale
    expect(getI18nText("fr_FR" as unknown as SupportedLocale, "nav_overview")).toBe("Dashboard");
  });

  it("should return valid meta via getMarketMeta", () => {
    const meta = getMarketMeta("en_SG");
    expect(meta.countryNameEn).toBe("Singapore");
    expect(meta.phonePrefix).toBe("+65");
    expect(meta.currency).toBe("SGD");

    // Fallback on unknown locale
    const fallback = getMarketMeta("unknown" as unknown as SupportedLocale);
    expect(fallback.countryCode).toBe("US");
  });
});
