import type { StoreInfo, OrderLanguage } from "@/stores/use-app-store";

export interface TemplateItem {
  id: string;
  name: string;
  category: "MARKETING" | "UTILITY";
  language: OrderLanguage;
  status: "APPROVED" | "PENDING";
  content: string;
}

export const MOCK_CURRENT_STORE_ID = "store_id_tokosepatu";

export const MOCK_STORES: StoreInfo[] = [
  {
    id: "store_id_tokosepatu",
    name: "TokoSepatu_ID (WooCommerce)",
    platform: "WooCommerce",
    currency: "IDR",
    timezone: "Asia/Jakarta (WIB, UTC+7)",
    status: "connected",
  },
  {
    id: "store_th_bkkfashion",
    name: "BKK_Fashion_TH (Shopify)",
    platform: "Shopify",
    currency: "THB",
    timezone: "Asia/Bangkok (ICT, UTC+7)",
    status: "connected",
  },
  {
    id: "store_sg_sneakers",
    name: "SG_Sneakers_Hub (Shopify)",
    platform: "Shopify",
    currency: "SGD",
    timezone: "Asia/Singapore (SGT, UTC+8)",
    status: "connected",
  },
  {
    id: "store_my_boutique",
    name: "MY_Boutique_KL (WooCommerce)",
    platform: "WooCommerce",
    currency: "MYR",
    timezone: "Asia/Kuala_Lumpur (MYT, UTC+8)",
    status: "connected",
  },
];

export const MOCK_TEMPLATES: TemplateItem[] = [
  {
    id: "tmpl_01",
    name: "abandoned_cart_recovery_id",
    category: "MARKETING",
    language: "id_ID",
    status: "APPROVED",
    content:
      "Halo {{1}}! Keranjang belanja Anda di {{2}} masih tersimpan nih. Selesaikan pesanan {{3}} Anda sebelum kehabisan ya: {{4}}",
  },
  {
    id: "tmpl_02",
    name: "cod_address_verify_id",
    category: "UTILITY",
    language: "id_ID",
    status: "APPROVED",
    content:
      "Halo Kak {{1}}! Pesanan COD #{{2}} senilai {{3}} siap dikirim ke {{4}}. Mohon pastikan patokan alamat sudah benar ya kak.",
  },
  {
    id: "tmpl_03",
    name: "abandoned_cart_recovery_th",
    category: "MARKETING",
    language: "th_TH",
    status: "APPROVED",
    content:
      "สวัสดีครับคุณ {{1}}! สินค้าในตะกร้า {{2}} ของคุณยังอยู่นะครับ คลิกชำระเงินก่อนสินค้าหมดได้ที่นี่: {{3}}",
  },
  {
    id: "tmpl_04",
    name: "cod_address_verify_en",
    category: "UTILITY",
    language: "en_US",
    status: "APPROVED",
    content:
      "Hi {{1}}! Your COD order #{{2}} is ready for dispatch to {{3}}. Please confirm if your delivery address is accurate.",
  },
  {
    id: "tmpl_05",
    name: "abandoned_cart_recovery_sg",
    category: "MARKETING",
    language: "en_SG",
    status: "APPROVED",
    content:
      "Hi {{1}}! Notice your cart at {{2}} is waiting. Free courier discount applied lah, complete order {{3}} before stock runs out: {{4}}",
  },
  {
    id: "tmpl_06",
    name: "cod_address_verify_ms",
    category: "UTILITY",
    language: "ms_MY",
    status: "APPROVED",
    content:
      "Hai Sis {{1}}! Pesanan COD #{{2}} bernilai {{3}} sedia untuk dipos ke {{4}}. Sila pastikan alamat betul sebelum kami hantar ya.",
  },
  {
    id: "tmpl_07",
    name: "abandoned_cart_recovery_vi",
    category: "MARKETING",
    language: "vi_VN",
    status: "APPROVED",
    content:
      "Chào bạn {{1}}! Giỏ hàng tại {{2}} của bạn vẫn đang được giữ. Hoàn tất đơn hàng {{3}} để nhận ưu đãi freeship nha: {{4}}",
  },
  {
    id: "tmpl_08",
    name: "cod_address_verify_ph",
    category: "UTILITY",
    language: "fil_PH",
    status: "APPROVED",
    content:
      "Hi {{1}}! Ang inyong COD order #{{2}} na nagkakahalaga ng {{3}} ay handa nang i-ship sa {{4}}. Pakikumpirma po ang landmark ng inyong delivery address.",
  },
];

export interface StoreRuntimeInfo {
  id: string;
  shortCode: string;
  name: string;
  platform: "WooCommerce" | "Shopify";
  storeUrl: string;
  webhookSecretMasked: string;
  monthlyOrders: string;
  currency: string;
  timezone: string;
  lastHeartbeat: string;
  status: "connected" | "pending";
}

export const MOCK_STORE_RUNTIMES: StoreRuntimeInfo[] = [
  {
    id: "store_id_tokosepatu",
    shortCode: "WC",
    name: "TokoSepatu_ID (WooCommerce)",
    platform: "WooCommerce",
    storeUrl: "https://tokosepatu.co.id",
    webhookSecretMasked: "whsec_88...19x (有效)",
    monthlyOrders: "2,840 笔/月",
    currency: "IDR (印尼盾)",
    timezone: "Asia/Jakarta (WIB)",
    lastHeartbeat: "1m ago",
    status: "connected",
  },
  {
    id: "store_th_bkkfashion",
    shortCode: "SH",
    name: "BKK_Fashion_TH (Shopify)",
    platform: "Shopify",
    storeUrl: "bkk-fashion-thai.myshopify.com",
    webhookSecretMasked: "sh_sec_99...42k (有效)",
    monthlyOrders: "1,420 笔/月",
    currency: "THB (泰铢)",
    timezone: "Asia/Bangkok (ICT)",
    lastHeartbeat: "3m ago",
    status: "connected",
  },
];

export interface WabaAccountInfo {
  officialNumber: string;
  businessName: string;
  quality: "HIGH" | "MEDIUM" | "LOW";
  tier: string;
  wabaId: string;
  phoneId: string;
  tokenDaysLeft: number;
}

export const MOCK_WABA_ACCOUNT_INFO: WabaAccountInfo = {
  officialNumber: "+62 812-3456-7890",
  businessName: "TokoSepatu Official",
  quality: "HIGH",
  tier: "Tier 2 (10,000 / 24h)",
  wabaId: "902819280192",
  phoneId: "102938192039",
  tokenDaysLeft: 58,
};

export const MOCK_STORE_FORM_PRESETS = {
  testPhone: "+62 812-9812-4412",
  defaultBindPlatform: "WooCommerce" as const,
  defaultBindStoreName: "Batik_Indo_Store",
  defaultBindStoreUrl: "https://batikindo.co.id",
};
