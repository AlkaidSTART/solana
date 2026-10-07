import { create } from "zustand";

export interface StoreInfo {
  id: string;
  name: string;
  platform: "WooCommerce" | "Shopify";
  currency: string;
  timezone: string;
  status: "connected" | "warning" | "disconnected";
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  storeId: string;
  customerName: string;
  customerPhone: string;
  amountLocal: string;
  amountUsd: string;
  type: "ABANDONED_CHECKOUT" | "COD";
  status: "PENDING" | "RECOVERED" | "COD_VERIFIED" | "COD_REJECTED" | "CANCELLED";
  language: "id_ID" | "th_TH" | "en_US";
  createdAt: string;
  originalAddress?: string;
  modifiedAddress?: string;
  riskScore?: number; // 0-100
  steps: {
    title: string;
    timestamp: string;
    completed: boolean;
    active?: boolean;
    note?: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: "buyer" | "agent" | "system";
  text: string;
  translationZh?: string;
  translationEn?: string;
  timestamp: string;
  slangTokens?: { token: string; explanation: string }[];
}

export interface Conversation {
  id: string;
  customerName: string;
  customerPhone: string;
  countryCode: string;
  language: "id_ID" | "th_TH" | "en_US";
  orderId?: string;
  unread: boolean;
  isHumanTakeover: boolean;
  windowExpiresIn: string; // e.g. "18h 42m"
  lastMessage: string;
  lastTimestamp: string;
  sentiment: "normal" | "urgent" | "angry";
  messages: ChatMessage[];
}

export interface WorkflowRule {
  id: string;
  code: string;
  name: string;
  description: string;
  enabled: boolean;
  version: string;
  triggerDelay: string;
  languages: string[];
  quietHours: string;
  maxFrequency: string;
}

export interface KnowledgeItem {
  id: string;
  category: "FAQ" | "PRODUCT" | "LOGISTICS";
  zh: string;
  idGaul: string;
  en: string;
  th: string;
  status: "PUBLISHED" | "PENDING_REVIEW" | "DRAFT";
  lastUpdated: string;
}

export interface LedgerTransaction {
  id: string;
  type: "TOPUP_USDC" | "CONSUMPTION" | "TRIAL_GRANT";
  amountUsdc?: string;
  creditsDelta: number;
  balanceAfter: number;
  solanaTx?: string;
  timestamp: string;
  description: string;
}

interface AppState {
  currentStoreId: string;
  stores: StoreInfo[];
  locale: "zh_CN" | "en_US" | "id_ID";
  credits: {
    available: number;
    reserved: number;
    trial: number;
  };
  orders: OrderItem[];
  conversations: Conversation[];
  activeConversationId: string;
  workflows: WorkflowRule[];
  knowledgeItems: KnowledgeItem[];
  ledgerHistory: LedgerTransaction[];

