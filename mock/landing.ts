export interface FeedOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  location: string;
  amount: string;
  currency: string;
  type: "COD_VERIFIED" | "RECOVERED" | "AUTO_INQUIRY";
  typeLabel: string;
  timeAgo: string;
  riskScore: number;
  botDialogue: {
    buyerText: string;
    buyerTime: string;
    botText: string;
    botTime: string;
    actionBadge: string;
    erpSyncedText: string;
  };
}

export const MOCK_LANDING_FEED_ORDERS: FeedOrder[] = [
  {
    id: "ord_1",
    orderNumber: "ORD-ID-9821",
    buyerName: "Rizky Firmansyah",
    location: "雅加达南区 (Jakarta Selatan)",
    amount: "Rp 349.000",
    currency: "IDR",
    type: "COD_VERIFIED",
    typeLabel: "COD 发货前核验",
    timeAgo: "1 分钟前",
    riskScore: 6,
    botDialogue: {
      buyerText: "Halo min, tolong di paket tulis depan Alfamart seberang masjid ya min, biar kurir ga nyasar.",
      buyerTime: "14:08 WIB",
      botText: "Siap Kak Rizky! Alamat sudah kami lengkapi dengan patokan Alfamart. Paket segera dikirim sore ini ya!",
      botTime: "14:08 WIB",
      actionBadge: "地标自动校准 · J&T 物流面单同步",
      erpSyncedText: "WooCommerce #9821 状态变更: 发货就绪 (COD Verified)",
    },
  },
  {
    id: "ord_2",
    orderNumber: "ORD-TH-4412",
    buyerName: "Somchai Prasert",
    location: "曼谷 (Bangkok)",
    amount: "฿ 1,250",
    currency: "THB",
    type: "RECOVERED",
    typeLabel: "15 分钟弃购挽回",
    timeAgo: "3 分钟前",
    riskScore: 2,
    botDialogue: {
      buyerText: "สวัสดีครับ มีโค้ดส่วนลดค่าส่งไหมครับ กำลังจะชำระเงิน",
      buyerTime: "14:05 ICT",
      botText: "สวัสดีครับคุณ Somchai! มอบส่วนลดพิเศษ 10% ให้ทันที กดลิงก์นี้เพื่อชำระเงินได้เลยครับ ขอบคุณครับ",
      botTime: "14:05 ICT",
      actionBadge: "动态结账优惠券已发放 · PromptPay 扫码支付",
      erpSyncedText: "Shopify #TH-4412 补付成功: GMV 已挽回 (US$ 36.80)",
    },
  },
  {
    id: "ord_3",
    orderNumber: "ORD-VN-3108",
    buyerName: "Nguyen Van Minh",
    location: "胡志明市 (Ho Chi Minh)",
    amount: "₫ 850.000",
    currency: "VND",
    type: "AUTO_INQUIRY",
    typeLabel: "夜间智能咨询应答",
    timeAgo: "8 分钟前",
    riskScore: 4,
    botDialogue: {
      buyerText: "Shop ơi mẫu này size 42 còn hàng không ạ? Giao HCMC mấy ngày nhận được?",
      buyerTime: "02:14 ICT",
      botText: "Dạ chào bạn! Size 42 hiện còn 3 đôi tại kho. Giao HCMC hoả tốc 1-2 ngày là nhận được ạ!",
      botTime: "02:14 ICT",
      actionBadge: "02:14 夜间 1.8s 毫秒应答 · 转化促成",
      erpSyncedText: "库存锁定就绪 · 避免夜间买家跳失流失",
    },
  },
  {
    id: "ord_4",
    orderNumber: "ORD-SG-1092",
    buyerName: "Marcus Tan",
    location: "新加坡 (Jurong West)",
    amount: "S$ 148.00",
    currency: "SGD",
    type: "RECOVERED",
    typeLabel: "Singlish 极速召回",
    timeAgo: "刚刚",
    riskScore: 2,
    botDialogue: {
      buyerText: "Hi can PayNow anot? Need size 10 chopped before checkout leh.",
      buyerTime: "15:28 SGT",
      botText: "No problem Marcus! Size 10 chopped for you already, PayNow dynamic QR attached lah!",
      botTime: "15:28 SGT",
      actionBadge: "PayNow QR + Singlish 亲和召回 · USDC 瞬时入账",
      erpSyncedText: "Shopify SG #1092 已支付 (S$ 148.00) · NinjaVan 门到门配送",
    },
  },
];

