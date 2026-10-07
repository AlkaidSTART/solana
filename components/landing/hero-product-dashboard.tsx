"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Zap,
  Globe2,
} from "lucide-react";
import { clsx } from "clsx";

interface FeedOrder {
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

const LIVE_ORDERS: FeedOrder[] = [
  {
    id: "ord_1",
    orderNumber: "ORD-ID-9821",
    buyerName: "Rizky Firmansyah",
    location: "雅加达南区 (Jakarta Selatan)",
    amount: "Rp 349.000",
    currency: "IDR",
    type: "COD_VERIFIED",
    typeLabel: "COD 发货前核验通过",
    timeAgo: "1 分钟前",
    riskScore: 6,
    botDialogue: {
      buyerText: "Halo min, tolong di paket tulis depan Alfamart seberang masjid ya min, biar kurir ga nyasar.",
      buyerTime: "14:08 WIB",
      botText: "Siap Kak Rizky! Alamat sudah kami lengkapi dengan patokan Alfamart. Paket segera dikirim sore ini ya!",
      botTime: "14:08 WIB",
      actionBadge: "地标自动校准 · J&T 物流面单同步",
      erpSyncedText: "WooCommerce #9821 状态已变更为: 发货就绪 (COD Verified)",
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
    typeLabel: "15 分钟弃购温和挽回",
    timeAgo: "3 分钟前",
    riskScore: 2,
    botDialogue: {
      buyerText: "สวัสดีครับ มีโค้ดส่วนลดค่าส่งไหมครับ กำลังจะชำระเงิน",
      buyerTime: "14:05 ICT",
      botText: "สวัสดีครับคุณ Somchai! มอบส่วนลดพิเศษ 10% ให้ทันที กดลิงก์นี้เพื่อชำระเงินได้เลยครับ ขอบคุณครับ",
      botTime: "14:05 ICT",
      actionBadge: "动态结账优惠券已发放 · QRIS 扫码支付",
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
];

export const HeroProductDashboard: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>("ord_1");
  const currentOrder = LIVE_ORDERS.find((o) => o.id === selectedId) || LIVE_ORDERS[0];

  return (
    <div className="w-full bg-white border border-[#E4E4E7] rounded-xl shadow-lg shadow-zinc-200/50 overflow-hidden flex flex-col text-left">
      {/* 视窗企业级控制栏 (Topbar) */}
      <div className="w-full bg-[#FAFAFA] border-b border-[#E4E4E7] px-4 py-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="font-semibold text-[#09090B]">SolaFlow Live Ops</span>
          </div>
          <span className="text-[#A1A1AA] hidden sm:inline">|</span>
          <span className="text-[#71717A] hidden sm:inline">TokoSepatu_ID (Shopify Connected)</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Meta BAA Active
          </span>
          <span className="text-[#71717A] hidden md:inline">418ms Finality</span>
        </div>
      </div>

      {/* 主展示区：左侧订单流 + 右侧 WhatsApp 对话视窗 */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[360px]">
        {/* 左侧：实时履约流 (5 栏) */}
        <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-[#E4E4E7] bg-[#FAFAFA]/40 p-3 sm:p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] px-1">
              <span className="font-semibold uppercase tracking-wider text-[#09090B]">实时订单履约流</span>
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Live Feed
              </span>
            </div>

            <div className="space-y-2">
              {LIVE_ORDERS.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={clsx(
                      "w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer",
                      isSelected
                        ? "bg-white border-zinc-400 shadow-xs ring-1 ring-zinc-300"
                        : "bg-white/80 border-[#E4E4E7] hover:border-zinc-300 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="font-bold text-[#09090B]">{item.orderNumber}</span>
                      <span className="text-[#71717A]">{item.timeAgo}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-[#27272A] truncate max-w-[120px]">{item.buyerName}</span>
                      <span className="font-mono font-semibold text-[#09090B]">{item.amount}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={clsx(
                          "text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1",
                          item.type === "COD_VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.type === "RECOVERED"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        )}
                      >
                        {item.type === "COD_VERIFIED" && <ShieldCheck className="w-2.5 h-2.5" />}
                        {item.type === "RECOVERED" && <TrendingUp className="w-2.5 h-2.5" />}
                        {item.type === "AUTO_INQUIRY" && <MessageSquare className="w-2.5 h-2.5" />}
                        {item.typeLabel}
                      </span>
                      <span className="text-[10px] font-mono text-[#71717A]">
                        风险分: {item.riskScore}/100
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 底部指标提示 */}
          <div className="pt-2 border-t border-[#E4E4E7] text-[11px] font-mono text-[#71717A] flex items-center justify-between">
            <span>点击切换模拟不同出海场景</span>
            <span className="text-emerald-700 font-semibold">99.8% 意图分类</span>
          </div>
        </div>

        {/* 右侧：WhatsApp 对话与自动化处理卡片 (7 栏) */}
        <div className="md:col-span-7 p-4 sm:p-5 flex flex-col justify-between bg-white space-y-4">
          <div className="space-y-3">
            {/* 对话卡片头部 */}
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  {currentOrder.buyerName.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#09090B] flex items-center gap-1.5">
                    <span>{currentOrder.buyerName}</span>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                      WhatsApp Verified
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#71717A] flex items-center gap-1">
                    <Globe2 className="w-3 h-3" />
                    <span>{currentOrder.location}</span>
                  </div>
                </div>
              </div>

              <div className="text-right font-mono text-[11px] text-[#71717A]">
                <div>{currentOrder.orderNumber}</div>
                <div className="font-semibold text-[#09090B]">{currentOrder.amount}</div>
              </div>
            </div>

            {/* 对话气泡区 */}
            <div className="space-y-2.5 pt-1 text-xs">
              {/* 买家气泡 */}
              <div className="flex flex-col items-start max-w-[88%]">
                <div className="bg-[#F4F4F5] text-[#18181B] p-2.5 rounded-lg rounded-tl-none border border-[#E4E4E7] leading-relaxed">
                  <p className="font-sans">{currentOrder.botDialogue.buyerText}</p>
                </div>
                <span className="text-[10px] font-mono text-[#71717A] mt-1 ml-1">
                  买家原声 · {currentOrder.botDialogue.buyerTime}
                </span>
              </div>

              {/* AI Agent 回复气泡 */}
              <div className="flex flex-col items-end ml-auto max-w-[88%]">
                <div className="bg-emerald-50/80 text-emerald-950 p-2.5 rounded-lg rounded-tr-none border border-emerald-200 leading-relaxed">
                  <div className="text-[10px] font-mono text-emerald-700 font-semibold mb-0.5 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    SolaFlow AI Agent (自动化规则触发)
                  </div>
                  <p className="font-sans">{currentOrder.botDialogue.botText}</p>
                </div>
                <span className="text-[10px] font-mono text-[#71717A] mt-1 mr-1">
                  已送达 · 耗时 1.2s · {currentOrder.botDialogue.botTime}
                </span>
              </div>
            </div>
          </div>

          {/* 底部业务状态同步标签 */}
          <div className="space-y-2 pt-2 border-t border-[#E4E4E7]">
            <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-md p-2 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentOrder.botDialogue.actionBadge}</span>
              </div>
              <span className="text-[#71717A] text-[10px]">Webhook 150ms 响应</span>
            </div>

            <div className="text-[11px] font-mono text-[#71717A] flex items-center justify-between px-1">
              <span>{currentOrder.botDialogue.erpSyncedText}</span>
              <span className="text-[#09090B] font-semibold">Solana USDC $0.00025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
