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