export interface ScenarioAction {
  id: string;
  label: string;
  icon: "check" | "edit" | "cancel" | "card" | "package" | "truck" | "tag" | "bag" | "message" | "link" | "file";
  feedbackText: string;
  updatedRiskScore?: number;
  updatedIntent?: string;
}

export interface Scenario {
  id: string;
  tabLabel: string;
  buyerName: string;
  buyerPhone: string;
  avatarLetter: string;
  buyerMessage: string;
  buyerTime: string;
  botMessage: string;
  actions: ScenarioAction[];
  intent: string;
  language: string;
  languageCode: string;
  dialectName: string;
  riskScore: number;
  slangTokens: { token: string; desc: string }[];
  webhookStatus: string;
  solanaStatus: string;
  solanaFee: string;
  solanaDuration: string;
}

export const MOCK_TELEMETRY_SCENARIOS: Scenario[] = [
  {
    id: "cod_confirm",
    tabLabel: "印尼 COD 地址校验",
    buyerName: "Rizky Firmansyah",
    buyerPhone: "+62 812-9812-4412",
    avatarLetter: "R",
    botMessage:
      "Halo Kak Rizky! Pesanan COD sneaker #ID-9821 siap kami kirimkan ke Jl. Sudirman No. 12. Apakah alamat sudah sesuai kak?",
    buyerMessage:
      "Halo min, siap kirim. Tapi tolong tulis di paket depan Alfamart seberang masjid ya min, biar kurir ga nyasar.",
    buyerTime: "14:08 WIB",
    actions: [
      {
        id: "opt_confirm",
        label: "确认无误，今日发货",
        icon: "check",
        feedbackText: "买家确认地址准确，触发 WooCommerce 发货就绪状态",
        updatedRiskScore: 5,
        updatedIntent: "INTENT_COD_DISPATCH_CONFIRMED",
      },
      {
        id: "opt_edit",
        label: "补充更多地标细节",
        icon: "edit",
        feedbackText: "已向买家发送地标补充表单，同步录入运单备注",
        updatedRiskScore: 10,
        updatedIntent: "INTENT_COD_LANDMARK_ENRICHED",
      },
      {
        id: "opt_cancel",
        label: "申请取消该订单",
        icon: "cancel",
        feedbackText: "买家意向已变更，已自动释放库存并拦截仓库打包",
        updatedRiskScore: 95,
        updatedIntent: "INTENT_ORDER_CANCEL_REQUESTED",
      },
    ],
    intent: "INTENT_COD_DISPATCH_CONFIRM",
    language: "id_ID (99.8%)",
    languageCode: "ID",
    dialectName: "Bahasa Gaul (雅加达口语)",
    riskScore: 12,
    slangTokens: [
      { token: "min", desc: "Admin 缩写，印尼本土买家对掌柜/网购客服的亲切称呼" },
      { token: "ga nyasar", desc: "免得跑错/迷路 (tidak tersesat)" },
    ],
    webhookStatus: "WooCommerce #ID-9821 -> Landmark Appended (Success)",
    solanaStatus: "L1 Message Gas Finalized",
    solanaFee: "$0.00025 USDC",
    solanaDuration: "418ms",
  },
  {
    id: "abandoned_recovery",
    tabLabel: "15分钟弃购挽回",
    buyerName: "Siti Nurhaliza",
    buyerPhone: "+62 813-8821-9901",
    avatarLetter: "S",
    botMessage:
      "Hai Kak Siti! Keranjang belanja Anda di TokoSepatu masih tersimpan nih. Klik link untuk selesaikan pembayaran sebelum stok habis ya!",
    buyerMessage: "Oke min, sudah saya bayar barusan lewat QRIS ya!",
    buyerTime: "13:35 WIB",
    actions: [
      {
        id: "opt_card",
        label: "查验银行/网关入账",
        icon: "card",
        feedbackText: "Webhook 查验支付网关 QRIS 交易号: ID-QRIS-9921 已清算",
        updatedRiskScore: 0,
        updatedIntent: "INTENT_PAYMENT_VERIFIED",
      },
      {
        id: "opt_pkg",
        label: "安排加急打包",
        icon: "package",
        feedbackText: "已为该买家提升物流发货优先级至 PRIORITY_1",
        updatedRiskScore: 2,
        updatedIntent: "INTENT_FULFILLMENT_EXPEDITED",
      },
    ],
    intent: "INTENT_ABANDONED_CHECKOUT_RECOVERY",
    language: "id_ID (99.4%)",
    languageCode: "ID",
    dialectName: "Bahasa Formal + Slang",
    riskScore: 4,
    slangTokens: [
      { token: "QRIS", desc: "印尼国家统一标准快速响应码支付系统" },
      { token: "barusan", desc: "刚刚 / 就在方才" },
    ],
    webhookStatus: "Payment Gateway -> PAID_CONFIRMED (GMV: Rp 450.000)",
    solanaStatus: "Billing Credit Deducted (-1 Credit)",
    solanaFee: "$0.00025 USDC",
    solanaDuration: "392ms",
  },
  {
    id: "night_faq",
    tabLabel: "雅加达夜间口语咨询",
    buyerName: "Budi Santoso",
    buyerPhone: "+62 813-1102-5591",
    avatarLetter: "B",
    botMessage:
      "Halo Kak Budi! Ada yang bisa kami bantu seputar ukuran sepatu atau pengiriman ke Jabodetabek?",
    buyerMessage: "Bisa COD ga min ke Tangerang? Terus dapet diskon ongkir ga ya?",
    buyerTime: "23:14 WIB",
    actions: [
      {
        id: "opt_truck",
        label: "发送 COD 政策说明",
        icon: "truck",
        feedbackText: "已推送 Tangerang COD 物流时效与开箱验货指引",
        updatedRiskScore: 14,
        updatedIntent: "INTENT_COD_POLICY_DISPATCHED",
      },
      {
        id: "opt_tag",
        label: "发送 5k 运费满减券",
        icon: "tag",
        feedbackText: "动态发券 CODE: ONGKIR5K，转化率提升估算 +18%",
        updatedRiskScore: 8,
        updatedIntent: "INTENT_COUPON_OFFERED",
      },
    ],
    intent: "INTENT_LOGISTICS_COD_INQUIRY",
    language: "id_ID (98.9%)",
    languageCode: "ID",
    dialectName: "Informal Slang & Particle",
    riskScore: 18,
    slangTokens: [
      { token: "ongkir", desc: "Ongkos Kirim 缩写，指包裹运费" },
      { token: "dapet...ga ya", desc: "能不能拿到 / 有没有啊" },
    ],
    webhookStatus: "Quiet Hours Delay Check -> PASSED_USER_ACTIVE",
    solanaStatus: "State Verified (Finalized)",
    solanaFee: "$0.00025 USDC",
    solanaDuration: "440ms",
  },
  {
    id: "thai_query",
    tabLabel: "泰语语气词咨询",
    buyerName: "Somchai Prasert",
    buyerPhone: "+66 89-123-9988",
    avatarLetter: "S",
    botMessage: "สวัสดีครับ สนใจสอบถามไซส์หรือสีเพิ่มเติมไหมครับ?",
    buyerMessage: "มีไซส์ 42 สีขาวไหมครับ อยากได้ด่วนเลยครับผม",
    buyerTime: "11:15 ICT",
    actions: [
      {
        id: "opt_bag",
        label: "发送白色 42 码现货直达",
        icon: "bag",
        feedbackText: "Shopify 实时锁定库存 1 件，已生成一键结算直达链接",
        updatedRiskScore: 4,
        updatedIntent: "INTENT_INVENTORY_LOCKED_AND_OFFERED",
      },
      {
        id: "opt_msg",
        label: "转交曼谷本土客服坐席",
        icon: "message",
        feedbackText: "检测到极高购买意向，已指派给曼谷客服团队协同跟进",
        updatedRiskScore: 6,
        updatedIntent: "INTENT_HUMAN_HANDOVER_INITIATED",
      },
    ],
    intent: "INTENT_PRODUCT_INVENTORY_CHECK",
    language: "th_TH (99.9%)",
    languageCode: "TH",
    dialectName: "Bangkok Central Polite Particle",
    riskScore: 8,
    slangTokens: [
      { token: "ครับ / ครับผม", desc: "krub/krub-pom 泰语男性礼貌用语后缀，代表极高真实意向" },
    ],
    webhookStatus: "Shopify Storefront API -> Inventory Locked (Qty: 3)",
    solanaStatus: "Session Verified",
    solanaFee: "$0.00025 USDC",
    solanaDuration: "410ms",
  },
  {
    id: "singapore_singlish",
    tabLabel: "新加坡 Singlish 催付",
    buyerName: "Marcus Tan",
    buyerPhone: "+65 9123-4567",
    avatarLetter: "M",
    botMessage:
      "Hi Marcus! Notice your cart at SG Sneaker Lab is waiting. Free doorstep courier voucher applied lah, checkout before stock runs out: sglab.co/pay-771",
    buyerMessage: "Can PayNow bro? Any discount code leh? Chopped size 10 for me first anot?",
    buyerTime: "15:28 SGT",
    actions: [
      {
        id: "opt_paynow",
        label: "下发 PayNow 动态二维码与优惠券",
        icon: "card",
        feedbackText: "已向买家发送 PayNow 动态结账二维码 (已自动抵扣 S$15 折扣券)",
        updatedRiskScore: 2,
        updatedIntent: "INTENT_PAYNOW_QR_ISSUED",
      },
      {
        id: "opt_chope",
        label: "锁定新加坡西区仓唯一现货",
        icon: "package",
        feedbackText: "Shopify 锁定现货 Size 10 (Chope 60分钟保单防抢)",
        updatedRiskScore: 0,
        updatedIntent: "INTENT_STOCK_CHOPED_RESERVED",
      },
    ],
    intent: "INTENT_SINGAPORE_CART_CONVERSION",
    language: "en_SG (Singlish 99.8%)",
    languageCode: "SG",
    dialectName: "Singapore Colloquial English (Singlish)",
    riskScore: 2,
    slangTokens: [
      { token: "lah / leh", desc: "新加坡本土高频语气助词，增强亲和力与对话温度" },
      { token: "PayNow", desc: "新加坡国家级即时转账系统，对齐数字法币结算" },
      { token: "Chopped", desc: "新加坡俗语预先占位/锁定 (Reserve/Lock)" },
      { token: "anot", desc: "Singlish 句末疑问词 (or not?)" },
    ],
    webhookStatus: "Shopify SG Store -> Checkout Resumed (S$ 148.00)",
    solanaStatus: "L1 Message Finalized",
    solanaFee: "$0.00025 USDC",
    solanaDuration: "395ms",
  },
  {
    id: "malaysia_cod",
    tabLabel: "大马 COD 物流核验",
    buyerName: "Farah Nadia",
    buyerPhone: "+60 12-345 6789",
    avatarLetter: "F",
    botMessage:
      "Hai Sis Farah! Pesanan COD #MY-3310 dari KedaiSaya sudah siap. Boleh sahkan alamat penghantaran ya?",
    buyerMessage: "Boleh pos esok ke sis? Harap guna Pos Laju ya, tingkat 2 atas kedai roti tq!",
    buyerTime: "14:50 MYT",
    actions: [
      {
        id: "opt_poslaju",
        label: "同步 Pos Laju 特快面单与地标",
        icon: "truck",
        feedbackText: "WooCommerce 订单已追加地标备注并绑定 Pos Laju 快递单号",
        updatedRiskScore: 6,
        updatedIntent: "INTENT_POSLAJU_ENRICHED",
      },
      {
        id: "opt_cs",
        label: "大马吉隆坡客服坐席同步",
        icon: "message",
        feedbackText: "已将对话与特殊交待同步至雪兰莪仓储配送专员",
        updatedRiskScore: 4,
        updatedIntent: "INTENT_MY_DISPATCH_CONFIRMED",
      },
    ],
    intent: "INTENT_COD_DISPATCH_CONFIRM_MY",
    language: "ms_MY (99.6%)",
    languageCode: "MY",
    dialectName: "Bahasa Melayu Pasar & E-dagang",
    riskScore: 6,
    slangTokens: [
      { token: "sis", desc: "大马网购买家最常使用的亲近尊称" },
      { token: "Pos Laju", desc: "马来西亚国家级核心快递" },
      { token: "Boleh pos", desc: "可以发货，买家真实购买意向明确" },
    ],
    webhookStatus: "WooCommerce MY -> Landmark Attached (RM 189.00)",
    solanaStatus: "L1 Signature Verified",
    solanaFee: "$0.00025 USDC",
    solanaDuration: "402ms",
  },
  {
    id: "solana_proof",
    tabLabel: "链上结算凭证",
    buyerName: "Global Merchant Corp",
    buyerPhone: "+65 9123-4567",
    avatarLetter: "G",
    botMessage: "SolaFlow L1 Settlement Daemon: 每日 Credits 自动审计对账完毕。",
    buyerMessage: "已核验 10,000 笔 WhatsApp 催付凭据，链上时间戳与账本吻合。",
    buyerTime: "16:00 UTC",
    actions: [
      {
        id: "opt_link",
        label: "打开 Solana Explorer 验证",
        icon: "link",
        feedbackText: "查看 Devnet Block #291820491 签名凭据",
        updatedRiskScore: 0,
        updatedIntent: "INTENT_EXPLORER_VERIFIED",
      },
      {
        id: "opt_file",
        label: "导出审计对账单",
        icon: "file",
        feedbackText: "生成不可篡改 CSV 审计账本 (Merkle Proof 附带)",
        updatedRiskScore: 0,
        updatedIntent: "INTENT_LEDGER_EXPORTED",
      },
    ],
    intent: "INTENT_CHAIN_LEDGER_AUDIT",
    language: "en_US / System Protocol",
    languageCode: "EN",
    dialectName: "Deterministic Settlement Spec",
    riskScore: 0,
    slangTokens: [{ token: "USDC SPL", desc: "Solana 原生 SPL 代币标准，毫秒级确认" }],
    webhookStatus: "Ledger Immutable Merkle Root -> Stored",
    solanaStatus: "Solana Devnet Block #291820491 Finalized",
    solanaFee: "$0.00025 USDC",
    solanaDuration: "380ms",
  },
];

