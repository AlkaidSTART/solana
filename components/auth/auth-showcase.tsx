"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Bot,
  User,
} from "lucide-react";
import { TopoMesh } from "@/components/landing/topo-mesh";
import { useAppStore } from "@/stores/use-app-store";

export function AuthShowcase() {
  const { locale } = useAppStore();
  const [activeTab, setActiveTab] = useState<"recovery" | "cod">("recovery");

  const isEn = locale === "en_US";
  const isId = locale === "id_ID";

  const t = {
    badge: isEn
      ? "CROSS-BORDER AUTOMATION OS"
      : isId
      ? "SISTEM OTOMATISASI E-COMMERCE"
      : "东南亚跨境电商智能自动化引擎",
    statusLive: isEn ? "META BAA COMPLIANT // 99.99% UPTIME" : isId ? "META BAA COMPLIANT // AKTIF" : "META BAA 官方直连认证 · 运行正常",
    headline: isEn
      ? "Turn Abandoned Carts into Revenue Across Southeast Asia."
      : isId
      ? "Ubah Keranjang Belanja Jadi Pesanan Nyata di Asia Tenggara."
      : "智能挽回夜间弃购，发货前精准拦截 COD 拒签损失。",
    subhead: isEn
      ? "Zero-friction WhatsApp automation powered by Solana Pay instant merchant settlement. Designed specifically for Indonesia, Thailand, Vietnam, and the Philippines."
      : isId
      ? "Otomatisasi WhatsApp tanpa hambatan didukung penyelesaian instan Solana Pay. Didesain khusus untuk Indonesia, Thailand, Vietnam, dan Filipina."
      : "专为出海印尼、泰国、越南与菲律宾的跨境电商独立站与品牌设计。官方商业 API 直连，毫秒级响应，USDC 零汇损即时结算。",
    tabRecovery: isEn ? "15-Min Cart Recovery" : isId ? "Pemulihan 15 Menit" : "15分钟温和催付",
    tabCod: isEn ? "COD Pre-dispatch Check" : isId ? "Verifikasi COD" : "COD 发货前核验",
    telemetryTag: isEn ? "TELEMETRY INSIGHTS" : isId ? "TELEMETRI REAL-TIME" : "实时智能遥测",
    quote: isEn
      ? "“During Ramadan mega-sale, SolaFlow recovered 340+ abandoned midnight carts automatically. Our COD return-to-origin dropped by 18%.”"
      : isId
      ? "“Saat lonjakan Ramadan, SolaFlow memulihkan 340+ pesanan tengah malam secara otomatis. Retur COD kami turun drastis hingga 18%.”"
      : "“在印尼大促期间，SolaFlow 为我们自动挽回了 340+ 笔夜间放弃支付订单，COD 妥投率大幅提升，退件损失下降了 18%。”",
    author: isEn ? "Jakarta Direct-to-Consumer Apparel Brand" : isId ? "Brand Fashion D2C Jakarta" : "雅加达出海时尚品牌 · TokoSepatu",
    authorRole: isEn ? "Chief Operations Officer" : isId ? "Chief Operations Officer" : "运营负责人与联合创始人",
    metric1Val: "+18.4%",
    metric1Lbl: isEn ? "Cart Recovery Rate" : isId ? "Tingkat Pemulihan" : "待支付弃购挽回率",
    metric2Val: "-6.2%",
    metric2Lbl: isEn ? "COD RTS Return Loss" : isId ? "Penurunan Retur COD" : "COD 拒签与退货损耗",
    metric3Val: "< 3.2s",
    metric3Lbl: isEn ? "Midnight Response SLA" : isId ? "Respon Tengah Malam" : "夜间买家咨询响应",
    metric4Val: "400ms",
    metric4Lbl: isEn ? "USDC Settlement Velocity" : isId ? "Settlement Solana" : "Solana Pay 结算耗时",
  };

  return (
    <div className="relative w-full h-full min-h-[640px] flex flex-col justify-between p-8 xl:p-12 bg-zinc-950 text-white overflow-hidden select-none border-r border-zinc-800">
      {/* 3D 拓扑地形单色网格背景 */}
      <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
        <TopoMesh className="w-full h-full" />
      </div>

      {/* 极简发丝线建筑网格微底纹 */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none" 
        style={{
          backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} 
      />

      {/* 顶部微 HUD */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-zinc-800 bg-zinc-900/80 text-[10px] font-mono tracking-wider text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t.badge}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.statusLive}</span>
          </div>
        </div>

        {/* 标语区 */}
        <div className="space-y-2 pt-2">
          <h2 className="text-2xl xl:text-3xl font-mono font-bold tracking-tight text-white leading-tight">
            {t.headline}
          </h2>
          <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-xl">
            {t.subhead}
          </p>
        </div>
      </div>

      {/* 中间核心：WhatsApp 交互与 AI 遥测模拟卡片 */}
      <div className="relative z-10 my-6 space-y-3">
        {/* 仿真 Tab 切换 */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("recovery")}
            className={`text-xs font-mono px-3 py-1 transition-colors cursor-pointer border ${
              activeTab === "recovery"
                ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold"
                : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
          >
            {t.tabRecovery}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cod")}
            className={`text-xs font-mono px-3 py-1 transition-colors cursor-pointer border ${
              activeTab === "cod"
                ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold"
                : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
          >
            {t.tabCod}
          </button>
        </div>

        {/* 仿真视窗 */}
        <div className="border border-zinc-800 bg-zinc-900/90 backdrop-blur-md p-4 space-y-4">
          {/* 会话顶部信息 */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                WA
              </div>
              <div>
                <div className="text-zinc-200 font-medium flex items-center gap-1.5">
                  <span>SolaFlow Order Concierge</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 fill-emerald-400/20" />
                </div>
                <div className="text-[10px] text-zinc-500">
                  {activeTab === "recovery" ? "+62 812-9842-xxxx (Jakarta)" : "+62 878-3104-xxxx (Bandung)"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
              <Clock className="w-3 h-3" />
              <span>10:24 AM (WIB)</span>
            </div>
          </div>

          {/* 会话气泡 */}
          {activeTab === "recovery" ? (
            <div className="space-y-3 font-mono text-xs">
              {/* Bot 催付消息 */}
              <div className="flex gap-2 max-w-[90%]">
                <div className="w-5 h-5 rounded-sm bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 mt-0.5">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="p-2.5 bg-zinc-800/80 border border-zinc-700 text-zinc-200 text-[11px] leading-relaxed">
                  <p>Halo Kak Budi! Pesanan sneakers <strong>Air Obsidian 42</strong> Anda masih tersimpan di keranjang.</p>
                  <p className="mt-1 text-zinc-400 text-[10px]">Stok tersisa 2 pasang. Selesaikan sekarang untuk mendapatkan free ongkir Jakarta hari ini.</p>
                </div>
              </div>

              {/* 买家回复 */}
              <div className="flex gap-2 max-w-[90%] ml-auto justify-end">
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-[11px] leading-relaxed">
                  <p>Siap Gan, kirim link QRIS pembayarannya ya! Langsung transfer sekarang.</p>
                </div>
                <div className="w-5 h-5 rounded-sm bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 mt-0.5">
                  <User className="w-3 h-3" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {/* Bot COD 核验 */}
              <div className="flex gap-2 max-w-[90%]">
                <div className="w-5 h-5 rounded-sm bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 mt-0.5">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="p-2.5 bg-zinc-800/80 border border-zinc-700 text-zinc-200 text-[11px] leading-relaxed">
                  <p>Halo Sis Rina! Konfirmasi COD #ID-9821 senilai Rp 280.000 ke <strong>Jl. Tebet Barat Dalam No. 14</strong>.</p>
                  <p className="mt-1 text-zinc-400 text-[10px]">Apakah penerima ada di rumah besok siang untuk serah terima paket kurir J&T?</p>
                </div>
              </div>

              {/* 买家确认 */}
              <div className="flex gap-2 max-w-[90%] ml-auto justify-end">
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-[11px] leading-relaxed">
                  <p>Ada Kak, patokannya depan Masjid Al-Huda ya. Uang pas sudah siap.</p>
                </div>
                <div className="w-5 h-5 rounded-sm bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 mt-0.5">
                  <User className="w-3 h-3" />
                </div>
              </div>
            </div>
          )}

          {/* 遥测雷达面板 */}
          <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-3 gap-2 text-[10px] font-mono">
            <div className="p-2 bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 block">AI INTENT</span>
              <span className="text-emerald-400 font-semibold">
                {activeTab === "recovery" ? "CART_RECOVERY" : "COD_VERIFIED"}
              </span>
            </div>
            <div className="p-2 bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 block">RISK SCORE</span>
              <span className="text-zinc-200 font-semibold">
                {activeTab === "recovery" ? "LOW (0.04)" : "PASS (0.08)"}
              </span>
            </div>
            <div className="p-2 bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 block">SETTLEMENT</span>
              <span className="text-zinc-200 font-semibold">Solana L1 400ms</span>
            </div>
          </div>
        </div>

        {/* 关键商业指标 4 列条 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
          <div className="p-2.5 border border-zinc-800 bg-zinc-900/60">
            <div className="text-lg font-bold text-white">{t.metric1Val}</div>
            <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{t.metric1Lbl}</div>
          </div>
          <div className="p-2.5 border border-zinc-800 bg-zinc-900/60">
            <div className="text-lg font-bold text-emerald-400">{t.metric2Val}</div>
            <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{t.metric2Lbl}</div>
          </div>
          <div className="p-2.5 border border-zinc-800 bg-zinc-900/60">
            <div className="text-lg font-bold text-white">{t.metric3Val}</div>
            <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{t.metric3Lbl}</div>
          </div>
          <div className="p-2.5 border border-zinc-800 bg-zinc-900/60">
            <div className="text-lg font-bold text-zinc-200">{t.metric4Val}</div>
            <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{t.metric4Lbl}</div>
          </div>
        </div>
      </div>

      {/* 底部信任引用与跨国节点 */}
      <div className="relative z-10 pt-4 border-t border-zinc-800 space-y-3 font-mono">
        <blockquote className="text-xs text-zinc-300 italic leading-relaxed">
          {t.quote}
        </blockquote>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-zinc-400 gap-2">
          <div>
            <span className="text-white font-semibold">{t.author}</span>
            <span className="text-zinc-500 mx-1.5">/</span>
            <span>{t.authorRole}</span>
          </div>

          <div className="flex items-center gap-3 text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-500" />
              <span>CGK · 8ms</span>
            </span>
            <span>•</span>
            <span>BKK · 14ms</span>
            <span>•</span>
            <span>SIN · 2ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