  // Actions
  setStoreId: (id: string) => void;
  setLocale: (locale: "zh_CN" | "en_US" | "id_ID") => void;
  topupCredits: (usdc: number, credits: number, txHash: string) => void;
  toggleHumanTakeover: (conversationId: string) => void;
  sendChatMessage: (conversationId: string, text: string) => void;
  approveCodOrder: (orderId: string) => void;
  rejectCodOrder: (orderId: string) => void;
  markRecoveredOrder: (orderId: string) => void;
  addOrder: (order: OrderItem) => void;
  toggleWorkflow: (workflowId: string) => void;
  rollbackWorkflow: (workflowId: string, targetVersion: string) => void;
  updateKnowledgeItem: (id: string, updates: Partial<KnowledgeItem>) => void;
  addKnowledgeItem: (item: KnowledgeItem) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentStoreId: "store_id_tokosepatu",
  stores: [
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
  ],
  locale: "zh_CN",
  credits: {
    available: 8420,
    reserved: 120,
    trial: 0,
  },
  orders: [
    {
      id: "ord_9821",
      orderNumber: "ID-9821",
      storeId: "store_id_tokosepatu",
      customerName: "Rizky Firmansyah",
      customerPhone: "+62 812-9812-4412",
      amountLocal: "Rp 389.000",
      amountUsd: "$24.62",
      type: "COD",
      status: "PENDING",
      language: "id_ID",
      createdAt: "10 分钟前",
      originalAddress: "Jl. Sudirman No. 12, RT 02 / RW 04, Jakarta Selatan",
      modifiedAddress: "Jl. Sudirman No. 12, depan Alfamart seberang Masjid Nurul Iman",
      riskScore: 28,
      steps: [
        { title: "订单创建 (COD)", timestamp: "14:02 WIB", completed: true },
        { title: "WhatsApp 确认模板送达", timestamp: "14:04 WIB", completed: true },
        { title: "买家回复补充地标说明", timestamp: "14:08 WIB", completed: true, active: true },
        { title: "商户核验发货", timestamp: "待处理", completed: false },
      ],
    },
    {
      id: "ord_9820",
      orderNumber: "ID-9820",
      storeId: "store_id_tokosepatu",
      customerName: "Siti Nurhaliza",
      customerPhone: "+62 813-8821-9901",
      amountLocal: "Rp 450.000",
      amountUsd: "$28.48",
      type: "ABANDONED_CHECKOUT",
      status: "RECOVERED",
      language: "id_ID",
      createdAt: "45 分钟前",
      steps: [
        { title: "购物车弃购事件生成", timestamp: "13:20 WIB", completed: true },
        { title: "15 分钟温和挽回送达", timestamp: "13:35 WIB", completed: true },
        { title: "买家点击直接付款链接", timestamp: "13:41 WIB", completed: true },
        { title: "网关支付成功通知", timestamp: "13:42 WIB", completed: true },
      ],
    },
    {
      id: "ord_9818",
      orderNumber: "ID-9818",
      storeId: "store_id_tokosepatu",
      customerName: "Agus Pratama",
      customerPhone: "+62 856-1200-3311",
      amountLocal: "Rp 720.000",
      amountUsd: "$45.56",
      type: "COD",
      status: "COD_REJECTED",
      language: "id_ID",
      createdAt: "2 小时前",
      originalAddress: "Jl. Merdeka No. 99, Surabaya (历史高拒签地)",
      modifiedAddress: "号码多次空号未回复",
      riskScore: 84,
      steps: [
        { title: "COD 订单生成", timestamp: "12:10 WIB", completed: true },
        { title: "WhatsApp 自动核验无响应", timestamp: "12:40 WIB", completed: true },
        { title: "高危风控标记截流", timestamp: "13:10 WIB", completed: true },
      ],
    },
    {
      id: "ord_9815",
      orderNumber: "TH-4102",
      storeId: "store_th_bkkfashion",
      customerName: "Somchai Prasert",
      customerPhone: "+66 89-123-9988",
      amountLocal: "฿ 1,290",
      amountUsd: "$36.85",
      type: "ABANDONED_CHECKOUT",
      status: "RECOVERED",
      language: "th_TH",
      createdAt: "3 小时前",
      steps: [
        { title: "待支付订单触发", timestamp: "11:00 ICT", completed: true },
        { title: "泰语优惠模板送达", timestamp: "11:15 ICT", completed: true },
        { title: "买家询问运费优惠并支付", timestamp: "11:32 ICT", completed: true },
      ],
    },
  ],
  conversations: [
    {
      id: "chat_01",
      customerName: "Rizky Firmansyah",
      customerPhone: "+62 812-9812-4412",
      countryCode: "+62",
      language: "id_ID",
      orderId: "ord_9821",
      unread: true,
      isHumanTakeover: false,
      windowExpiresIn: "22h 15m",
      lastMessage: "Min, bisa ganti patokan depan Alfamart ga ya?",
      lastTimestamp: "14:08 WIB",
      sentiment: "normal",
      messages: [
        {
          id: "m1",
          sender: "agent",
          text: "Halo Kak Rizky! Terima kasih sudah memesan di TokoSepatu_ID. Apakah pesanan COD sepatu sneaker ukuran 42 siap kami kirimkan ke Jl. Sudirman?",
          translationZh: "你好 Rizky！感谢在 TokoSepatu 下单。您的 42 码球鞋 COD 订单可以发往 Jl. Sudirman 吗？",
          timestamp: "14:04 WIB",
        },
        {
          id: "m2",
          sender: "buyer",
          text: "Halo min, siap kirim. Tapi tolong tulis di paket depan Alfamart seberang masjid ya min, biar kurir ga nyasar.",
          translationZh: "客服好，可以发。但请在包裹上写上在清真寺对面的 Alfamart 便利店前，免得快递员迷路。",
          timestamp: "14:08 WIB",
          slangTokens: [
            { token: "min", explanation: "印尼网购俚语，缩写自 Admin，意为客服/掌柜" },
            { token: "ga nyasar", explanation: "免得迷路 / 不要跑错地址" },
          ],
        },
      ],
    },
    {
      id: "chat_02",
      customerName: "Budi Santoso",
      customerPhone: "+62 813-1102-5591",
      countryCode: "+62",
      language: "id_ID",
      unread: false,
      isHumanTakeover: true,
      windowExpiresIn: "14h 02m",
      lastMessage: "Bisa kurangin ongkir ga min? Kemahalan.",
      lastTimestamp: "13:45 WIB",
      sentiment: "urgent",
      messages: [
        {
          id: "m3",
          sender: "agent",
          text: "Halo Kak Budi, pesanan Anda masih menunggu pembayaran nih. Butuh bantuan?",
          translationZh: "你好 Budi，您的订单仍在等待付款。需要帮助吗？",
          timestamp: "13:30 WIB",
        },
        {
          id: "m4",
          sender: "buyer",
          text: "Bisa kurangin ongkir ga min? Kemahalan ongkir ke Papua.",
          translationZh: "客服能减免运费吗？去巴布亚的运费太贵了。",
          timestamp: "13:45 WIB",
          slangTokens: [
            { token: "ongkir", explanation: "Ongkos Kirim 缩写，意为邮费/运费" },
            { token: "ga", explanation: "tidak/nggak 缩写，意为不/能不能" },
          ],
        },
      ],
    },
    {
      id: "chat_03",
      customerName: "Nong Nat",
      customerPhone: "+66 89-123-4567",
      countryCode: "+66",
      language: "th_TH",
      unread: false,
      isHumanTakeover: false,
      windowExpiresIn: "19h 30m",
      lastMessage: "มีไซส์ 38 สีขาวไหมครับ?",
      lastTimestamp: "12:15 ICT",
      sentiment: "normal",
      messages: [
        {
          id: "m5",
          sender: "buyer",
          text: "มีไซส์ 38 สีขาวไหมครับ?",
          translationZh: "请问 38 码白色还有现货吗？",
          timestamp: "12:15 ICT",
        },
        {
          id: "m6",
          sender: "agent",
          text: "สวัสดีครับ ไซส์ 38 สีขาวมีพร้อมส่งครับ สามารถกดสั่งซื้อได้เลยครับผม",
          translationZh: "您好，38 码白色有现货可直接发货，您可以直接下单哦！",
          timestamp: "12:16 ICT",
        },
      ],
    },
  ],
  activeConversationId: "chat_01",
  workflows: [
    {
      id: "wf_01",
      code: "WF_RECOVERY_ABANDONED",
      name: "15 分钟待支付订单温和挽回",
      description: "在买家弃购后 15 分钟静默期触发，若订单未付款且在白昼时段，自动下发多语言官方模板并附带动态直付链接",
      enabled: true,
      version: "v1.2",
      triggerDelay: "15 分钟",
      languages: ["id_ID", "th_TH", "en_US"],
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
      languages: ["id_ID", "en_US"],
      quietHours: "21:30 ~ 08:30 (免打扰保护)",
      maxFrequency: "单订单最多 1 次，逾期 12h 触发风控提醒",
    },
  ],
  knowledgeItems: [
    {
      id: "kb_01",
      category: "LOGISTICS",
      zh: "通常在付款后 24-48 小时内发货，雅加达地区 2-3 天送达，外岛 5-7 天。",
      idGaul: "Pengiriman 1-2 hari kerja ya kak. Khusus Jabodetabek 2-3 harian nyampe, luar pulau 5-7 hari.",
      en: "Orders are shipped within 24-48h. Jabodetabek takes 2-3 days, outer islands take 5-7 days.",
      th: "จัดส่งภายใน 24-48 ชม. กรุงเทพฯ และปริมณฑล 2-3 วัน ต่างจังหวัด 5-7 วันครับ",
      status: "PUBLISHED",
      lastUpdated: "2026-10-06",
    },
    {
      id: "kb_02",
      category: "FAQ",
      zh: "支持货到付款 (COD)，请在快递派送时保持手机畅通并准备好零钱。",
      idGaul: "Bisa COD kok kak! Pas kurir dateng pastiin nomor aktif & siapin uang pas ya kak.",
      en: "Cash on Delivery (COD) is supported! Please ensure your phone is reachable and have exact cash ready.",
      th: "รองรับการเก็บเงินปลายทาง (COD) ครับ โปรดเปิดมือถือรอรับสายขนส่งและเตรียมเงินพอดีนะครับ",
      status: "PUBLISHED",
      lastUpdated: "2026-10-05",
    },
  ],
  ledgerHistory: [
    {
      id: "tx_01",
      type: "TOPUP_USDC",
      amountUsdc: "100.00 USDC",
      creditsDelta: 11000,
      balanceAfter: 8420,
      solanaTx: "4zHHs...9vKp1 (Solana Devnet)",
      timestamp: "2026-10-05 16:32 WIB",
      description: "Solana Pay 快捷充值 (Growth 优惠档位)",
    },
    {
      id: "tx_02",
      type: "CONSUMPTION",
      creditsDelta: -580,
      balanceAfter: 7840,
      timestamp: "2026-10-06 23:59 WIB",
      description: "每日 WhatsApp 智能交互与自动化消息结算",
    },
    {
      id: "tx_03",
      type: "TRIAL_GRANT",
      creditsDelta: 100,
      balanceAfter: 100,
      timestamp: "2026-10-01 10:00 WIB",
      description: "商户入驻 6 步激活向导赠送试用额度",
    },
  ],