export interface CityNode {
  id: string;
  code: string;
  name: string;
  lat: number;
  lon: number;
  market: string;
  tag: string;
  metric: string;
}

export const MOCK_SEA_NODES: CityNode[] = [
  {
    id: "cgk",
    code: "CGK",
    name: "雅加达 (Jakarta)",
    lat: -6.2,
    lon: 106.85,
    market: "印尼 · +62",
    tag: "COD 地标校验 · Bahasa Gaul 俚语",
    metric: "99.4% 发货核验率",
  },
  {
    id: "sin",
    code: "SIN",
    name: "新加坡 (Singapore)",
    lat: 1.35,
    lon: 103.82,
    market: "区域枢纽 · +65",
    tag: "Solana Pay 结算 · Singlish 召回",
    metric: "418ms 原生结算",
  },
  {
    id: "bkk",
    code: "BKK",
    name: "曼谷 (Bangkok)",
    lat: 13.75,
    lon: 100.5,
    market: "泰国 · +66",
    tag: "PromptPay 扫码 · 15min 弃购挽回",
    metric: "18.4% 挽回转化",
  },
  {
    id: "mnl",
    code: "MNL",
    name: "马尼拉 (Manila)",
    lat: 14.6,
    lon: 120.98,
    market: "菲律宾 · +63",
    tag: "GCash 预检 · COD 防拒签保护",
    metric: "-6.2% 运费损耗",
  },
  {
    id: "sgn",
    code: "SGN",
    name: "胡志明市 (HCMC)",
    lat: 10.82,
    lon: 106.63,
    market: "越南 · +84",
    tag: "MoMo 直连 · 02:00 夜间咨询促单",
    metric: "< 3.2s 平均应答",
  },
  {
    id: "szx",
    code: "SZX",
    name: "深圳 (Shenzhen)",
    lat: 22.54,
    lon: 114.05,
    market: "跨境供应链发货港",
    tag: "Shopify/WooCommerce 毫秒同步",
    metric: "150ms Webhook 接入",
  },
];

export const MOCK_SEA_ROUTES: [string, string][] = [
  ["szx", "sin"],
  ["szx", "cgk"],
  ["szx", "bkk"],
  ["sin", "cgk"],
  ["sin", "mnl"],
  ["bkk", "sgn"],
];
