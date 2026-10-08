"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Terminal,
  Check,
  Edit3,
  X,
  CreditCard,
  Package,
  Truck,
  Tag,
  ShoppingBag,
  MessageSquare,
  ExternalLink,
  FileText,
  Sparkles,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import { gsap } from "gsap";

export interface ScenarioAction {
  id: string;
  label: string;
  icon: "check" | "edit" | "cancel" | "card" | "package" | "truck" | "tag" | "bag" | "message" | "link" | "file";
  feedbackText: string;
  updatedRiskScore?: number;
  updatedIntent?: string;
}

interface Scenario {
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

const SCENARIOS: Scenario[] = [
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

export const TelemetrySandbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("cod_confirm");
  const [selectedAction, setSelectedAction] = useState<ScenarioAction | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === activeTab) || SCENARIOS[0];

  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // GSAP 场景切换动效
  useEffect(() => {
    if (leftPaneRef.current && rightPaneRef.current) {
      gsap.fromTo(
        [leftPaneRef.current, rightPaneRef.current],
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.06 }
      );
    }
  }, [activeTab]);

  // GSAP 反馈泡泡动效
  useEffect(() => {
    if (feedbackRef.current && selectedAction) {
      gsap.fromTo(
        feedbackRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(1.7)" }
      );
    }
  }, [selectedAction]);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSelectedAction(null);
  };

  const handleSelectAction = (action: ScenarioAction) => {
    setSelectedAction(action);
  };

  const renderActionIcon = (icon: ScenarioAction["icon"]) => {
    const iconClass = "w-3.5 h-3.5 shrink-0";
    switch (icon) {
      case "check":
        return <Check className={clsx(iconClass, "text-emerald-500")} />;
      case "edit":
        return <Edit3 className={clsx(iconClass, "text-indigo-500")} />;
      case "cancel":
        return <X className={clsx(iconClass, "text-rose-500")} />;
      case "card":
        return <CreditCard className={clsx(iconClass, "text-emerald-500")} />;
      case "package":
        return <Package className={clsx(iconClass, "text-amber-500")} />;
      case "truck":
        return <Truck className={clsx(iconClass, "text-blue-500")} />;
      case "tag":
        return <Tag className={clsx(iconClass, "text-emerald-500")} />;
      case "bag":
        return <ShoppingBag className={clsx(iconClass, "text-purple-500")} />;
      case "message":
        return <MessageSquare className={clsx(iconClass, "text-indigo-500")} />;
      case "link":
        return <ExternalLink className={clsx(iconClass, "text-emerald-500")} />;
      case "file":
        return <FileText className={clsx(iconClass, "text-indigo-500")} />;
      default:
        return <Sparkles className={clsx(iconClass, "text-emerald-500")} />;
    }
  };

  const currentRiskScore = selectedAction?.updatedRiskScore ?? scenario.riskScore;
  const currentIntent = selectedAction?.updatedIntent ?? scenario.intent;

  return (
    <div className="w-full border border-zinc-200/90 rounded-2xl overflow-hidden bg-white shadow-xl shadow-zinc-950/[0.03]">
      {/* 顶部场景切换 Tab 栏 */}
      <div className="flex items-center overflow-x-auto border-b border-zinc-200/80 bg-zinc-50/80 p-2 gap-1.5 scrollbar-none">
        {SCENARIOS.map((s) => {
          const isActive = s.id === activeTab;
          return (
            <button
              key={s.id}
              onClick={() => handleTabChange(s.id)}
              className={clsx(
                "px-4 py-2 text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all select-none cursor-pointer rounded-xl border font-medium",
                isActive
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                  : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-900 hover:bg-white"
              )}
            >
              <span>{s.tabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 左右分屏对比控制台 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
        {/* 左视窗：真实 WhatsApp 手机端仿真视图 (5 栏宽) */}
        <div
          ref={leftPaneRef}
          className="lg:col-span-5 p-6 sm:p-7 border-b lg:border-b-0 lg:border-r border-zinc-200/80 bg-zinc-50/40 flex flex-col justify-between"
        >
          <div>
            {/* WhatsApp 顶部商业号标头 */}
            <div className="p-3.5 bg-white border border-zinc-200/80 rounded-xl flex items-center justify-between mb-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-mono font-bold flex items-center justify-center ring-2 ring-emerald-500/20">
                  {scenario.avatarLetter}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-900">
                      {scenario.buyerName}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50" />
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    {scenario.buyerPhone}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                <Zap className="w-2.5 h-2.5" />
                <span>OFFICIAL BIZ</span>
              </div>
            </div>

            {/* 对话气泡流 */}
            <div className="space-y-3">
              {/* Bot 消息 */}
              <div className="max-w-[88%] p-3.5 bg-white border border-zinc-200 rounded-xl text-xs font-sans text-zinc-700 leading-relaxed shadow-2xs">
                <div className="text-[9px] font-mono text-emerald-600 uppercase mb-1 font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>SolaFlow AI Assistant · {scenario.buyerTime}</span>
                </div>
                {scenario.botMessage}
              </div>

              {/* 买家原声消息 */}
              <div className="ml-auto max-w-[88%] p-3.5 bg-zinc-900 text-white rounded-xl text-xs font-sans leading-relaxed shadow-sm">
                <div className="text-[9px] font-mono text-zinc-400 uppercase mb-1 flex items-center justify-between">
                  <span className="text-emerald-400">Buyer Reply</span>
                  <span>{scenario.buyerTime}</span>
                </div>
                {scenario.buyerMessage}
              </div>

              {/* 买家选择的反馈 */}
              {selectedAction && (
                <div
                  ref={feedbackRef}
                  className="ml-auto max-w-[90%] p-3 bg-emerald-50 text-emerald-950 rounded-xl text-xs border border-emerald-200/80 shadow-2xs"
                >
                  <div className="text-[10px] font-mono text-emerald-700 font-semibold mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>执行动作反馈 · {selectedAction.label}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-900">
                    {selectedAction.feedbackText}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 仿真买家交互按钮胶囊 */}
          <div className="mt-5 pt-4 border-t border-zinc-200">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2 flex items-center justify-between">
              <span>交互场景动作模拟 (点击测试)</span>
              <span className="text-emerald-600 font-medium">Interactive Demo</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {scenario.actions.map((act) => {
                const isSelected = selectedAction?.id === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => handleSelectAction(act)}
                    className={clsx(
                      "w-full text-left p-2.5 text-xs font-mono rounded-lg border transition-all cursor-pointer flex items-center justify-between",
                      isSelected
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                        : "bg-white text-zinc-900 border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50/20"
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      {renderActionIcon(act.icon)}
                      <span className="font-medium">{act.label}</span>
                    </span>
                    <ArrowRight
                      className={clsx(
                        "w-3.5 h-3.5 transition-transform",
                        isSelected ? "translate-x-0.5 opacity-100 text-emerald-400" : "opacity-40"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右视窗：SolaFlow Neural Engine 实时遥测分析视窗 (7 栏宽) */}
        <div
          ref={rightPaneRef}
          className="lg:col-span-7 p-7 sm:p-8 bg-white flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-zinc-900 text-emerald-400">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-900">
                  SolaFlow 神经规则引擎实时遥测
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                <span className="text-[11px] font-mono font-medium text-zinc-600">LIVE TELEMETRY</span>
              </div>
            </div>

            {/* 遥测多维度卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1.5 flex items-center justify-between">
                  <span>多语言与方言分类</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                    {scenario.languageCode}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-zinc-900">
                  {scenario.language}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  {scenario.dialectName}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1.5">
                  识别意图分类 (Classified Intent)
                </div>
                <div className="text-xs font-mono font-bold text-indigo-700 truncate">
                  {currentIntent}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  置信度 99.8% · 零样本泛化
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1.5">
                  COD 拒签风险评分
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "text-base font-mono font-bold",
                      currentRiskScore > 50 ? "text-rose-600" : "text-emerald-600"
                    )}
                  >
                    {currentRiskScore} / 100
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {currentRiskScore > 50 ? "(高危拦截建议)" : "(极低拒签风险)"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1.5">
                  Solana 链上审计结算
                </div>
                <div className="text-xs font-mono text-zinc-900 flex items-center justify-between">
                  <span className="font-semibold text-emerald-600">{scenario.solanaDuration}</span>
                  <span className="text-[11px] text-zinc-500 font-mono">Gas: {scenario.solanaFee}</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 truncate">
                  {scenario.solanaStatus}
                </div>
              </div>
            </div>

            {/* 印尼俚语 / 语气词精准解构 */}
            <div className="p-4.5 rounded-xl border border-zinc-200/80 bg-white mb-6">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3 flex items-center justify-between">
                <span>东南亚俚语与本土虚词解析 (Slang Lexicon)</span>
                <span className="text-[10px] text-indigo-600 font-medium">NLP Parser v2.4</span>
              </div>
              <div className="space-y-2.5">
                {scenario.slangTokens.map((st, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200/80 text-zinc-900 font-bold text-[11px]">
                      {st.token}
                    </span>
                    <span className="text-zinc-600 text-xs pt-0.5 leading-relaxed">{st.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Webhook 同步状态 */}
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-mono flex items-center justify-between">
              <div>
                <span className="text-zinc-500">ECOMMERCE WEBHOOK: </span>
                <span className="text-zinc-900 font-semibold">{scenario.webhookStatus}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold">
                SYNCED
              </span>
            </div>
          </div>

          <div className="pt-5 border-t border-zinc-200/80 flex items-center justify-between text-[11px] font-mono text-zinc-500 mt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>确定性规则引擎 · v1.2</span>
            </div>
            <span className="text-emerald-700 font-medium">Status: 200 OK · 遥测就绪</span>
          </div>
        </div>
      </div>
    </div>
  );
};