  setStoreId: (id) => set({ currentStoreId: id }),
  setLocale: (locale) => set({ locale }),
  topupCredits: (usdc, credits, txHash) =>
    set((state) => {
      const newBalance = state.credits.available + credits;
      const newTx: LedgerTransaction = {
        id: `tx_${Date.now()}`,
        type: "TOPUP_USDC",
        amountUsdc: `${usdc}.00 USDC`,
        creditsDelta: credits,
        balanceAfter: newBalance,
        solanaTx: `${txHash.slice(0, 6)}...${txHash.slice(-4)} (Solana Devnet)`,
        timestamp: "刚刚 (Just now)",
        description: `Solana Pay 充值入账 (+${credits} Credits)`,
      };
      return {
        credits: { ...state.credits, available: newBalance },
        ledgerHistory: [newTx, ...state.ledgerHistory],
      };
    }),
  toggleHumanTakeover: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, isHumanTakeover: !c.isHumanTakeover } : c
      ),
    })),
  sendChatMessage: (conversationId, text) =>
    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const newMsg: ChatMessage = {
          id: `m_${Date.now()}`,
          sender: "agent",
          text,
          translationZh: text,
          timestamp: "刚刚",
        };
        return {
          ...c,
          messages: [...c.messages, newMsg],
          lastMessage: text,
          lastTimestamp: "刚刚",
        };
      }),
    })),
  approveCodOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "COD_VERIFIED",
              steps: [
                ...o.steps.slice(0, 3),
                { title: "商户已批准核验发货", timestamp: "刚刚", completed: true },
              ],
            }
          : o
      ),
    })),
  rejectCodOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "COD_REJECTED",
              steps: [
                ...o.steps.slice(0, 3),
                { title: "商户驳回高危订单", timestamp: "刚刚", completed: true },
              ],
            }
          : o
      ),
    })),
  markRecoveredOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "RECOVERED",
              steps: [
                ...o.steps,
                { title: "买家完成补付 (GMV Recovered)", timestamp: "刚刚", completed: true },
              ],
            }
          : o
      ),
    })),
  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),
  toggleWorkflow: (workflowId) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId ? { ...w, enabled: !w.enabled } : w
      ),
    })),
  rollbackWorkflow: (workflowId, targetVersion) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId ? { ...w, version: targetVersion } : w
      ),
    })),
  updateKnowledgeItem: (id, updates) =>
    set((state) => ({
      knowledgeItems: state.knowledgeItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  addKnowledgeItem: (item) =>
    set((state) => ({
      knowledgeItems: [item, ...state.knowledgeItems],
    })),
}));
