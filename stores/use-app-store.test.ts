import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/stores/use-app-store";
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
  MOCK_TEMPLATES,
  createMockOrder,
} from "@/mock";

describe("useAppStore & mock decoupling", () => {
  beforeEach(() => {
    // Reset store state back to mock baseline before each test
    useAppStore.setState({
      currentStoreId: MOCK_CURRENT_STORE_ID,
      stores: [...MOCK_STORES],
      locale: "zh_CN",
      credits: { ...MOCK_CREDITS },
      orders: [...MOCK_ORDERS],
      conversations: [...MOCK_CONVERSATIONS],
      activeConversationId: MOCK_ACTIVE_CONVERSATION_ID,
      workflows: [...MOCK_WORKFLOWS],
      knowledgeItems: [...MOCK_KNOWLEDGE_ITEMS],
      ledgerHistory: [...MOCK_LEDGER_HISTORY],
    });
  });

  describe("Initial State Decoupling", () => {
    it("loads initial store and storeId from mock data", () => {
      const state = useAppStore.getState();
      expect(state.currentStoreId).toBe(MOCK_CURRENT_STORE_ID);
      expect(state.stores).toEqual(MOCK_STORES);
      expect(state.stores.length).toBeGreaterThan(0);
    });

    it("loads initial credits from mock data", () => {
      const state = useAppStore.getState();
      expect(state.credits).toEqual(MOCK_CREDITS);
    });

    it("loads initial orders, conversations and workflows from mock data", () => {
      const state = useAppStore.getState();
      expect(state.orders).toEqual(MOCK_ORDERS);
      expect(state.conversations).toEqual(MOCK_CONVERSATIONS);
      expect(state.workflows).toEqual(MOCK_WORKFLOWS);
      expect(state.knowledgeItems).toEqual(MOCK_KNOWLEDGE_ITEMS);
      expect(state.ledgerHistory).toEqual(MOCK_LEDGER_HISTORY);
    });
  });

  describe("Mock Templates & Helper Functions", () => {
    it("provides mock message templates with multiple language variants", () => {
      expect(MOCK_TEMPLATES.length).toBe(8);
      const idTemplate = MOCK_TEMPLATES.find((t) => t.language === "id_ID");
      expect(idTemplate).toBeDefined();
      expect(idTemplate?.status).toBe("APPROVED");
    });

    it("generates random valid mock orders via createMockOrder", () => {
      const codOrder = createMockOrder("COD");
      expect(codOrder.type).toBe("COD");
      expect(codOrder.status).toBe("PENDING");
      expect(codOrder.orderNumber).toMatch(/^ID-\d{4}$/);
      expect(codOrder.steps.length).toBe(2);

      const abandonedOrder = createMockOrder("ABANDONED_CHECKOUT");
      expect(abandonedOrder.type).toBe("ABANDONED_CHECKOUT");
      expect(abandonedOrder.status).toBe("PENDING");
    });
  });

  describe("Store Actions", () => {
    it("updates currentStoreId via setStoreId", () => {
      useAppStore.getState().setStoreId("store_sg_sneakers");
      expect(useAppStore.getState().currentStoreId).toBe("store_sg_sneakers");
    });

    it("updates locale via setLocale", () => {
      useAppStore.getState().setLocale("en_US");
      expect(useAppStore.getState().locale).toBe("en_US");
    });

    it("adds a new order via addOrder", () => {
      const newOrder = createMockOrder("COD");
      useAppStore.getState().addOrder(newOrder);

      const orders = useAppStore.getState().orders;
      expect(orders[0]).toEqual(newOrder);
      expect(orders.length).toBe(MOCK_ORDERS.length + 1);
    });

    it("approves COD order via approveCodOrder", () => {
      const targetId = "ord_9821";
      useAppStore.getState().approveCodOrder(targetId);

      const order = useAppStore.getState().orders.find((o) => o.id === targetId);
      expect(order?.status).toBe("COD_VERIFIED");
      const lastStep = order?.steps[order.steps.length - 1];
      expect(lastStep?.title).toBe("商户已批准核验发货");
      expect(lastStep?.completed).toBe(true);
    });

    it("rejects COD order via rejectCodOrder", () => {
      const targetId = "ord_9821";
      useAppStore.getState().rejectCodOrder(targetId);

      const order = useAppStore.getState().orders.find((o) => o.id === targetId);
      expect(order?.status).toBe("COD_REJECTED");
      const lastStep = order?.steps[order.steps.length - 1];
      expect(lastStep?.title).toBe("商户驳回高危订单");
    });

    it("marks recovered order via markRecoveredOrder", () => {
      const targetId = "ord_9821";
      useAppStore.getState().markRecoveredOrder(targetId);

      const order = useAppStore.getState().orders.find((o) => o.id === targetId);
      expect(order?.status).toBe("RECOVERED");
    });

    it("toggles human takeover via toggleHumanTakeover", () => {
      const targetId = "chat_01";
      const before = useAppStore.getState().conversations.find((c) => c.id === targetId)?.isHumanTakeover;
      useAppStore.getState().toggleHumanTakeover(targetId);
      const after = useAppStore.getState().conversations.find((c) => c.id === targetId)?.isHumanTakeover;
      expect(after).toBe(!before);
    });

    it("appends chat message via sendChatMessage", () => {
      const targetId = "chat_01";
      const testMsg = "Hello, your order is on the way.";
      useAppStore.getState().sendChatMessage(targetId, testMsg);

      const conv = useAppStore.getState().conversations.find((c) => c.id === targetId);
      expect(conv?.lastMessage).toBe(testMsg);
      const lastMessage = conv?.messages[conv.messages.length - 1];
      expect(lastMessage?.text).toBe(testMsg);
      expect(lastMessage?.sender).toBe("agent");
    });

    it("toggles workflow rule via toggleWorkflow", () => {
      const targetId = "wf_01";
      const before = useAppStore.getState().workflows.find((w) => w.id === targetId)?.enabled;
      useAppStore.getState().toggleWorkflow(targetId);
      const after = useAppStore.getState().workflows.find((w) => w.id === targetId)?.enabled;
      expect(after).toBe(!before);
    });

    it("rollbacks workflow version via rollbackWorkflow", () => {
      const targetId = "wf_01";
      useAppStore.getState().rollbackWorkflow(targetId, "v1.0");
      const wf = useAppStore.getState().workflows.find((w) => w.id === targetId);
      expect(wf?.version).toBe("v1.0");
    });

    it("updates knowledge item via updateKnowledgeItem", () => {
      const targetId = "kb_01";
      useAppStore.getState().updateKnowledgeItem(targetId, {
        zh: "Updated ZH content",
      });
      const item = useAppStore.getState().knowledgeItems.find((k) => k.id === targetId);
      expect(item?.zh).toBe("Updated ZH content");
    });

    it("adds knowledge item via addKnowledgeItem", () => {
      const newItem = {
        id: "kb_new",
        category: "FAQ" as const,
        zh: "全新常见问题解答",
        idGaul: "FAQ Baru",
        en: "Brand new FAQ",
        th: "คำถามที่พบบ่อยใหม่",
        status: "DRAFT" as const,
        lastUpdated: "2026-10-08",
      };
      useAppStore.getState().addKnowledgeItem(newItem);
      const items = useAppStore.getState().knowledgeItems;
      expect(items[0]).toEqual(newItem);
    });

    it("tops up credits and adds ledger transaction via topupCredits", () => {
      const initialCredits = useAppStore.getState().credits.available;
      const initialTxCount = useAppStore.getState().ledgerHistory.length;

      useAppStore.getState().topupCredits(50, 5500, "5abcdef1234567890abcdef9999");

      const state = useAppStore.getState();
      expect(state.credits.available).toBe(initialCredits + 5500);
      expect(state.ledgerHistory.length).toBe(initialTxCount + 1);
      const latestTx = state.ledgerHistory[0];
      expect(latestTx.type).toBe("TOPUP_USDC");
      expect(latestTx.creditsDelta).toBe(5500);
      expect(latestTx.amountUsdc).toBe("50.00 USDC");
    });
  });
});
