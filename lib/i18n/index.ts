export type SupportedLocale =
  | "zh_CN"
  | "en_US"
  | "en_SG"
  | "id_ID"
  | "ms_MY"
  | "th_TH"
  | "vi_VN"
  | "fil_PH";

export interface SlangToken {
  token: string;
  explanation: string;
}

export interface MarketMeta {
  locale: SupportedLocale;
  countryCode: string;
  countryNameZh: string;
  countryNameEn: string;
  phonePrefix: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  timezoneName: string;
  label: string;
  nativeLabel: string;
  shortLabel: string;
  flag: string;
  slangTokens: SlangToken[];
}

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  "zh_CN",
  "en_US",
  "en_SG",
  "id_ID",
  "ms_MY",
  "th_TH",
  "vi_VN",
  "fil_PH",
];

export const MARKETS: Record<SupportedLocale, MarketMeta> = {
  zh_CN: {
    locale: "zh_CN",
    countryCode: "CN",
    countryNameZh: "中国",
    countryNameEn: "China",
    phonePrefix: "+86",
    currency: "CNY",
    currencySymbol: "¥",
    timezone: "Asia/Shanghai",
    timezoneName: "CST (UTC+8)",
    label: "中文 (简体)",
    nativeLabel: "简体中文",
    shortLabel: "ZH",
    flag: "🇨🇳",
    slangTokens: [
      { token: "亲", explanation: "电商客服常用亲切尊称" },
      { token: "包邮", explanation: "免除物流配送费" },
    ],
  },
  en_US: {
    locale: "en_US",
    countryCode: "US",
    countryNameZh: "全球/国际",
    countryNameEn: "Global / United States",
    phonePrefix: "+1",
    currency: "USD",
    currencySymbol: "$",
    timezone: "UTC",
    timezoneName: "UTC (UTC+0)",
    label: "English (US / Global)",
    nativeLabel: "English",
    shortLabel: "EN",
    flag: "🌐",
    slangTokens: [
      { token: "USDC SPL", explanation: "Solana native SPL token with sub-second confirmation" },
      { token: "COD", explanation: "Cash on Delivery payment mode" },
    ],
  },
  en_SG: {
    locale: "en_SG",
    countryCode: "SG",
    countryNameZh: "新加坡",
    countryNameEn: "Singapore",
    phonePrefix: "+65",
    currency: "SGD",
    currencySymbol: "S$",
    timezone: "Asia/Singapore",
    timezoneName: "SGT (UTC+8)",
    label: "Singapore (Singlish / EN)",
    nativeLabel: "English (Singapore)",
    shortLabel: "SG",
    flag: "🇸🇬",
    slangTokens: [
      { token: "lah / leh / lor", explanation: "新加坡本地语气助词，增强亲和力与对话温度" },
      { token: "PayNow", explanation: "新加坡国家级即时转账系统，对齐数字法币结算" },
      { token: "chope", explanation: "预留锁定（如锁定库存与优惠券）" },
      { token: "can anot", explanation: "询问确认是否可行 (Can it be done?)" },
    ],
  },
  id_ID: {
    locale: "id_ID",
    countryCode: "ID",
    countryNameZh: "印度尼西亚",
    countryNameEn: "Indonesia",
    phonePrefix: "+62",
    currency: "IDR",
    currencySymbol: "Rp",
    timezone: "Asia/Jakarta",
    timezoneName: "WIB (UTC+7)",
    label: "Bahasa Indonesia",
    nativeLabel: "Bahasa Indonesia",
    shortLabel: "ID",
    flag: "🇮🇩",
    slangTokens: [
      { token: "min / kak", explanation: "印尼买家对客服的亲切尊称 (Admin / Kakak)" },
      { token: "ongkir", explanation: "Ongkos Kirim 运费缩写" },
      { token: "ga nyasar", explanation: "确保快递不迷路 (tidak tersesat)" },
      { token: "bisa COD", explanation: "询问是否支持货到付款" },
    ],
  },
  ms_MY: {
    locale: "ms_MY",
    countryCode: "MY",
    countryNameZh: "马来西亚",
    countryNameEn: "Malaysia",
    phonePrefix: "+60",
    currency: "MYR",
    currencySymbol: "RM",
    timezone: "Asia/Kuala_Lumpur",
    timezoneName: "MYT (UTC+8)",
    label: "Bahasa Melayu (Malaysia)",
    nativeLabel: "Bahasa Melayu",
    shortLabel: "MY",
    flag: "🇲🇾",
    slangTokens: [
      { token: "sis / bro", explanation: "马来西亚电商买家常用亲切称呼" },
      { token: "pos laju", explanation: "大马常用快速快递邮寄服务" },
      { token: "jom order", explanation: "号召性用语：快来下单吧" },
      { token: "boleh pos", explanation: "可以安排发货" },
    ],
  },
  th_TH: {
    locale: "th_TH",
    countryCode: "TH",
    countryNameZh: "泰国",
    countryNameEn: "Thailand",
    phonePrefix: "+66",
    currency: "THB",
    currencySymbol: "฿",
    timezone: "Asia/Bangkok",
    timezoneName: "ICT (UTC+7)",
    label: "ภาษาไทย (Thai)",
    nativeLabel: "ไทย",
    shortLabel: "TH",
    flag: "🇹🇭",
    slangTokens: [
      { token: "ครับ / ค่ะ (krub / ka)", explanation: "泰语男女礼貌用语后缀，代表极高真实购买意向" },
      { token: "เก็บเงินปลายทาง", explanation: "泰语 COD 货到付款标准术语" },
      { token: "ส่งฟรี", explanation: "免运费包邮" },
    ],
  },
  vi_VN: {
    locale: "vi_VN",
    countryCode: "VN",
    countryNameZh: "越南",
    countryNameEn: "Vietnam",
    phonePrefix: "+84",
    currency: "VND",
    currencySymbol: "₫",
    timezone: "Asia/Ho_Chi_Minh",
    timezoneName: "ICT (UTC+7)",
    label: "Tiếng Việt (Vietnam)",
    nativeLabel: "Tiếng Việt",
    shortLabel: "VN",
    flag: "🇻🇳",
    slangTokens: [
      { token: "shop ơi", explanation: "越南网购消费者对卖家的标准亲近称呼" },
      { token: "freeship", explanation: "免运费特权" },
      { token: "GHTK / GHN", explanation: "越南本土头部电商物流公司简称" },
      { token: "ship COD", explanation: "货到付款配送" },
    ],
  },
  fil_PH: {
    locale: "fil_PH",
    countryCode: "PH",
    countryNameZh: "菲律宾",
    countryNameEn: "Philippines",
    phonePrefix: "+63",
    currency: "PHP",
    currencySymbol: "₱",
    timezone: "Asia/Manila",
    timezoneName: "PHT (UTC+8)",
    label: "Filipino / Taglish (PH)",
    nativeLabel: "Filipino",
    shortLabel: "PH",
    flag: "🇵🇭",
    slangTokens: [
      { token: "po / opo", explanation: "菲律宾国民最高敬语后缀，表示尊重与诚恳" },
      { token: "pwede COD", explanation: "可以货到付款吗 (Taglish)" },
      { token: "tapat ng", explanation: "在...的正对面（精准地标指引，减少拒签）" },
      { token: "magkano", explanation: "多少钱 / 询价" },
    ],
  },
};

