"use client";

import React, { useState } from "react";
import { CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, Terminal } from "lucide-react";
import { clsx } from "clsx";

interface Scenario {
  id: string;
  tabLabel: string;
  buyerName: string;
  buyerPhone: string;
  avatarLetter: string;
  buyerMessage: string;
  buyerTime: string;
  botMessage: string;
  interactiveOptions: string[];
  intent: string;
  language: string;
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
    interactiveOptions: ["✅ 确认无误，今日发货", "✏️ 补充更多地标细节", "❌ 申请取消该订单"],
    intent: "INTENT_COD_DISPATCH_CONFIRM",
    language: "id_ID (99.8%) // Bahasa Gaul",
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
    interactiveOptions: ["💳 查验银行/网关入账", "📦 安排加急打包"],
    intent: "INTENT_ABANDONED_CHECKOUT_RECOVERY",
    language: "id_ID (99.4%) // Bahasa Formal + Slang",
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
    interactiveOptions: ["🚚 发送 COD 政策说明", "🏷️ 发送 5k 运费满减券"],
    intent: "INTENT_LOGISTICS_COD_INQUIRY",
    language: "id_ID (98.9%) // Informal Slang",
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
    interactiveOptions: ["👟 发送白色 42 码现货直达", "💬 转交曼谷本土客服坐席"],
    intent: "INTENT_PRODUCT_INVENTORY_CHECK",
    language: "th_TH (99.9%) // Bangkok Central",
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
    id: "solana_proof",
    tabLabel: "链上结算凭证",
    buyerName: "Global Merchant Corp",
    buyerPhone: "+65 9123-4567",
    avatarLetter: "G",
    botMessage: "SolaFlow L1 Settlement Daemon: 每日 Credits 自动审计对账完毕。",
    buyerMessage: "已核验 10,000 笔 WhatsApp 催付凭据，链上时间戳与账本吻合。",
    buyerTime: "16:00 UTC",
    interactiveOptions: ["🔗 打开 Solana Explorer 验证", "📄 导出审计对账单"],
    intent: "INTENT_CHAIN_LEDGER_AUDIT",
    language: "en_US / System Protocol",
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
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === activeTab) || SCENARIOS[0];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSelectedOption(null);
  };

  return (
    <div className="w-full border border-[#E4E4E7] bg-white">
      {/* 顶部场景切换 Tab 栏 (发丝黑白) */}
      <div className="flex items-center overflow-x-auto border-b border-[#E4E4E7] bg-[#FAFAFA] p-1">
        {SCENARIOS.map((s) => {
          const isActive = s.id === activeTab;
          return (
            <button
              key={s.id}
              onClick={() => handleTabChange(s.id)}
              className={clsx(
                "px-3 py-2 text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-colors select-none cursor-pointer border",
                isActive
                  ? "bg-[#09090B] text-white border-[#09090B]"
                  : "bg-transparent text-[#71717A] border-transparent hover:text-[#09090B] hover:bg-white"
              )}
            >
              {s.tabLabel}
            </button>
          );
        })}
      </div>

      {/* 左右分屏对比控制台 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* 左视窗：真实 WhatsApp 手机端仿真视图 (5 栏宽) */}
        <div className="lg:col-span-5 p-5 border-b lg:border-b-0 lg:border-r border-[#E4E4E7] bg-[#FAFAFA]/50 flex flex-col justify-between">
          <div>
            {/* WhatsApp 顶部商业号标头 */}
            <div className="p-3 bg-white border border-[#E4E4E7] flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#09090B] text-white text-xs font-mono font-bold flex items-center justify-center">
                  {scenario.avatarLetter}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-medium text-[#09090B]">
                      {scenario.buyerName}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  </div>
                  <div className="text-[10px] font-mono text-[#71717A]">
                    {scenario.buyerPhone}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-[#059669] bg-[#059669]/10 px-2 py-0.5 border border-[#059669]/20">
                <span>OFFICIAL BIZ</span>
              </div>
            </div>

            {/* 对话气泡流 */}
            <div className="space-y-3">
              {/* Bot 消息 */}
              <div className="max-w-[88%] p-3 bg-white border border-[#E4E4E7] text-xs font-sans text-[#27272A] leading-relaxed">
                <div className="text-[9px] font-mono text-[#71717A] uppercase mb-1">
                  SolaFlow Assistant • {scenario.buyerTime}
                </div>
                {scenario.botMessage}
              </div>

              {/* 买家原声消息 */}
              <div className="ml-auto max-w-[88%] p-3 bg-[#09090B] text-white text-xs font-sans leading-relaxed">
                <div className="text-[9px] font-mono text-zinc-400 uppercase mb-1 flex items-center justify-between">
                  <span>Buyer Reply</span>
                  <span>{scenario.buyerTime}</span>
                </div>
                {scenario.buyerMessage}
              </div>

              {/* 买家选择的反馈 */}
              {selectedOption && (
                <div className="ml-auto max-w-[85%] p-2.5 bg-zinc-200 text-[#09090B] text-xs font-mono border border-zinc-400">
                  <div className="text-[9px] text-zinc-600 mb-0.5">Buyer Selected Action:</div>
                  {selectedOption}
                </div>
              )}
            </div>
          </div>

          {/* 仿真买家交互按钮胶囊 */}
          <div className="mt-5 pt-4 border-t border-[#E4E4E7]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-2 flex items-center justify-between">
              <span>Interactive Quick Actions (Click to Test)</span>
              <RefreshCw className="w-3 h-3 animate-spin text-[#71717A]" />
            </div>
            <div className="flex flex-col gap-1.5">
              {scenario.interactiveOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedOption(opt)}
                  className={clsx(
                    "w-full text-left p-2.5 text-xs font-mono border transition-all cursor-pointer flex items-center justify-between",
                    selectedOption === opt
                      ? "bg-[#09090B] text-white border-[#09090B]"
                      : "bg-white text-[#09090B] border-[#E4E4E7] hover:border-[#09090B]"
                  )}
                >
                  <span>{opt}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右视窗：SolaFlow Neural Engine 实时遥测分析视窗 (7 栏宽) */}
        <div className="lg:col-span-7 p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7] mb-5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#09090B]" />
                <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[#09090B]">
                  SolaFlow Neural Telemetry Console
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                <span className="text-[11px] font-mono text-[#059669]">LIVE TELEMETRY</span>
              </div>
            </div>

            {/* 遥测多维度卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="p-3 border border-[#E4E4E7] bg-[#FAFAFA]">
                <div className="text-[10px] font-mono text-[#71717A] uppercase mb-1">
                  Language & Dialect Classifier
                </div>
                <div className="text-xs font-mono font-semibold text-[#09090B]">
                  {scenario.language}
                </div>
              </div>

              <div className="p-3 border border-[#E4E4E7] bg-[#FAFAFA]">
                <div className="text-[10px] font-mono text-[#71717A] uppercase mb-1">
                  Classified Intent
                </div>
                <div className="text-xs font-mono font-semibold text-[#09090B]">
                  {scenario.intent}
                </div>
              </div>

              <div className="p-3 border border-[#E4E4E7] bg-[#FAFAFA]">
                <div className="text-[10px] font-mono text-[#71717A] uppercase mb-1">
                  COD Rejection Risk Score
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "text-sm font-mono font-bold",
                      scenario.riskScore > 50 ? "text-[#E11D48]" : "text-[#059669]"
                    )}
                  >
                    {scenario.riskScore} / 100
                  </span>
                  <span className="text-[10px] font-mono text-[#71717A]">
                    {scenario.riskScore > 50 ? "(高危拦截建议)" : "(极低拒签风险)"}
                  </span>
                </div>
              </div>

              <div className="p-3 border border-[#E4E4E7] bg-[#FAFAFA]">
                <div className="text-[10px] font-mono text-[#71717A] uppercase mb-1">
                  Solana L1 Settlement Finality
                </div>
                <div className="text-xs font-mono text-[#09090B] flex items-center justify-between">
                  <span>{scenario.solanaDuration}</span>
                  <span className="text-[10px] text-[#71717A]">Gas: {scenario.solanaFee}</span>
                </div>
              </div>
            </div>

            {/* 印尼俚语 / 语气词精准解构 */}
            <div className="p-4 border border-[#E4E4E7] mb-5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-2">
                Southeast Asia Slang & Particle Lexicon
              </div>
              <div className="space-y-2">
                {scenario.slangTokens.map((st, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-mono">
                    <span className="px-1.5 py-0.5 bg-[#F4F4F5] border border-[#E4E4E7] text-[#09090B] font-semibold">
                      {st.token}
                    </span>
                    <span className="text-[#71717A] text-xs pt-0.5">{st.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Webhook 同步状态 */}
            <div className="p-3 bg-[#FAFAFA] border border-[#E4E4E7] text-xs font-mono">
              <span className="text-[#71717A]">ECOMMERCE WEBHOOK: </span>
              <span className="text-[#09090B] font-semibold">{scenario.webhookStatus}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E4E4E7] flex items-center justify-between text-[11px] font-mono text-[#71717A]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
              <span>Deterministic Rule-Engine v1.2</span>
            </div>
            <span>Status: 200 OK (Telemetry Synced)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
