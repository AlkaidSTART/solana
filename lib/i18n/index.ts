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
  // Navigation & Topbar
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

  // Common UI actions & statuses
  action_save: string;
  action_cancel: string;
  action_confirm: string;
  action_refresh: string;
  action_reset_view: string;
  action_search: string;
  action_filter: string;
  action_export: string;
  action_close: string;
  status_all: string;
  status_active: string;
  status_paused: string;
  status_pending: string;
  status_normal: string;
  status_warning: string;

  // Overview Page
  overview_title: string;
  overview_stat_credits: string;
  overview_stat_recovered: string;
  overview_stat_cod_rate: string;
  overview_stat_human_queue: string;
  overview_empty_title: string;
  overview_empty_desc: string;
  overview_bind_store: string;
  overview_error_title: string;
  overview_error_desc: string;
  overview_retry_conn: string;
  overview_recent_activity: string;

  // Orders Center Page
  orders_title: string;
  orders_search_placeholder: string;
  orders_tab_all: string;
  orders_tab_pending: string;
  orders_tab_recovered: string;
  orders_tab_cod_verified: string;
  orders_tab_rejected: string;
  orders_col_number: string;
  orders_col_customer: string;
  orders_col_amount: string;
  orders_col_type: string;
  orders_col_status: string;
  orders_col_time: string;
  orders_col_action: string;
  orders_status_recovered: string;
  orders_status_cod_verified: string;
  orders_status_pending: string;
  orders_status_rejected: string;
  orders_status_cancelled: string;
  orders_type_cod: string;
  orders_type_prepaid: string;
  orders_drawer_title: string;
  orders_drawer_landmark: string;
  orders_drawer_resend: string;
  orders_drawer_resending: string;
  orders_drawer_resend_ok: string;
  orders_drawer_approve: string;
  orders_drawer_reject: string;
  orders_drawer_mark_paid: string;

  // Workflows Page
  workflows_title: string;
  workflows_subhead: string;
  workflows_quiet_hours: string;
  workflows_quiet_desc: string;
  workflows_rule_cart_recovery: string;
  workflows_rule_cod_verify: string;
  workflows_matrix_title: string;

  // Settings Page
  settings_title: string;
  settings_subhead: string;
  settings_save_btn: string;
  settings_saved_success: string;
  settings_control_group_title: string;
  settings_control_group_desc: string;
  settings_control_enabled: string;
  settings_control_disabled: string;
  settings_window_label: string;
  settings_timezone_label: string;
  settings_currency_label: string;

  // Stores Page
  stores_title: string;
  stores_subhead: string;
  stores_btn_connect: string;
  stores_connected: string;
  stores_waba_templates: string;

  // Inbox Page
  inbox_title: string;
  inbox_subhead: string;
  inbox_queue_human: string;
  inbox_queue_ai: string;
  inbox_btn_takeover: string;
  inbox_btn_release: string;
  inbox_input_placeholder: string;

  // Billing Page
  billing_title: string;
  billing_subhead: string;
  billing_topup_btn: string;
  billing_history: string;
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

    action_save: "保存",
    action_cancel: "取消",
    action_confirm: "确认",
    action_refresh: "刷新",
    action_reset_view: "恢复正常视图",
    action_search: "搜索",
    action_filter: "筛选",
    action_export: "导出数据",
    action_close: "关闭",
    status_all: "全部",
    status_active: "运行中",
    status_paused: "已暂停",
    status_pending: "待处理",
    status_normal: "正常",
    status_warning: "警告",

    overview_title: "监控总览",
    overview_stat_credits: "账户可用额度",
    overview_stat_recovered: "已挽回支付金额",
    overview_stat_cod_rate: "COD 意愿确认率",
    overview_stat_human_queue: "待人工接管会话",
    overview_empty_title: "暂未绑定店铺或尚无事件数据",
    overview_empty_desc: "请前往“店铺与通道”授权您的首个独立站店铺，系统将自动开始监听 Webhook。",
    overview_bind_store: "立即绑定店铺",
    overview_error_title: "网络与通道异常告警",
    overview_error_desc: "Meta WhatsApp Cloud API 返回凭证过期 (Code 190)，当前发送队列已降级暂存。",
    overview_retry_conn: "重试连通性测试",
    overview_recent_activity: "实时业务动态",

    orders_title: "订单中心",
    orders_search_placeholder: "搜索订单号、买家姓名或手机号...",
    orders_tab_all: "全部订单",
    orders_tab_pending: "待核验/待付",
    orders_tab_recovered: "已挽回支付",
    orders_tab_cod_verified: "COD 已核验",
    orders_tab_rejected: "高危已拦截",
    orders_col_number: "订单号",
    orders_col_customer: "买家 / 手机号",
    orders_col_amount: "金额 / 币种",
    orders_col_type: "订单类型",
    orders_col_status: "状态",
    orders_col_time: "下单时间",
    orders_col_action: "操作",
    orders_status_recovered: "已挽回支付",
    orders_status_cod_verified: "COD 已核验",
    orders_status_pending: "待核验/待付",
    orders_status_rejected: "高危已拦截",
    orders_status_cancelled: "已取消",
    orders_type_cod: "COD 货到付款",
    orders_type_prepaid: "线上预付款",
    orders_drawer_title: "订单详情与 WhatsApp 履约证据",
    orders_drawer_landmark: "配送地标核验结果",
    orders_drawer_resend: "重发 WhatsApp 提醒",
    orders_drawer_resending: "发送中...",
    orders_drawer_resend_ok: "发送成功！",
    orders_drawer_approve: "审核通过并通知发货",
    orders_drawer_reject: "标记高危拦截并拒绝",
    orders_drawer_mark_paid: "标记为已支付",

    workflows_title: "工作流引擎配置",
    workflows_subhead: "配置针对不同国家区号与订单场景自动调度的 WhatsApp 自动化规则与静默时段",
    workflows_quiet_hours: "夜间静默时段保护",
    workflows_quiet_desc: "当地时间 22:00 至次日 08:00 暂停向买家主动推送消息，防止骚扰投诉",
    workflows_rule_cart_recovery: "待支付订单 15 分钟温和挽回",
    workflows_rule_cod_verify: "COD 订单发货前智能地标核验",
    workflows_matrix_title: "东南亚国家与区号路由分流矩阵",

    settings_title: "报表与设置",
    settings_subhead: "配置 20% 对照组归因模型、店铺本土时区货币、团队权限与隐私合规",
    settings_save_btn: "保存全局设置",
    settings_saved_success: "全局配置已成功保存并立即在整个工作台生效！",
    settings_control_group_title: "真实催付效果归因与 20% 对照组科学分流",
    settings_control_group_desc: "为杜绝将自然支付订单冒功为 AI 催付效果，系统自动将 20% 的待支付与 COD 订单划入沉默对照组，不发送 WhatsApp 提醒，以此精准计算净增量。",
    settings_control_enabled: "启用对照组 (推荐)",
    settings_control_disabled: "停用对照组 (不测算Lift)",
    settings_window_label: "滚动统计分析窗口 (天)",
    settings_timezone_label: "店铺主营时区",
    settings_currency_label: "本地结算基准货币",

    stores_title: "店铺与通道",
    stores_subhead: "授权管理独立站电商店铺与官方 Meta WhatsApp Business 账号通道",
    stores_btn_connect: "绑定新独立站",
    stores_connected: "已连接",
    stores_waba_templates: "官方已批准 WhatsApp 消息模板",

    inbox_title: "会话与人工队列",
    inbox_subhead: "实时查看 WhatsApp 买家对话、改址意向与人工无缝接管队列",
    inbox_queue_human: "待人工接管队列",
    inbox_queue_ai: "AI 自动接待中",
    inbox_btn_takeover: "人工接管会话",
    inbox_btn_release: "归还 AI 自动托管",
    inbox_input_placeholder: "输入回复消息发送给买家...",

    billing_title: "财务充值中心",
    billing_subhead: "基于 Solana Pay 的 USDC 零滑点即时服务费充值与账本流水",
    billing_topup_btn: "立即通过 Solana Pay 充值",
    billing_history: "链上结算账本流水",
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

    action_save: "Save",
    action_cancel: "Cancel",
    action_confirm: "Confirm",
    action_refresh: "Refresh",
    action_reset_view: "Reset View",
    action_search: "Search",
    action_filter: "Filter",
    action_export: "Export Data",
    action_close: "Close",
    status_all: "All",
    status_active: "Active",
    status_paused: "Paused",
    status_pending: "Pending",
    status_normal: "Normal",
    status_warning: "Warning",

    overview_title: "Dashboard Overview",
    overview_stat_credits: "Available Balance",
    overview_stat_recovered: "Recovered Revenue",
    overview_stat_cod_rate: "COD Confirmation Rate",
    overview_stat_human_queue: "Pending Human Handover",
    overview_empty_title: "No stores connected or no event data yet",
    overview_empty_desc: "Authorize your store under 'Stores & Channels' to start listening for webhook triggers.",
    overview_bind_store: "Connect Store Now",
    overview_error_title: "Network & Channel Alert",
    overview_error_desc: "Meta WhatsApp Cloud API token expired (Code 190). Messages temporarily queued.",
    overview_retry_conn: "Retry Connection",
    overview_recent_activity: "Live Activity Stream",

    orders_title: "Orders Center",
    orders_search_placeholder: "Search order #, customer name or phone...",
    orders_tab_all: "All Orders",
    orders_tab_pending: "Pending",
    orders_tab_recovered: "Recovered",
    orders_tab_cod_verified: "COD Verified",
    orders_tab_rejected: "High Risk",
    orders_col_number: "Order #",
    orders_col_customer: "Customer / Phone",
    orders_col_amount: "Amount / Currency",
    orders_col_type: "Type",
    orders_col_status: "Status",
    orders_col_time: "Order Time",
    orders_col_action: "Action",
    orders_status_recovered: "Payment Recovered",
    orders_status_cod_verified: "COD Verified",
    orders_status_pending: "Pending Review",
    orders_status_rejected: "High Risk Intercepted",
    orders_status_cancelled: "Cancelled",
    orders_type_cod: "Cash on Delivery",
    orders_type_prepaid: "Online Prepaid",
    orders_drawer_title: "Order Details & WhatsApp Verification Proof",
    orders_drawer_landmark: "Delivery Landmark Verification",
    orders_drawer_resend: "Resend WhatsApp Alert",
    orders_drawer_resending: "Sending...",
    orders_drawer_resend_ok: "Sent successfully!",
    orders_drawer_approve: "Approve for Dispatch",
    orders_drawer_reject: "Reject as High Risk",
    orders_drawer_mark_paid: "Mark as Paid",

    workflows_title: "Workflow Engine Configuration",
    workflows_subhead: "Automate WhatsApp rules, quiet hours, and country routing for multi-market checkout recovery",
    workflows_quiet_hours: "Quiet Hours Protection",
    workflows_quiet_desc: "Pause proactive messages between 22:00 and 08:00 local time to prevent customer spam complaints",
    workflows_rule_cart_recovery: "15-Minute Abandoned Cart Recovery",
    workflows_rule_cod_verify: "Pre-dispatch COD Landmark Verification",
    workflows_matrix_title: "SEA Country Code Routing Matrix",

    settings_title: "Analytics & Settings",
    settings_subhead: "Configure 20% control group attribution, store timezones, team RBAC, and privacy compliance",
    settings_save_btn: "Save Global Settings",
    settings_saved_success: "Settings saved successfully and active across all workspaces!",
    settings_control_group_title: "Attribution & 20% Control Group Model",
    settings_control_group_desc: "To avoid falsely attributing organic payments to AI alerts, 20% of orders are held in a silent control group to measure true incremental lift.",
    settings_control_enabled: "Enable Control Group (Recommended)",
    settings_control_disabled: "Disable Control Group",
    settings_window_label: "Rolling Analysis Window (Days)",
    settings_timezone_label: "Store Primary Timezone",
    settings_currency_label: "Base Currency",

    stores_title: "Stores & Channels",
    stores_subhead: "Manage e-commerce store authorization and official Meta WhatsApp Cloud API credentials",
    stores_btn_connect: "Connect New Store",
    stores_connected: "Connected",
    stores_waba_templates: "Approved WhatsApp Templates",

    inbox_title: "Inbox & Human Handover",
    inbox_subhead: "Live WhatsApp conversations, address modification intents, and seamless agent takeover",
    inbox_queue_human: "Pending Agent Handover",
    inbox_queue_ai: "AI Handled",
    inbox_btn_takeover: "Take Over Conversation",
    inbox_btn_release: "Release to AI",
    inbox_input_placeholder: "Type a message to customer...",

    billing_title: "Billing & Credits",
    billing_subhead: "Instant zero-slippage USDC top-ups on Solana Pay with transparent transaction ledger",
    billing_topup_btn: "Top Up via Solana Pay",
    billing_history: "On-chain Settlement Ledger",
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

    action_save: "Save lah",
    action_cancel: "Cancel",
    action_confirm: "Confirm",
    action_refresh: "Refresh",
    action_reset_view: "Reset View lor",
    action_search: "Search",
    action_filter: "Filter",
    action_export: "Export Data",
    action_close: "Close",
    status_all: "All",
    status_active: "Active lah",
    status_paused: "Paused",
    status_pending: "Pending",
    status_normal: "Normal",
    status_warning: "Warning leh",

    overview_title: "Dashboard Overview (SG)",
    overview_stat_credits: "Available Credits (USDC)",
    overview_stat_recovered: "Recovered Revenue (SGD)",
    overview_stat_cod_rate: "COD Confirmation Rate",
    overview_stat_human_queue: "Pending Agent Handover",
    overview_empty_title: "No store connected or no events yet leh",
    overview_empty_desc: "Please link your store under 'Stores & Channels' to start listening for webhook triggers lah.",
    overview_bind_store: "Connect Store Now lah",
    overview_error_title: "Network & Channel Alert lor",
    overview_error_desc: "Meta WhatsApp token expired (Code 190). Messages safely queued lah.",
    overview_retry_conn: "Retry Connectivity Check",
    overview_recent_activity: "Live Activity Stream (SG/SEA)",

    orders_title: "Orders Center (SG)",
    orders_search_placeholder: "Search order #, customer name or phone leh...",
    orders_tab_all: "All Orders",
    orders_tab_pending: "Pending Verify/Payment",
    orders_tab_recovered: "Payment Recovered lah",
    orders_tab_cod_verified: "COD Verified",
    orders_tab_rejected: "High Risk Choped",
    orders_col_number: "Order #",
    orders_col_customer: "Customer / Mobile",
    orders_col_amount: "Amount / SGD",
    orders_col_type: "Order Type",
    orders_col_status: "Status",
    orders_col_time: "Time (SGT)",
    orders_col_action: "Action",
    orders_status_recovered: "Payment Recovered lah",
    orders_status_cod_verified: "COD Verified",
    orders_status_pending: "Pending Review",
    orders_status_rejected: "High Risk Flagged",
    orders_status_cancelled: "Cancelled",
    orders_type_cod: "Cash on Delivery (COD)",
    orders_type_prepaid: "Online Prepaid / PayNow",
    orders_drawer_title: "Order Details & WhatsApp Verification Proof",
    orders_drawer_landmark: "Landmark & Postal Code Check",
    orders_drawer_resend: "Resend WhatsApp Alert",
    orders_drawer_resending: "Sending lah...",
    orders_drawer_resend_ok: "Sent successfully lor!",
    orders_drawer_approve: "Confirm & Dispatch lah",
    orders_drawer_reject: "Reject as High Risk",
    orders_drawer_mark_paid: "Mark Paid (PayNow/USDC)",

    workflows_title: "Workflows & Automation Engine",
    workflows_subhead: "Automated WhatsApp triggers, quiet hours protection, and SEA country code routing lah",
    workflows_quiet_hours: "Quiet Hours Protection (Night)",
    workflows_quiet_desc: "Pause outreach between 22:00 and 08:00 SGT to keep customers happy and avoid spam reports lah",
    workflows_rule_cart_recovery: "15-Min Abandoned Cart Recovery (Singlish)",
    workflows_rule_cod_verify: "Pre-dispatch COD Landmark Verification",
    workflows_matrix_title: "Singapore & SEA Country Routing Matrix",

    settings_title: "Settings & Analytics (SG)",
    settings_subhead: "Configure 20% control group attribution, Singapore/SEA timezone, and PayNow/RBAC settings",
    settings_save_btn: "Save Global Settings lah",
    settings_saved_success: "Settings saved successfully and active across all stores lor!",
    settings_control_group_title: "True Incremental Lift & 20% Control Group Model",
    settings_control_group_desc: "Hold out 20% of orders without reminders to scientifically prove true incremental revenue without claiming organic sales lah.",
    settings_control_enabled: "Enable Control Group (Recommended lah)",
    settings_control_disabled: "Disable Control Group",
    settings_window_label: "Rolling Analysis Window (Days)",
    settings_timezone_label: "Store Primary Timezone (SGT)",
    settings_currency_label: "Base Currency (SGD / USDC)",

    stores_title: "Stores & Channels (SG)",
    stores_subhead: "Manage Shopify SG / WooCommerce stores and official Meta WhatsApp Cloud API credentials",
    stores_btn_connect: "Connect Store (Shopify/Woo)",
    stores_connected: "Connected lah",
    stores_waba_templates: "Approved WhatsApp Templates (SG/SEA)",

    inbox_title: "Inbox & Live Handover",
    inbox_subhead: "WhatsApp customer messages, address change requests, and instant agent takeover",
    inbox_queue_human: "Agent Handover Queue",
    inbox_queue_ai: "AI Autopilot lah",
    inbox_btn_takeover: "Take Over Conversation",
    inbox_btn_release: "Release to AI",
    inbox_input_placeholder: "Type message to customer lah...",

    billing_title: "Billing & Credits (Solana Pay)",
    billing_subhead: "Zero-slippage instant USDC settlement on Solana Pay with transparent on-chain audit ledger",
    billing_topup_btn: "Top Up with Solana Pay",
    billing_history: "On-chain Settlement Ledger",
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

    action_save: "Simpan",
    action_cancel: "Batal",
    action_confirm: "Konfirmasi",
    action_refresh: "Segarkan",
    action_reset_view: "Kembalikan Tampilan Normal",
    action_search: "Cari",
    action_filter: "Filter",
    action_export: "Ekspor Data",
    action_close: "Tutup",
    status_all: "Semua",
    status_active: "Aktif",
    status_paused: "Dijeda",
    status_pending: "Menunggu",
    status_normal: "Normal",
    status_warning: "Peringatan",

    overview_title: "Ringkasan Dasbor",
    overview_stat_credits: "Sisa Saldo Akun",
    overview_stat_recovered: "Pendapatan Dipulihkan",
    overview_stat_cod_rate: "Tingkat Konfirmasi COD",
    overview_stat_human_queue: "Antrean Agen Manual",
    overview_empty_title: "Belum ada toko terhubung atau data event",
    overview_empty_desc: "Buka 'Toko & Saluran' untuk mengotorisasi toko Anda dan mulai mendengarkan webhook.",
    overview_bind_store: "Hubungkan Toko Sekarang",
    overview_error_title: "Peringatan Jaringan & Saluran",
    overview_error_desc: "Token WhatsApp Cloud API kedaluwarsa (Kode 190). Pesan ditampung sementara.",
    overview_retry_conn: "Uji Ulang Koneksi",
    overview_recent_activity: "Aktivitas Langsung",

    orders_title: "Pusat Pesanan",
    orders_search_placeholder: "Cari no pesanan, nama pembeli atau no HP...",
    orders_tab_all: "Semua Pesanan",
    orders_tab_pending: "Menunggu Verifikasi/Bayar",
    orders_tab_recovered: "Pembayaran Pulih",
    orders_tab_cod_verified: "COD Terverifikasi",
    orders_tab_rejected: "Risiko Tinggi Dicegat",
    orders_col_number: "No. Pesanan",
    orders_col_customer: "Pembeli / No HP",
    orders_col_amount: "Jumlah / Mata Uang",
    orders_col_type: "Tipe",
    orders_col_status: "Status",
    orders_col_time: "Waktu Pesan",
    orders_col_action: "Aksi",
    orders_status_recovered: "Pembayaran Pulih",
    orders_status_cod_verified: "COD Terverifikasi",
    orders_status_pending: "Menunggu Verifikasi",
    orders_status_rejected: "Risiko Tinggi Dicegat",
    orders_status_cancelled: "Dibatalkan",
    orders_type_cod: "Bayar di Tempat (COD)",
    orders_type_prepaid: "Prabayar Online",
    orders_drawer_title: "Detail Pesanan & Bukti Verifikasi WhatsApp",
    orders_drawer_landmark: "Verifikasi Patokan Alamat",
    orders_drawer_resend: "Kirim Ulang Pesan WhatsApp",
    orders_drawer_resending: "Mengirim...",
    orders_drawer_resend_ok: "Berhasil terkirim!",
    orders_drawer_approve: "Setujui & Kirim Barang",
    orders_drawer_reject: "Tolak sebagai Risiko Tinggi",
    orders_drawer_mark_paid: "Tandai Sudah Dibayar",

    workflows_title: "Konfigurasi Alur Kerja",
    workflows_subhead: "Otomatisasi aturan WhatsApp, jam tenang malam, dan perutean kode negara untuk pemulihan pesanan",
    workflows_quiet_hours: "Perlindungan Jam Tenang Malam",
    workflows_quiet_desc: "Jeda pengiriman pesan proaktif antara pukul 22:00 hingga 08:00 waktu setempat agar tidak mengganggu pembeli",
    workflows_rule_cart_recovery: "Pemulihan Keranjang Terbengkalai 15 Menit",
    workflows_rule_cod_verify: "Verifikasi Patokan Alamat COD Pra-pengiriman",
    workflows_matrix_title: "Matriks Perutean Kode Negara Asia Tenggara",

    settings_title: "Laporan & Pengaturan",
    settings_subhead: "Konfigurasi atribusi kelompok kontrol 20%, zona waktu toko, RBAC tim, dan kepatuhan privasi",
    settings_save_btn: "Simpan Pengaturan Global",
    settings_saved_success: "Pengaturan global berhasil disimpan dan segera berlaku di seluruh dasbor!",
    settings_control_group_title: "Atribusi Efek Nyata & Model Kelompok Kontrol 20%",
    settings_control_group_desc: "Untuk mencegah klaim palsu atas pembayaran alami sebagai hasil AI, sistem mengalokasikan 20% pesanan ke kelompok kontrol tanpa pengingat WhatsApp guna mengukur kenaikan bersih (Net Lift).",
    settings_control_enabled: "Aktifkan Kelompok Kontrol (Disarankan)",
    settings_control_disabled: "Nonaktifkan Kelompok Kontrol",
    settings_window_label: "Jendela Analisis Bergulir (Hari)",
    settings_timezone_label: "Zona Waktu Utama Toko",
    settings_currency_label: "Mata Uang Dasar Pembukuan",

    stores_title: "Toko & Saluran",
    stores_subhead: "Kelola otorisasi toko mandiri dan akun WhatsApp Business Platform resmi",
    stores_btn_connect: "Hubungkan Toko Baru",
    stores_connected: "Terhubung",
    stores_waba_templates: "Templat Pesan WhatsApp Resmi yang Disetujui",

    inbox_title: "Peti Masuk & Agen Manual",
    inbox_subhead: "Obrolan pembeli WhatsApp langsung, maksud perubahan alamat, dan pengambilalihan agen mulus",
    inbox_queue_human: "Antrean Menunggu Agen Manual",
    inbox_queue_ai: "Ditangani Otomatis oleh AI",
    inbox_btn_takeover: "Ambil Alih Obrolan Manual",
    inbox_btn_release: "Kembalikan ke AI",
    inbox_input_placeholder: "Ketik pesan balasan untuk pembeli...",

    billing_title: "Isi Ulang & Keuangan",
    billing_subhead: "Top-up biaya layanan instan tanpa selip harga via USDC di Solana Pay beserta buku besar on-chain",
    billing_topup_btn: "Top Up Sekarang via Solana Pay",
    billing_history: "Buku Besar Penyelesaian On-chain",
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

    action_save: "Simpan",
    action_cancel: "Batal",
    action_confirm: "Sahkan",
    action_refresh: "Muat Semula",
    action_reset_view: "Tetapkan Semula Paparan",
    action_search: "Cari",
    action_filter: "Tapis",
    action_export: "Eksport Data",
    action_close: "Tutup",
    status_all: "Semua",
    status_active: "Aktif",
    status_paused: "Dijeda",
    status_pending: "Menunggu",
    status_normal: "Biasa",
    status_warning: "Amaran",

    overview_title: "Ringkasan Pemantauan",
    overview_stat_credits: "Baki Kredit Akaun",
    overview_stat_recovered: "Hasil Dipulihkan",
    overview_stat_cod_rate: "Kadar Pengesahan COD",
    overview_stat_human_queue: "Giliran Khidmat Pelanggan",
    overview_empty_title: "Tiada kedai disambungkan atau tiada data acara lagi",
    overview_empty_desc: "Buka 'Kedai & Saluran' untuk mengesahkan kedai anda dan mula mendengar webhook.",
    overview_bind_store: "Sambung Kedai Sekarang",
    overview_error_title: "Amaran Rangkaian & Saluran",
    overview_error_desc: "Token Meta WhatsApp Cloud API tamat tempoh (Kod 190). Mesej ditangguhkan sementara.",
    overview_retry_conn: "Uji Semula Sambungan",
    overview_recent_activity: "Aktiviti Langsung",

    orders_title: "Pusat Pesanan",
    orders_search_placeholder: "Cari no pesanan, nama pelanggan atau no telefon...",
    orders_tab_all: "Semua Pesanan",
    orders_tab_pending: "Menunggu Pengesahan/Bayar",
    orders_tab_recovered: "Bayaran Dipulihkan",
    orders_tab_cod_verified: "COD Disahkan",
    orders_tab_rejected: "Risiko Tinggi Disekat",
    orders_col_number: "No. Pesanan",
    orders_col_customer: "Pelanggan / No Telefon",
    orders_col_amount: "Jumlah / Mata Wang",
    orders_col_type: "Jenis",
    orders_col_status: "Status",
    orders_col_time: "Masa Pesanan",
    orders_col_action: "Tindakan",
    orders_status_recovered: "Bayaran Dipulihkan",
    orders_status_cod_verified: "COD Disahkan",
    orders_status_pending: "Menunggu Pengesahan",
    orders_status_rejected: "Risiko Tinggi Disekat",
    orders_status_cancelled: "Dibatalkan",
    orders_type_cod: "Bayar Waktu Terima (COD)",
    orders_type_prepaid: "Prabayar Dalam Talian",
    orders_drawer_title: "Butiran Pesanan & Bukti Pengesahan WhatsApp",
    orders_drawer_landmark: "Pengesahan Tanda Tempat Penghantaran",
    orders_drawer_resend: "Hantar Semula Peringatan WhatsApp",
    orders_drawer_resending: "Menghantar...",
    orders_drawer_resend_ok: "Berjaya dihantar!",
    orders_drawer_approve: "Luluskan & Pos Laju",
    orders_drawer_reject: "Tolak sebagai Risiko Tinggi",
    orders_drawer_mark_paid: "Tanda sebagai Dibayar",

    workflows_title: "Konfigurasi Aliran Kerja",
    workflows_subhead: "Automasikan peraturan WhatsApp, waktu senyap malam, dan penghalaan kod negara untuk pemulihan pesanan",
    workflows_quiet_hours: "Perlindungan Waktu Senyap Malam",
    workflows_quiet_desc: "Hentikan mesej proaktif antara jam 22:00 hingga 08:00 waktu tempatan untuk elak aduan spam",
    workflows_rule_cart_recovery: "Pemulihan Troli Terbiar 15 Minit",
    workflows_rule_cod_verify: "Pengesahan Tanda Tempat COD Sebelum Pos Laju",
    workflows_matrix_title: "Matriks Penghalaan Kod Negara Asia Tenggara",

    settings_title: "Laporan & Tetapan",
    settings_subhead: "Konfigurasi atribusi kumpulan kawalan 20%, zon masa kedai, RBAC pasukan dan pematuhan privasi",
    settings_save_btn: "Simpan Tetapan Global",
    settings_saved_success: "Tetapan global berjaya disimpan dan berkuat kuasa serta-merta di seluruh konsol!",
    settings_control_group_title: "Atribusi Kesan Sebenar & Model Kumpulan Kawalan 20%",
    settings_control_group_desc: "Bagi mengelakkan pesanan berbayar organik dikira sebagai kesan AI, sistem memperuntukkan 20% pesanan ke kumpulan kawalan tanpa mesej peringatan untuk mengukur kenaikan bersih sebenar.",
    settings_control_enabled: "Aktifkan Kumpulan Kawalan (Disyorkan)",
    settings_control_disabled: "Nyahaktifkan Kumpulan Kawalan",
    settings_window_label: "Tetingkap Analisis Bergolek (Hari)",
    settings_timezone_label: "Zon Masa Utama Kedai",
    settings_currency_label: "Mata Wang Asas Pembukuan",

    stores_title: "Kedai & Saluran",
    stores_subhead: "Urus kebenaran kedai e-dagang dan saluran akaun rasmi Meta WhatsApp Business",
    stores_btn_connect: "Sambung Kedai Baharu",
    stores_connected: "Tersambung",
    stores_waba_templates: "Templat Mesej WhatsApp Rasmi yang Diluluskan",

    inbox_title: "Peti Masuk & Pasukan Khidmat",
    inbox_subhead: "Perbualan pelanggan WhatsApp langsung, niat pertukaran alamat dan pengambilalihan ejen manual",
    inbox_queue_human: "Giliran Menunggu Ejen Manual",
    inbox_queue_ai: "Dikendalikan oleh AI",
    inbox_btn_takeover: "Ambil Alih Perbualan",
    inbox_btn_release: "Serah Semula kepada AI",
    inbox_input_placeholder: "Taip mesej balasan kepada pelanggan...",

    billing_title: "Pusat Kredit & Baki",
    billing_subhead: "Tambah nilai yuran perkhidmatan serta-merta tanpa gelinciran harga via USDC di Solana Pay beserta lejar on-chain",
    billing_topup_btn: "Tambah Nilai via Solana Pay Sekarang",
    billing_history: "Lejar Penyelesaian On-chain",
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

    action_save: "บันทึก",
    action_cancel: "ยกเลิก",
    action_confirm: "ยืนยัน",
    action_refresh: "รีเฟรช",
    action_reset_view: "คืนค่ามุมมองปกติ",
    action_search: "ค้นหา",
    action_filter: "ตัวกรอง",
    action_export: "ส่งออกข้อมูล",
    action_close: "ปิด",
    status_all: "ทั้งหมด",
    status_active: "ทำงานอยู่",
    status_paused: "หยุดชั่วคราว",
    status_pending: "รอดำเนินการ",
    status_normal: "ปกติ",
    status_warning: "คำเตือน",

    overview_title: "ภาพรวมระบบ",
    overview_stat_credits: "ยอดเครดิตคงเหลือ",
    overview_stat_recovered: "ยอดกู้คืนคำสั่งซื้อ",
    overview_stat_cod_rate: "อัตราการยืนยัน COD",
    overview_stat_human_queue: "คิวรอเจ้าหน้าที่รับช่วง",
    overview_empty_title: "ยังไม่ได้ผูกร้านค้าหรือไม่มีข้อมูลเหตุการณ์",
    overview_empty_desc: "ไปที่ 'ร้านค้าและช่องทาง' เพื่อเชื่อมต่อร้านค้าและเริ่มรับ Webhook",
    overview_bind_store: "ผูกร้านค้าทันที",
    overview_error_title: "การแจ้งเตือนเครือข่ายและช่องทาง",
    overview_error_desc: "โทเค็น Meta WhatsApp Cloud API หมดอายุ (รหัส 190) ข้อความถูกพักไว้ชั่วคราว",
    overview_retry_conn: "ทดสอบการเชื่อมต่อใหม่",
    overview_recent_activity: "กิจกรรมแบบเรียลไทม์",

    orders_title: "ศูนย์รวมคำสั่งซื้อ",
    orders_search_placeholder: "ค้นหาหมายเลขคำสั่งซื้อ ชื่อ หรือเบอร์โทรศัพท์...",
    orders_tab_all: "คำสั่งซื้อทั้งหมด",
    orders_tab_pending: "รอตรวจสอบ/รอชำระ",
    orders_tab_recovered: "กู้คืนสำเร็จ",
    orders_tab_cod_verified: "ยืนยัน COD แล้ว",
    orders_tab_rejected: "สกัดความเสี่ยงสูง",
    orders_col_number: "หมายเลขคำสั่งซื้อ",
    orders_col_customer: "ลูกค้า / เบอร์โทร",
    orders_col_amount: "ยอดเงิน / สกุลเงิน",
    orders_col_type: "ประเภท",
    orders_col_status: "สถานะ",
    orders_col_time: "เวลาสั่งซื้อ",
    orders_col_action: "การดำเนินการ",
    orders_status_recovered: "ชำระเงินสำเร็จแล้ว",
    orders_status_cod_verified: "ยืนยัน COD แล้ว",
    orders_status_pending: "รอตรวจสอบ",
    orders_status_rejected: "สกัดความเสี่ยงสูง",
    orders_status_cancelled: "ยกเลิกแล้ว",
    orders_type_cod: "เก็บเงินปลายทาง (COD)",
    orders_type_prepaid: "ชำระเงินออนไลน์",
    orders_drawer_title: "รายละเอียดคำสั่งซื้อและหลักฐาน WhatsApp",
    orders_drawer_landmark: "ตรวจสอบจุดสังเกตการจัดส่ง",
    orders_drawer_resend: "ส่งการแจ้งเตือน WhatsApp ซ้ำ",
    orders_drawer_resending: "กำลังส่ง...",
    orders_drawer_resend_ok: "ส่งสำเร็จแล้ว!",
    orders_drawer_approve: "อนุมัติและจัดส่ง",
    orders_drawer_reject: "ปฏิเสธเนื่องจากมีความเสี่ยงสูง",
    orders_drawer_mark_paid: "ทำเครื่องหมายว่าชำระแล้ว",

    workflows_title: "การตั้งค่าเวิร์กโฟลว์",
    workflows_subhead: "จัดการระบบอัตโนมัติของ WhatsApp ช่วงเวลาเงียบ และการกำหนดรหัสประเทศเพื่อกู้คืนคำสั่งซื้อ",
    workflows_quiet_hours: "การป้องกันช่วงเวลาเงียบในเวลากลางคืน",
    workflows_quiet_desc: "ระงับการส่งข้อความระหว่าง 22:00 ถึง 08:00 ตามเวลาท้องถิ่นเพื่อป้องกันการร้องเรียน",
    workflows_rule_cart_recovery: "กู้คืนคำสั่งซื้อค้างชำระใน 15 นาที",
    workflows_rule_cod_verify: "ตรวจสอบจุดสังเกตที่อยู่ COD ก่อนจัดส่ง",
    workflows_matrix_title: "เมทริกซ์การกำหนดเส้นทางตามรหัสประเทศเอเชียตะวันออกเฉียงใต้",

    settings_title: "รายงานและการตั้งค่า",
    settings_subhead: "กำหนดค่าโมเดลกลุ่มควบคุม 20% โซนเวลาร้านค้า สิทธิ์ทีม และการปฏิบัติตามความเป็นส่วนตัว",
    settings_save_btn: "บันทึกการตั้งค่าส่วนกลาง",
    settings_saved_success: "บันทึกการตั้งค่าเรียบร้อยแล้วและมีผลทั่วทั้งระบบทันที!",
    settings_control_group_title: "การระบุผลลัพธ์ที่แท้จริงและกลุ่มควบคุม 20%",
    settings_control_group_desc: "เพื่อป้องกันการนับการชำระเงินปกติเป็นผลงานของ AI ระบบจะจัดสรรคำสั่งซื้อ 20% ไว้ในกลุ่มควบคุมโดยไม่ส่งข้อความ เพื่อวัดผลลัพธ์ส่วนเพิ่มอย่างแม่นยำ",
    settings_control_enabled: "เปิดใช้งานกลุ่มควบคุม (แนะนำ)",
    settings_control_disabled: "ปิดใช้งานกลุ่มควบคุม",
    settings_window_label: "ช่วงเวลาการวิเคราะห์แบบหมุนเวียน (วัน)",
    settings_timezone_label: "เขตเวลาหลักของร้านค้า",
    settings_currency_label: "สกุลเงินหลักสำหรับการลงบัญชี",

    stores_title: "ร้านค้าและช่องทาง",
    stores_subhead: "จัดการการเชื่อมต่อร้านค้าออนไลน์และบัญชี Meta WhatsApp Business ทางการ",
    stores_btn_connect: "ผูกร้านค้าใหม่",
    stores_connected: "เชื่อมต่อแล้ว",
    stores_waba_templates: "เทมเพลตข้อความ WhatsApp ทางการที่ได้รับอนุมัติ",

    inbox_title: "กล่องข้อความและคิวเจ้าหน้าที่",
    inbox_subhead: "บทสนทนาสดของลูกค้า WhatsApp คำขอเปลี่ยนที่อยู่ และการส่งต่อเจ้าหน้าที่อย่างไร้รอยต่อ",
    inbox_queue_human: "คิวรอเจ้าหน้าที่ดำเนินการ",
    inbox_queue_ai: "AI กำลังดูแลอัตโนมัติ",
    inbox_btn_takeover: "รับช่วงการสนทนาด้วยตนเอง",
    inbox_btn_release: "ส่งกลับให้ AI ดูแล",
    inbox_input_placeholder: "พิมพ์ข้อความตอบกลับลูกค้า...",

    billing_title: "ศูนย์การเงินและเครดิต",
    billing_subhead: "เติมเครดิตค่าบริการทันทีด้วย USDC ผ่าน Solana Pay พร้อมบัญชีแยกประเภทบนเชน",
    billing_topup_btn: "เติมเงินทันทีผ่าน Solana Pay",
    billing_history: "บัญชีแยกประเภทการชำระเงินบนเชน",
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

    action_save: "Lưu",
    action_cancel: "Hủy",
    action_confirm: "Xác nhận",
    action_refresh: "Làm mới",
    action_reset_view: "Khôi phục chế độ xem",
    action_search: "Tìm kiếm",
    action_filter: "Bộ lọc",
    action_export: "Xuất dữ liệu",
    action_close: "Đóng",
    status_all: "Tất cả",
    status_active: "Đang hoạt động",
    status_paused: "Tạm dừng",
    status_pending: "Đang chờ",
    status_normal: "Bình thường",
    status_warning: "Cảnh báo",

    overview_title: "Tổng Quan Giám Sát",
    overview_stat_credits: "Số Dư Khả Dụng",
    overview_stat_recovered: "Doanh Thu Đã Thu Hồi",
    overview_stat_cod_rate: "Tỷ Lệ Xác Nhận COD",
    overview_stat_human_queue: "Hàng Đợi Hỗ Trợ Viên",
    overview_empty_title: "Chưa liên kết cửa hàng hoặc chưa có dữ liệu sự kiện",
    overview_empty_desc: "Vui lòng vào 'Cửa Hàng & Kênh' để ủy quyền cửa hàng và bắt đầu lắng nghe webhook.",
    overview_bind_store: "Liên Kết Cửa Hàng Ngay",
    overview_error_title: "Cảnh Báo Mạng & Kênh Liên Lạc",
    overview_error_desc: "Mã token Meta WhatsApp Cloud API hết hạn (Mã 190). Tin nhắn tạm thời được xếp hàng.",
    overview_retry_conn: "Thử Lại Kết Nối",
    overview_recent_activity: "Hoạt Động Trực Tiếp",

    orders_title: "Trung Tâm Đơn Hàng",
    orders_search_placeholder: "Tìm mã đơn, tên khách hàng hoặc số điện thoại...",
    orders_tab_all: "Tất Cả Đơn Hàng",
    orders_tab_pending: "Chờ Xác Minh/Chờ Trả",
    orders_tab_recovered: "Đã Thu Hồi Tiền",
    orders_tab_cod_verified: "Đã Xác Minh COD",
    orders_tab_rejected: "Nguy Cơ Cao Đã Chặn",
    orders_col_number: "Mã Đơn",
    orders_col_customer: "Khách Hàng / SĐT",
    orders_col_amount: "Số Tiền / Tiền Tệ",
    orders_col_type: "Loại",
    orders_col_status: "Trạng Thái",
    orders_col_time: "Thời Gian Đặt",
    orders_col_action: "Thao Tác",
    orders_status_recovered: "Đã Thu Hồi Thanh Toán",
    orders_status_cod_verified: "Đã Xác Minh COD",
    orders_status_pending: "Chờ Xem Xét",
    orders_status_rejected: "Nguy Cơ Cao Đã Chặn",
    orders_status_cancelled: "Đã Hủy",
    orders_type_cod: "Thanh Toán Khi Nhận (COD)",
    orders_type_prepaid: "Trả Trước Trực Tuyến",
    orders_drawer_title: "Chi Tiết Đơn Hàng & Bằng Chứng Xác Minh WhatsApp",
    orders_drawer_landmark: "Xác Minh Mốc Địa Chỉ Giao Hàng",
    orders_drawer_resend: "Gửi Lại Thông Báo WhatsApp",
    orders_drawer_resending: "Đang gửi...",
    orders_drawer_resend_ok: "Gửi thành công!",
    orders_drawer_approve: "Duyệt Giao Hàng",
    orders_drawer_reject: "Từ Chối Vì Nguy Cơ Cao",
    orders_drawer_mark_paid: "Đánh Dấu Đã Trả Tiền",

    workflows_title: "Cấu Hình Quy Trình",
    workflows_subhead: "Tự động hóa quy tắc WhatsApp, khung giờ yên tĩnh và định tuyến mã quốc gia để thu hồi đơn hàng",
    workflows_quiet_hours: "Bảo Vệ Khung Giờ Yên Tĩnh Ban Đêm",
    workflows_quiet_desc: "Tạm dừng gửi tin nhắn chủ động từ 22:00 đến 08:00 giờ địa phương để tránh làm phiền khách",
    workflows_rule_cart_recovery: "Thu Hồi Giỏ Hàng Bỏ Quên Sau 15 Phút",
    workflows_rule_cod_verify: "Xác Minh Mốc Địa Chỉ COD Trước Khi Giao",
    workflows_matrix_title: "Ma Trận Định Tuyến Mã Quốc Gia Đông Nam Á",

    settings_title: "Báo Cáo & Cài Đặt",
    settings_subhead: "Cấu hình mô hình nhóm đối chứng 20%, múi giờ cửa hàng, quyền RBAC và tuân thủ quyền riêng tư",
    settings_save_btn: "Lưu Cài Đặt Chung",
    settings_saved_success: "Đã lưu thành công cài đặt chung và áp dụng ngay trên toàn hệ thống!",
    settings_control_group_title: "Quy Thuộc Hiệu Quả Thực & Mô Hình Nhóm Đối Chứng 20%",
    settings_control_group_desc: "Để tránh nhận vơ các khoản thanh toán tự nhiên là do AI, hệ thống tự động giữ 20% đơn hàng trong nhóm đối chứng không gửi tin nhắc để đo lường mức tăng ròng chính xác.",
    settings_control_enabled: "Bật Nhóm Đối Chứng (Khuyên dùng)",
    settings_control_disabled: "Tắt Nhóm Đối Chứng",
    settings_window_label: "Cửa Sổ Phân Tích Cuộn (Ngày)",
    settings_timezone_label: "Múi Giờ Hoạt Động Chính",
    settings_currency_label: "Đồng Tiền Cơ Sở Kế Toán",

    stores_title: "Cửa Hàng & Kênh",
    stores_subhead: "Quản lý ủy quyền cửa hàng độc lập và kênh tài khoản Meta WhatsApp Business chính thức",
    stores_btn_connect: "Liên Kết Cửa Hàng Mới",
    stores_connected: "Đã Kết Nối",
    stores_waba_templates: "Mẫu Tin Nhắn WhatsApp Đã Được Phê Duyệt",

    inbox_title: "Hộp Thư & Hỗ Trợ Viên",
    inbox_subhead: "Hội thoại WhatsApp trực tiếp, ý định đổi địa chỉ và chuyển giao mượt mà cho nhân viên",
    inbox_queue_human: "Hàng Đợi Chờ Nhân Viên",
    inbox_queue_ai: "AI Đang Tự Động Xử Lý",
    inbox_btn_takeover: "Tiếp Quản Hội Thoại",
    inbox_btn_release: "Bàn Giao Lại Cho AI",
    inbox_input_placeholder: "Nhập tin nhắn phản hồi cho khách...",

    billing_title: "Nạp Tiền & Tài Chính",
    billing_subhead: "Nạp phí dịch vụ tức thì không trượt giá qua USDC trên Solana Pay kèm sổ cái on-chain",
    billing_topup_btn: "Nạp Tiền Qua Solana Pay Ngay",
    billing_history: "Sổ Cái Tất Toán On-chain",
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

    action_save: "I-save",
    action_cancel: "Kanselahin",
    action_confirm: "Kumpirmahin",
    action_refresh: "I-refresh",
    action_reset_view: "Ibalik sa Normal",
    action_search: "Maghanap",
    action_filter: "Salain",
    action_export: "I-export ang Data",
    action_close: "Isara",
    status_all: "Lahat",
    status_active: "Aktibo",
    status_paused: "Naka-pause",
    status_pending: "Nakabinbin",
    status_normal: "Normal",
    status_warning: "Babala",

    overview_title: "Pangkalahatang Dashboard",
    overview_stat_credits: "Natitirang Balanse",
    overview_stat_recovered: "Narekober na Kita",
    overview_stat_cod_rate: "Rate ng Kumpirmasyon sa COD",
    overview_stat_human_queue: "Nakabinbing Suporta ng Tao",
    overview_empty_title: "Wala pang nakakabit na tindahan o datos ng kaganapan",
    overview_empty_desc: "Pumunta sa 'Tindahan at Channels' upang ikonekta ang iyong tindahan at magsimulang makinig sa mga webhook.",
    overview_bind_store: "Ikabit ang Tindahan Ngayon",
    overview_error_title: "Alerto sa Network at Channel",
    overview_error_desc: "Nag-expire ang token ng Meta WhatsApp Cloud API (Code 190). Pansamantalang naka-queue ang mga mensahe.",
    overview_retry_conn: "Subukang Muli ang Koneksyon",
    overview_recent_activity: "Kasalukuyang Aktibidad",

    orders_title: "Sentro ng mga Order",
    orders_search_placeholder: "Maghanap ng order #, pangalan ng customer o telepono...",
    orders_tab_all: "Lahat ng Order",
    orders_tab_pending: "Naghihintay ng Beripikasyon/Bayad",
    orders_tab_recovered: "Narekober ang Bayad",
    orders_tab_cod_verified: "Beripikadong COD",
    orders_tab_rejected: "Mataas ang Panganib Na-intercept",
    orders_col_number: "Order #",
    orders_col_customer: "Customer / Telepono",
    orders_col_amount: "Halaga / Pera",
    orders_col_type: "Uri",
    orders_col_status: "Katayuan",
    orders_col_time: "Oras ng Order",
    orders_col_action: "Aksyon",
    orders_status_recovered: "Narekober ang Bayad",
    orders_status_cod_verified: "Beripikadong COD",
    orders_status_pending: "Naghihintay ng Pagsusuri",
    orders_status_rejected: "Na-intercept na Panganib",
    orders_status_cancelled: "Kinansela",
    orders_type_cod: "Cash on Delivery (COD)",
    orders_type_prepaid: "Online na Paunang Bayad",
    orders_drawer_title: "Detalye ng Order at Patunay sa WhatsApp",
    orders_drawer_landmark: "Pagsusuri ng Landmark sa Paghahatid",
    orders_drawer_resend: "Ipadala Muli ang WhatsApp Alert",
    orders_drawer_resending: "Ipinapadala...",
    orders_drawer_resend_ok: "Matagumpay na naipadala po!",
    orders_drawer_approve: "Aprubahan para I-dispatch",
    orders_drawer_reject: "Tanggihan dahil Mataas ang Panganib",
    orders_drawer_mark_paid: "Markahan bilang Bayad Na",

    workflows_title: "Workflow Automation",
    workflows_subhead: "I-automate ang mga panuntunan sa WhatsApp, quiet hours, at routing para sa pagbawi ng order",
    workflows_quiet_hours: "Proteksyon sa Quiet Hours sa Gabi",
    workflows_quiet_desc: "I-pause ang proactive na mensahe mula 22:00 hanggang 08:00 local time upang maiwasan ang reklamo sa spam",
    workflows_rule_cart_recovery: "15-Minutong Pagbawi ng Iniwanang Checkout",
    workflows_rule_cod_verify: "Beripikasyon ng Landmark sa COD Bago I-dispatch",
    workflows_matrix_title: "Routing Matrix ng mga Bansa sa Southeast Asia",

    settings_title: "Ulat at Settings",
    settings_subhead: "I-configure ang 20% control group attribution, timezones ng tindahan, RBAC ng koponan, at privacy",
    settings_save_btn: "I-save ang Pandaigdigang Settings",
    settings_saved_success: "Matagumpay na na-save ang settings at aktibo na sa buong workspace po!",
    settings_control_group_title: "Tunay na Epekto at 20% Control Group Model",
    settings_control_group_desc: "Upang hindi maangkin ang natural na pagbabayad bilang dulot ng AI, 20% ng mga order ay inilalagay sa tahimik na control group upang sukatin ang tunay na net lift.",
    settings_control_enabled: "Paganahin ang Control Group (Inirerekomenda)",
    settings_control_disabled: "I-disable ang Control Group",
    settings_window_label: "Window ng Pagsusuri (Araw)",
    settings_timezone_label: "Pangunahing Timezone ng Tindahan",
    settings_currency_label: "Pangunahing Pera para sa Ledger",

    stores_title: "Tindahan at Channels",
    stores_subhead: "Pamahalaan ang awtorisasyon ng tindahan at opisyal na Meta WhatsApp Business account",
    stores_btn_connect: "Ikabit ang Bagong Tindahan",
    stores_connected: "Konektado",
    stores_waba_templates: "Mga Inaprubahang Template sa WhatsApp",

    inbox_title: "Inbox at Live Support",
    inbox_subhead: "Live na pag-uusap sa WhatsApp, pagpapalit ng address, at maayos na handover sa tao",
    inbox_queue_human: "Nakabinbing Suporta ng Ahente",
    inbox_queue_ai: "Pinangangasiwaan ng AI",
    inbox_btn_takeover: "Kunin ang Pag-uusap",
    inbox_btn_release: "Ibalik sa AI",
    inbox_input_placeholder: "Mag-type ng mensahe para sa customer...",

    billing_title: "Credits at Pagsingil",
    billing_subhead: "Instant na top-up ng service fee gamit ang USDC sa Solana Pay na may transparent on-chain ledger",
    billing_topup_btn: "Mag-top up sa Solana Pay Ngayon",
    billing_history: "On-chain Settlement Ledger",
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
