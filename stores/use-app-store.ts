import { create } from "zustand";
import type { SupportedLocale } from "@/lib/i18n";
import {
  MOCK_STORES,
  MOCK_CURRENT_STORE_ID,
  MOCK_CREDITS,
  MOCK_ORDERS,
  MOCK_CONVERSATIONS,
  MOCK_ACTIVE_CONVERSATION_ID,
  MOCK_WORKFLOWS,
  MOCK_KNOWLEDGE_ITEMS,
  MOCK_LEDGER_HISTORY,
} from "@/mock";

export type OrderLanguage =
  | "id_ID"
  | "th_TH"
  | "en_US"
  | "en_SG"
  | "ms_MY"
  | "vi_VN"
  | "fil_PH";

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
  language: OrderLanguage;
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
  language: OrderLanguage;
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
  enSg?: string;
  ms?: string;
  vi?: string;
  fil?: string;
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
  locale: SupportedLocale;
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
  setLocale: (locale: SupportedLocale) => void;
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
  currentStoreId: MOCK_CURRENT_STORE_ID,
  stores: MOCK_STORES,
  locale: "zh_CN",
  credits: MOCK_CREDITS,
  orders: MOCK_ORDERS,
  conversations: MOCK_CONVERSATIONS,
  activeConversationId: MOCK_ACTIVE_CONVERSATION_ID,
  workflows: MOCK_WORKFLOWS,
  knowledgeItems: MOCK_KNOWLEDGE_ITEMS,
  ledgerHistory: MOCK_LEDGER_HISTORY,

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
