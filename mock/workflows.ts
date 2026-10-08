import type { WorkflowRule } from "@/stores/use-app-store";

export const MOCK_WORKFLOWS: WorkflowRule[] = [
  {
    id: "wf_01",
    code: "WF_RECOVERY_ABANDONED",
    name: "15 分钟待支付订单温和挽回",
    description: "在买家弃购后 15 分钟静默期触发，若订单未付款且在白昼时段，自动下发多语言官方模板并附带动态直付链接",
    enabled: true,
    version: "v1.2",
    triggerDelay: "15 分钟",
    languages: ["en_SG", "id_ID", "ms_MY", "th_TH", "vi_VN", "fil_PH", "en_US"],
    quietHours: "22:00 ~ 08:00 (自动顺延至次日 08:30)",
    maxFrequency: "单订单最多 2 次，间隔 ≥ 24 小时",
  },
  {
    id: "wf_02",
    code: "WF_COD_CONFIRM",
    name: "COD 货到付款发货前地址确认与防损",
    description: "拦截高拒签区域订单，在商家打单发货前，通过 WhatsApp 发送地址与购买意向确认，支持买家一键补充地标",
    enabled: true,
    version: "v1.0",
    triggerDelay: "订单创建后 5 分钟",
    languages: ["en_SG", "id_ID", "ms_MY", "vi_VN", "fil_PH", "en_US"],
    quietHours: "21:30 ~ 08:30 (免打扰保护)",
    maxFrequency: "单订单最多 1 次，逾期 12h 触发风控提醒",
  },
];

export interface RoutingMatrixItem {
  countryCode: string;
  countryName: string;
  phonePrefix: string;
  languageCode: string;
  languageLabel: string;
  timezone: string;
  slangLabel: string;
  slangExamples: string;
  tagColorClass: string;
  tagTextColorClass: string;
}

export const MOCK_ROUTING_MATRIX: RoutingMatrixItem[] = [
  {
    countryCode: "SG",
    countryName: "新加坡",
    phonePrefix: "+65",
    languageCode: "en_SG",
    languageLabel: "Singlish / 英语",
    timezone: "Asia/Singapore (SGT, UTC+8)",
    slangLabel: "Singlish",
    slangExamples: "lah, leh, PayNow, chope",
    tagColorClass: "bg-amber-500/10 border-amber-500/20 text-amber-700",
    tagTextColorClass: "text-amber-700",
  },
  {
    countryCode: "ID",
    countryName: "印度尼西亚",
    phonePrefix: "+62",
    languageCode: "id_ID",
    languageLabel: "印尼语",
    timezone: "Asia/Jakarta (WIB, UTC+7)",
    slangLabel: "Bahasa Gaul",
    slangExamples: "min, ongkir, nyasar",
    tagColorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700",
    tagTextColorClass: "text-emerald-700",
  },
  {
    countryCode: "MY",
    countryName: "马来西亚",
    phonePrefix: "+60",
    languageCode: "ms_MY",
    languageLabel: "马来语",
    timezone: "Asia/Kuala_Lumpur (MYT, UTC+8)",
    slangLabel: "Melayu Pasar",
    slangExamples: "sis, Pos Laju, boleh pos",
    tagColorClass: "bg-cyan-500/10 border-cyan-500/20 text-cyan-700",
    tagTextColorClass: "text-cyan-700",
  },
  {
    countryCode: "TH",
    countryName: "泰国",
    phonePrefix: "+66",
    languageCode: "th_TH",
    languageLabel: "泰语",
    timezone: "Asia/Bangkok (ICT, UTC+7)",
    slangLabel: "Particles",
    slangExamples: "krub/ka, pom, ส่งฟรี",
    tagColorClass: "bg-purple-500/10 border-purple-500/20 text-purple-700",
    tagTextColorClass: "text-purple-700",
  },
  {
    countryCode: "VN",
    countryName: "越南",
    phonePrefix: "+84",
    languageCode: "vi_VN",
    languageLabel: "越南语",
    timezone: "Asia/Ho_Chi_Minh (ICT, UTC+7)",
    slangLabel: "Tiếng Việt",
    slangExamples: "shop ơi, freeship, GHTK",
    tagColorClass: "bg-blue-500/10 border-blue-500/20 text-blue-700",
    tagTextColorClass: "text-blue-700",
  },
  {
    countryCode: "PH",
    countryName: "菲律宾",
    phonePrefix: "+63",
    languageCode: "fil_PH",
    languageLabel: "Tagalog / Taglish",
    timezone: "Asia/Manila (PHT, UTC+8)",
    slangLabel: "Taglish",
    slangExamples: "po/opo, pwede COD, tapat ng",
    tagColorClass: "bg-rose-500/10 border-rose-500/20 text-rose-700",
    tagTextColorClass: "text-rose-700",
  },
];
