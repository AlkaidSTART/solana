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

      // Common actions
      "action_save",
      "action_cancel",
      "action_confirm",
      "action_refresh",
      "action_reset_view",
      "action_search",
      "action_filter",
      "action_export",
      "action_close",
      "status_all",
      "status_active",
      "status_paused",
      "status_pending",
      "status_normal",
      "status_warning",

      // Overview
      "overview_title",
      "overview_stat_credits",
      "overview_stat_recovered",
      "overview_stat_cod_rate",
      "overview_stat_human_queue",
      "overview_empty_title",
      "overview_empty_desc",
      "overview_bind_store",
      "overview_error_title",
      "overview_error_desc",
      "overview_retry_conn",
      "overview_recent_activity",

      // Orders
      "orders_title",
      "orders_search_placeholder",
      "orders_tab_all",
      "orders_tab_pending",
      "orders_tab_recovered",
      "orders_tab_cod_verified",
      "orders_tab_rejected",
      "orders_col_number",
      "orders_col_customer",
      "orders_col_amount",
      "orders_col_type",
      "orders_col_status",
      "orders_col_time",
      "orders_col_action",
      "orders_status_recovered",
      "orders_status_cod_verified",
      "orders_status_pending",
      "orders_status_rejected",
      "orders_status_cancelled",
      "orders_type_cod",
      "orders_type_prepaid",
      "orders_drawer_title",
      "orders_drawer_landmark",
      "orders_drawer_resend",
      "orders_drawer_resending",
      "orders_drawer_resend_ok",
      "orders_drawer_approve",
      "orders_drawer_reject",
      "orders_drawer_mark_paid",

      // Workflows
      "workflows_title",
      "workflows_subhead",
      "workflows_quiet_hours",
      "workflows_quiet_desc",
      "workflows_rule_cart_recovery",
      "workflows_rule_cod_verify",
      "workflows_matrix_title",

      // Settings
      "settings_title",
      "settings_subhead",
      "settings_save_btn",
      "settings_saved_success",
      "settings_control_group_title",
      "settings_control_group_desc",
      "settings_control_enabled",
      "settings_control_disabled",
      "settings_window_label",
      "settings_timezone_label",
      "settings_currency_label",

      // Stores
      "stores_title",
      "stores_subhead",
      "stores_btn_connect",
      "stores_connected",
      "stores_waba_templates",

      // Inbox
      "inbox_title",
      "inbox_subhead",
      "inbox_queue_human",
      "inbox_queue_ai",
      "inbox_btn_takeover",
      "inbox_btn_release",
      "inbox_input_placeholder",

      // Billing
      "billing_title",
      "billing_subhead",
      "billing_topup_btn",
      "billing_history",

      // Overview additions
      "overview_tab_loading",
      "overview_tab_empty",
      "overview_btn_diag",
      "overview_stat_pre_dispatch",
      "overview_stat_today",
      "overview_stat_critical_sla",
      "overview_stat_meta_window",
      "overview_stat_reserved",
      "overview_stat_messages_est",
      "overview_stat_lift",
      "overview_confidence_verified",
      "overview_rolling_window",
      "overview_group_active",
      "overview_group_control",
      "overview_organic_conv",
      "overview_organic_orders",
      "overview_loss_avoidance",
      "overview_landmark_verified",
      "overview_delivered_rate",
      "overview_fake_address",
      "overview_unverified",
      "overview_unverified_rate",
      "overview_unverified_diff",

      // Workflows additions
      "wf_btn_create",
      "wf_trigger_delay",
      "wf_languages",
      "wf_max_freq",
      "wf_matrix_col_country",
      "wf_matrix_col_lang",
      "wf_matrix_col_timezone",
      "wf_matrix_col_slang",
      "wf_drawer_title",
      "wf_drawer_code",
      "wf_rule_history",
      "wf_active_config",
      "wf_stable_snapshot",
      "wf_rollback_btn",
      "wf_rollback_success",
      "wf_modal_create_title",
      "wf_modal_create_sub",
      "wf_field_name",
      "wf_field_code",
      "wf_field_delay",
      "wf_field_desc",
      "wf_create_success",
      "wf_btn_save_apply",

      // Settings additions
      "settings_mod_attribution",
      "settings_mod_localization",
      "settings_mod_rbac",
      "settings_mod_compliance",
      "settings_opt_window_7",
      "settings_opt_window_14",
      "settings_opt_window_30",
      "settings_opt_conf_90",
      "settings_opt_conf_95",
      "settings_opt_conf_99",
      "settings_rbac_col_role",
      "settings_rbac_col_orders",
      "settings_rbac_col_workflows",
      "settings_rbac_col_finance",
      "settings_rbac_role_admin",
      "settings_rbac_role_operator",
      "settings_rbac_role_agent",
      "settings_rbac_perm_full",
      "settings_rbac_perm_audit",
      "settings_rbac_perm_edit",
      "settings_rbac_perm_readonly",
      "settings_rbac_perm_none",
      "settings_export_title",
      "settings_export_desc",
      "settings_export_btn",
      "settings_forget_title",
      "settings_forget_desc",
      "settings_forget_btn",

      // Stores additions
      "stores_mod_ecommerce",
      "stores_mod_waba",
      "stores_mod_templates",
      "stores_connected_badge",
      "stores_col_webhook_sec",
      "stores_col_monthly_orders",
      "stores_col_currency",
      "stores_col_timezone",
      "stores_last_heartbeat",
      "stores_btn_manage_webhook",
      "stores_waba_verified",
      "stores_waba_quality",
      "stores_waba_tier",
      "stores_waba_ping_btn",
      "stores_waba_ping_running",
      "stores_template_approved",
      "stores_template_preview_btn",
      "stores_drawer_ping_title",
      "stores_drawer_ping_sub",
      "stores_drawer_ping_phone",
      "stores_drawer_ping_template",
      "stores_drawer_ping_notice",
      "stores_modal_bind_title",
      "stores_modal_bind_sub",
      "stores_modal_bind_platform",
      "stores_modal_bind_name",
      "stores_modal_bind_url",
      "stores_modal_bind_success",
      "stores_modal_bind_submit",

      // Inbox additions
      "inbox_badge_online",
      "inbox_badge_human",
      "inbox_badge_ai",
      "inbox_chat_window",
      "inbox_agent_label",
      "inbox_translation_label",
      "inbox_translate_hint",
      "inbox_translate_toggle_on",
      "inbox_translate_toggle_off",
      "inbox_profile_title",
      "inbox_profile_name",
      "inbox_profile_phone",
      "inbox_profile_order",
      "inbox_profile_no_order",
      "inbox_slang_title",
      "inbox_quick_replies",

      // Knowledge Base additions
      "kb_title",
      "kb_subhead",
      "kb_btn_add",
      "kb_search_placeholder",
      "kb_tab_all",
      "kb_tab_published",
      "kb_tab_draft",
      "kb_col_zh",
      "kb_col_id",
      "kb_col_en",
      "kb_col_th",
      "kb_col_sg",
      "kb_col_ms",
      "kb_col_vi",
      "kb_col_ph",
      "kb_drawer_title",
      "kb_drawer_new_title",
      "kb_btn_ai_translate",
      "kb_conflict_title",
      "kb_conflict_desc",

      // Layout meta
      "meta_tenant",
      "meta_timezone",
      "meta_network",
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

    // Test new console keys
    expect(getI18nText("en_US", "orders_tab_all")).toBe("All Orders");
    expect(getI18nText("id_ID", "action_save")).toBe("Simpan");
    expect(getI18nText("en_SG", "overview_title")).toBe("Dashboard Overview (SG)");
    expect(getI18nText("th_TH", "settings_save_btn")).toBe("บันทึกการตั้งค่าส่วนกลาง");
    expect(getI18nText("vi_VN", "orders_drawer_approve")).toBe("Duyệt Giao Hàng");
    expect(getI18nText("fil_PH", "inbox_btn_takeover")).toBe("Kunin ang Pag-uusap");

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
