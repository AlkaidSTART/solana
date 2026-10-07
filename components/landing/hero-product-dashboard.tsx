"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
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
];

export const HeroProductDashboard: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>("ord_1");
  const currentOrder = LIVE_ORDERS.find((o) => o.id === selectedId) || LIVE_ORDERS[0];

  return (
    <div className="w-full bg-white border border-zinc-200/90 rounded-2xl shadow-xl shadow-zinc-950/[0.04] overflow-hidden text-left transition-all">
      {/* 视窗顶部标题栏 (Window Header) */}
      <div className="w-full bg-zinc-50/80 border-b border-zinc-200/80 px-4 sm:px-6 py-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {/* Mac 风格三色圆点 */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 inline-block" />
          </div>
          <div className="h-3.5 w-px bg-zinc-200 mx-1" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="font-semibold text-zinc-900 tracking-tight">SolaFlow Live Ops Console</span>
            <span className="text-zinc-400 hidden sm:inline">·</span>
            <span className="text-zinc-500 hidden sm:inline font-mono text-[11px]">TokoSepatu_ID (Shopify)</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-2 py-0.5 rounded-md font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Meta BAA
          </span>
          <span className="text-zinc-500 hidden md:inline">Solana 418ms</span>
        </div>
      </div>

      {/* 主展示区：宽幅布局与充裕留白 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
        {/* 左侧：实时履约流 (4 栏) */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-zinc-200/80 bg-zinc-50/40 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-0.5">
              <span className="font-semibold uppercase tracking-wider text-zinc-900">实时出海订单流</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Live Feed
              </span>
            </div>

            <div className="space-y-2.5">
              {LIVE_ORDERS.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={clsx(
                      "w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer text-xs",
                      isSelected
                        ? "bg-white border-zinc-900/40 shadow-sm ring-1 ring-zinc-900/10"
                        : "bg-white/70 border-zinc-200/70 hover:border-zinc-300 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1.5">
                      <span className="font-bold text-zinc-900">{item.orderNumber}</span>
                      <span className="text-zinc-400">{item.timeAgo}</span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-zinc-800 truncate max-w-[140px]">{item.buyerName}</span>
                      <span className="font-mono font-semibold text-zinc-900">{item.amount}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={clsx(
                          "text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 font-medium",
                          item.type === "COD_VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : item.type === "RECOVERED"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                            : "bg-amber-50 text-amber-700 border border-amber-200/60"
                        )}
                      >
                        {item.type === "COD_VERIFIED" && <ShieldCheck className="w-2.5 h-2.5" />}
                        {item.type === "RECOVERED" && <TrendingUp className="w-2.5 h-2.5" />}
                        {item.type === "AUTO_INQUIRY" && <MessageSquare className="w-2.5 h-2.5" />}
                        {item.typeLabel}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        风险分: {item.riskScore}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200/70 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
            <span>点击任意订单切换模拟</span>
            <span className="text-emerald-700 font-medium">99.8% 意图分类</span>
          </div>
        </div>

        {/* 右侧：WhatsApp 对话与智能流转 (7 栏) */}
        <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between bg-white space-y-5">
          <div className="space-y-4">
            {/* 对话视窗头部 */}
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  {currentOrder.buyerName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                    <span>{currentOrder.buyerName}</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-medium">
                      WhatsApp Verified
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                    <Globe2 className="w-3 h-3 text-zinc-400" />
                    <span>{currentOrder.location}</span>
                  </div>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <div className="text-zinc-500">{currentOrder.orderNumber}</div>
                <div className="font-bold text-zinc-900 text-sm mt-0.5">{currentOrder.amount}</div>
              </div>
            </div>

            {/* 对话气泡展示 */}
            <div className="space-y-3.5 py-1 text-xs">
              {/* 买家气泡 */}
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="bg-zinc-100/80 text-zinc-900 px-3.5 py-2.5 rounded-2xl rounded-tl-sm border border-zinc-200/60 leading-relaxed text-xs">
                  <p className="font-sans">{currentOrder.botDialogue.buyerText}</p>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 mt-1 ml-1">
                  买家原声 · {currentOrder.botDialogue.buyerTime}
                </span>
              </div>

              {/* AI Agent 回复气泡 */}
              <div className="flex flex-col items-end ml-auto max-w-[85%]">
                <div className="bg-emerald-50 text-emerald-950 px-3.5 py-2.5 rounded-2xl rounded-tr-sm border border-emerald-200/80 leading-relaxed text-xs">
                  <div className="text-[10px] font-mono text-emerald-700 font-semibold mb-1 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    SolaFlow AI Agent
                  </div>
                  <p className="font-sans">{currentOrder.botDialogue.botText}</p>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 mt-1 mr-1">
                  自动化送达 · 耗时 1.2s · {currentOrder.botDialogue.botTime}
                </span>
              </div>
            </div>
          </div>

          {/* 底部自动化同步卡片 */}
          <div className="space-y-2.5 pt-3 border-t border-zinc-200/80">
            <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{currentOrder.botDialogue.actionBadge}</span>
              </div>
              <span className="text-zinc-400 text-[11px] shrink-0">150ms Webhook</span>
            </div>

            <div className="text-[11px] font-mono text-zinc-500 flex items-center justify-between px-1">
              <span className="truncate">{currentOrder.botDialogue.erpSyncedText}</span>
              <span className="text-zinc-900 font-semibold shrink-0 ml-2">USDC 结算 $0.00025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