export interface UiTranslations {
  nav_overview: string;
  nav_stores: string;
  nav_workflows: string;
  nav_orders: string;
  nav_inbox: string;
  nav_knowledge: string;
  nav_billing: string;
  nav_settings: string;
  store_label: string;
  waba_status: string;
  webhook_status: string;
  credits_label: string;
  official_site: string;
  demo_badge: string;
  hero_headline: string;
  hero_subhead: string;
  hero_cta_start: string;
  hero_cta_console: string;
}

export const UI_TRANSLATIONS: Record<SupportedLocale, UiTranslations> = {
  zh_CN: {
    nav_overview: "监控总览",
    nav_stores: "店铺与通道",
    nav_workflows: "工作流配置",
    nav_orders: "订单中心",
    nav_inbox: "会话与人工队列",
    nav_knowledge: "多语言知识库",
    nav_billing: "财务充值中心",
    nav_settings: "报表与设置",
    store_label: "店铺",
    waba_status: "WABA: 正常",
    webhook_status: "Webhook: 正常",
    credits_label: "额度",
    official_site: "出海官网",
    demo_badge: "演示模式",
    hero_headline: "Autonomous WhatsApp Agents.\nSettled on Solana.",
    hero_subhead:
      "专为东南亚跨境电商打造：待支付订单 15 分钟温和挽回，印尼 COD 订单发货前智能地标核验。官方 WhatsApp 商业 API 直连，USDC 零汇损即时结算。",
    hero_cta_start: "免费接入",
    hero_cta_console: "商户工作台",
  },
  en_US: {
    nav_overview: "Dashboard",
    nav_stores: "Stores & Channels",
    nav_workflows: "Workflow Engine",
    nav_orders: "Orders Center",
    nav_inbox: "Inbox & Handover",
    nav_knowledge: "Knowledge Base",
    nav_billing: "Billing & Top-up",
    nav_settings: "Reports & Settings",
    store_label: "Store",
    waba_status: "WABA: Healthy",
    webhook_status: "Webhook: Active",
    credits_label: "Credits",
    official_site: "Main Site",
    demo_badge: "Demo/Mock",
    hero_headline: "Autonomous WhatsApp Agents.\nSettled on Solana.",
    hero_subhead:
      "Engineered for Southeast Asian cross-border e-commerce: 15-minute abandoned cart recovery and pre-dispatch COD address verification. Official WhatsApp API with instant USDC settlement.",
    hero_cta_start: "Get Started Free",
    hero_cta_console: "Merchant Console",
  },
  en_SG: {
    nav_overview: "Dashboard",
    nav_stores: "Stores & Channels",
    nav_workflows: "Workflows (SG/SEA)",
    nav_orders: "Orders Center",
    nav_inbox: "Inbox & Live Handover",
    nav_knowledge: "Singlish Knowledge Base",
    nav_billing: "Billing & Credits",
    nav_settings: "Settings & PayNow/RBAC",
    store_label: "Store (SG)",
    waba_status: "WABA: Operational lah",
    webhook_status: "Webhook: Normal",
    credits_label: "Credits",
    official_site: "Portal",
    demo_badge: "Sandbox Live",
    hero_headline: "Autonomous WhatsApp Agents.\nSettled on Solana.",
    hero_subhead:
      "Built for Singapore & SEA sellers: 15-minute gentle cart recovery and pre-delivery COD landmark verification lah. Official WhatsApp Cloud API with zero-slippage instant USDC settlement.",
    hero_cta_start: "Connect Store Free",
    hero_cta_console: "Merchant Console",
  },
  id_ID: {
    nav_overview: "Ringkasan Dasbor",
    nav_stores: "Toko & Saluran",
    nav_workflows: "Konfigurasi Alur Kerja",
    nav_orders: "Pusat Pesanan",
    nav_inbox: "Obrolan & Agen Manual",
    nav_knowledge: "Basis Pengetahuan",
    nav_billing: "Isi Ulang & Keuangan",
    nav_settings: "Laporan & Pengaturan",
    store_label: "Toko",
    waba_status: "WABA: Normal",
    webhook_status: "Webhook: Aktif",
    credits_label: "Kredit",
    official_site: "Situs Resmi",
    demo_badge: "Mode Demo",
    hero_headline: "Asisten Pesanan WhatsApp Otonom.\nSelesai di Solana.",
    hero_subhead:
      "Solusi cerdas e-commerce Asia Tenggara: pemulihan keranjang belanja 15 menit dan verifikasi alamat COD pra-pengiriman. Terhubung ke API resmi WhatsApp dengan settlement USDC instan.",
    hero_cta_start: "Mulai Gratis",
    hero_cta_console: "Dasbor Penjual",
  },
  ms_MY: {
    nav_overview: "Ringkasan Pemantauan",
    nav_stores: "Kedai & Saluran",
    nav_workflows: "Konfigurasi Aliran Kerja",
    nav_orders: "Pusat Pesanan",
    nav_inbox: "Peti Masuk & Pasukan Khidmat",
    nav_knowledge: "Pangkalan Pengetahuan",
    nav_billing: "Pusat Kredit & Baki",
    nav_settings: "Laporan & Tetapan",
    store_label: "Kedai",
    waba_status: "WABA: Beroperasi",
    webhook_status: "Webhook: Aktif",
    credits_label: "Kredit",
    official_site: "Laman Web",
    demo_badge: "Mod Demo",
    hero_headline: "Ejen WhatsApp Autonomi.\nSelesai di Solana.",
    hero_subhead:
      "Khas untuk e-dagang rentas sempadan Asia Tenggara: pemulihan troli terbiar 15 minit & pengesahan COD sebelum pos laju. API rasmi WhatsApp dengan penyelesaian USDC tanpa susut nilai.",
    hero_cta_start: "Daftar Percuma",
    hero_cta_console: "Konsol Peniaga",
  },
  th_TH: {
    nav_overview: "ภาพรวมระบบ",
    nav_stores: "ร้านค้าและช่องทาง",
    nav_workflows: "การตั้งค่าเวิร์กโฟลว์",
    nav_orders: "ศูนย์รวมคำสั่งซื้อ",
    nav_inbox: "กล่องข้อความและคิวเจ้าหน้าที่",
    nav_knowledge: "คลังความรู้หลายภาษา",
    nav_billing: "ศูนย์การเงินและเครดิต",
    nav_settings: "รายงานและการตั้งค่า",
    store_label: "ร้านค้า",
    waba_status: "WABA: พร้อมใช้งาน",
    webhook_status: "Webhook: ปกติ",
    credits_label: "เครดิต",
    official_site: "เว็บไซต์หลัก",
    demo_badge: "ข้อมูลจำลอง",
    hero_headline: "ระบบผู้ช่วย WhatsApp อัตโนมัติ\nชำระเงินบน Solana",
    hero_subhead:
      "ออกแบบมาเพื่ออีคอมเมิร์ซเอเชียตะวันออกเฉียงใต้: กู้คืนตะกร้าสินค้าใน 15 นาที และยืนยันที่อยู่ COD ก่อนจัดส่ง เชื่อมต่อ WhatsApp Business API ทางการ พร้อมชำระเงิน USDC ทันที",
    hero_cta_start: "เริ่มต้นใช้งานฟรี",
    hero_cta_console: "คอนโซลผู้ขาย",
  },
  vi_VN: {
    nav_overview: "Tổng Quan Giám Sát",
    nav_stores: "Cửa Hàng & Kênh",
    nav_workflows: "Cấu Hình Quy Trình",
    nav_orders: "Trung Tâm Đơn Hàng",
    nav_inbox: "Hộp Thư & Hỗ Trợ Viên",
    nav_knowledge: "Kho Kiến Thức Đa Ngôn Ngữ",
    nav_billing: "Nạp Tiền & Tài Chính",
    nav_settings: "Báo Cáo & Cài Đặt",
    store_label: "Cửa hàng",
    waba_status: "WABA: Hoạt động",
    webhook_status: "Webhook: Bình thường",
    credits_label: "Tín dụng",
    official_site: "Trang chủ",
    demo_badge: "Bản thử nghiệm",
    hero_headline: "Trợ Lý Đơn Hàng WhatsApp Tự Động.\nThanh Toán Trên Solana.",
    hero_subhead:
      "Thiết kế riêng cho thương mại điện tử Đông Nam Á: thu hồi giỏ hàng bỏ quên sau 15 phút, xác minh địa chỉ giao COD trước khi gửi hàng. Kết nối trực tiếp WhatsApp Cloud API, tất toán USDC không phí trượt giá.",
    hero_cta_start: "Bắt Đầu Miễn Phí",
    hero_cta_console: "Bàn Làm Việc",
  },
  fil_PH: {
    nav_overview: "Pangkalahatang Dashboard",
    nav_stores: "Tindahan at Channels",
    nav_workflows: "Workflow Automation",
    nav_orders: "Sentro ng mga Order",
    nav_inbox: "Inbox at Live Support",
    nav_knowledge: "Knowledge Base",
    nav_billing: "Credits at Pagsingil",
    nav_settings: "Ulat at Settings",
    store_label: "Tindahan",
    waba_status: "WABA: Aktibo po",
    webhook_status: "Webhook: Normal",
    credits_label: "Kredito",
    official_site: "Pangunahing Site",
    demo_badge: "Demo Mode",
    hero_headline: "Awtomatikong WhatsApp Agent.\nSettled sa Solana.",
    hero_subhead:
      "Ginawa para sa e-commerce sa Southeast Asia: 15-minutong pagbawi ng inabandonang checkout at beripikasyon ng landmark sa COD bago i-dispatch po. Opisyal na WhatsApp API na may instant settlement gamit ang USDC.",
    hero_cta_start: "Libreng Pagkakabit",
    hero_cta_console: "Merchant Console",
  },
};

export function getMarketMeta(locale: SupportedLocale): MarketMeta {
  return MARKETS[locale] || MARKETS.en_US;
}

export function getI18nText<K extends keyof UiTranslations>(
  locale: SupportedLocale,
  key: K
): string {
  const dict = UI_TRANSLATIONS[locale] || UI_TRANSLATIONS.en_US;
  return dict[key] || UI_TRANSLATIONS.en_US[key];
}

export function getMarketByPhone(phone: string): MarketMeta | undefined {
  const clean = phone.trim().replace(/\s|-/g, "");
  for (const meta of Object.values(MARKETS)) {
    if (clean.startsWith(meta.phonePrefix)) {
      return meta;
    }
  }
  return undefined;
}

export function getMarketByCountryCode(code: string): MarketMeta | undefined {
  const upper = code.toUpperCase();
  for (const meta of Object.values(MARKETS)) {
    if (meta.countryCode === upper) {
      return meta;
    }
  }
  return undefined;
}
