"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HeroProductDashboard } from "@/components/landing/hero-product-dashboard";
import { TelemetrySandbox } from "@/components/landing/telemetry-sandbox";
import { RoiCalculator } from "@/components/landing/roi-calculator";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Globe2,
} from "lucide-react";
import { clsx } from "clsx";

export default function LandingPage() {
  const [lang, setLang] = useState<"EN" | "ID" | "ZH">("ZH");

  const heroTitles = {
    ZH: {
      headline: "Autonomous WhatsApp Agents.\nSettled on Solana.",
      subhead:
        "专为东南亚跨境电商打造：待支付订单 15 分钟温和挽回，印尼 COD 订单发货前智能地标核验。官方 WhatsApp 商业 API 直连，USDC 零汇损即时结算。",
    },
    EN: {
      headline: "Autonomous WhatsApp Agents.\nSettled on Solana.",
      subhead:
        "Engineered for Southeast Asian cross-border e-commerce: 15-minute abandoned cart recovery and pre-dispatch COD address verification. Official WhatsApp API with instant USDC settlement.",
    },
    ID: {
      headline: "Asisten Pesanan WhatsApp Otonom.\nSelesai di Solana.",
      subhead:
        "Solusi cerdas untuk e-commerce Asia Tenggara: pemulihan keranjang belanja 15 menit dan verifikasi alamat COD pra-pengiriman. Terhubung ke API resmi WhatsApp dengan settlement USDC instan.",
    },
  };

  const t = heroTitles[lang];

  return (
    <div className="min-h-screen bg-white text-[#09090B] font-sans selection:bg-[#09090B] selection:text-white">
      {/* 顶部固定导航栏 (64px, 边框, 毛玻璃) */}
      <header className="sticky top-0 z-40 w-full h-16 border-b border-[#E4E4E7] bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 flex items-center justify-between">
          {/* 品牌标识与环境标识 */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 select-none">
              <span className="font-mono text-base font-bold tracking-tight text-[#09090B]">
                SolaFlow
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-[#09090B] text-white rounded">
                AI
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#71717A] border-l border-[#E4E4E7] pl-4">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#059669]" />
              <span>Devnet v1.1 · Meta BAA Verified</span>
            </div>
          </div>

          {/* 右侧：语言切换胶囊与行动链接 */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* 语言切换胶囊 */}
            <div className="inline-flex p-0.5 border border-[#E4E4E7] bg-[#FAFAFA] rounded-md">
              {(["EN", "ID", "ZH"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={clsx(
                    "px-2.5 py-1 text-[11px] font-mono transition-colors cursor-pointer rounded-sm",
                    lang === l
                      ? "bg-[#09090B] text-white"
                      : "text-[#71717A] hover:text-[#09090B]"
                  )}
                >
                  {l === "ZH" ? "中文" : l}
                </button>
              ))}
            </div>

            <Link href="/console/billing" className="inline-flex items-center justify-center border border-zinc-200 px-3 py-2 text-xs hover:bg-zinc-50 focus-visible:outline-2 hidden md:inline-flex">
                  Solana Pay
                </Link>

            <Link href="/console">
              <Button variant="outline" size="sm">
                商户工作台
              </Button>
            </Link>

            <Link href="/onboarding">
              <Button size="sm">
                免费接入
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full">
        {/* SECTION 1: HERO & LIVE PRODUCT WORKSPACE */}
        <section className="relative w-full border-b border-[#E4E4E7] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* 左侧文字与召唤 */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono text-[#71717A] border border-[#E4E4E7] px-2.5 py-1 bg-[#FAFAFA] rounded-md">
                <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>2026 SOUTHEAST ASIA E-COMMERCE INTELLIGENCE</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-tight text-[#09090B] leading-[1.08] whitespace-pre-line">
                {t.headline}
              </h1>

              <p className="text-base sm:text-lg text-[#27272A] font-sans leading-relaxed max-w-xl">
                {t.subhead}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a href="#sandbox">
                  <Button size="lg" className="h-11 px-6 text-xs bg-[#09090B] text-white hover:bg-zinc-800">
                    立即体验交互沙盒
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
                <Link href="/console/billing" className="inline-flex items-center justify-center border border-zinc-200 px-3 py-2 text-xs hover:bg-zinc-50 focus-visible:outline-2 h-11 px-6 text-xs">
                  体验 Solana Pay
                </Link>
                <Link href="/onboarding">
                  <Button variant="ghost" size="lg" className="h-11 px-4 text-xs text-zinc-600 hover:text-zinc-900">
                    商户 6 步入驻向导 →
                  </Button>
                </Link>
              </div>
            </div>

            {/* 右侧：商户控制台实时交互预览视窗 */}
            <div className="lg:col-span-6 w-full">
              <HeroProductDashboard />
            </div>
          </div>

          {/* 4 维核心业务数据行 */}
          <div className="w-full border-t border-[#E4E4E7] bg-[#FAFAFA]">
            <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7]">
              <div className="p-6">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-[#09090B]">
                  +18.4%
                </div>
                <div className="text-xs font-mono text-[#71717A] mt-1 uppercase">
                  待支付弃购挽回率
                </div>
              </div>

              <div className="p-6">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-[#09090B]">
                  -6.2%
                </div>
                <div className="text-xs font-mono text-[#71717A] mt-1 uppercase">
                  COD 拒签退运损失
                </div>
              </div>

              <div className="p-6">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-[#09090B]">
                  &lt; 3.2s
                </div>
                <div className="text-xs font-mono text-[#71717A] mt-1 uppercase">
                  夜间买家平均响应
                </div>
              </div>

              <div className="p-6">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-[#09090B]">
                  $0.00025
                </div>
                <div className="text-xs font-mono text-[#71717A] mt-1 uppercase">
                  链上单笔结算手续费
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: 出海业务交互演练台 (WORKFLOW SIMULATOR) */}
        <section id="sandbox" className="w-full border-b border-[#E4E4E7] py-20 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-emerald-600 font-bold uppercase tracking-wider">
                02 · INTERACTIVE WORKFLOW SIMULATOR
              </div>
              <h2 className="text-2xl sm:text-3xl font-mono font-bold text-[#09090B] uppercase">
                出海业务交互演练台 (买家 WhatsApp 视窗 × 自动化规则流转)
              </h2>
              <p className="text-xs sm:text-sm text-[#71717A] font-mono">
                点击不同出海业务场景，体验东南亚本土多语言原声解析、COD 地标校准与订单全流程实时流转
              </p>
            </div>

            <TelemetrySandbox />
          </div>
        </section>

        {/* SECTION 3: 5 大企业级核心能力与业务基建 */}
        <section className="w-full border-b border-[#E4E4E7] py-20 px-4 sm:px-8 bg-[#FAFAFA]/40">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-indigo-600 font-bold uppercase tracking-wider">
                03 · ENTERPRISE CAPABILITIES & INFRASTRUCTURE
              </div>
              <h2 className="text-2xl sm:text-3xl font-mono font-bold text-[#09090B] uppercase">
                5 大企业级核心能力与业务基建
              </h2>
              <p className="text-xs sm:text-sm text-[#71717A] font-mono">
                专为东南亚多国跨境生态打造的高可用自动化服务矩阵与基础设施
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* 卡片 1 (7 栏) */}
              <div className="md:col-span-7 p-6 sm:p-8 border border-[#E4E4E7] rounded-xl bg-white flex flex-col justify-between hover:border-emerald-500/50 transition-colors shadow-xs">
                <div>
                  <div className="text-xs font-mono text-emerald-700 font-semibold mb-4">01 · NLP & DIALECT</div>
                  <h3 className="text-xl font-mono font-bold text-[#09090B] mb-2">
                    东南亚多语言与印尼俚语深度解析
                  </h3>
                  <p className="text-sm text-[#27272A] leading-relaxed">
                    不仅掌握标准印尼语（Bahasa Indonesia），更精准识别雅加达本土口语缩写（Bahasa Gaul，如 <em>min, ongkir, ga nyasar</em>）与泰语礼貌语气助词（<em>krub/ka</em>）。
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#E4E4E7] flex items-center justify-between text-xs font-mono text-[#71717A]">
                  <span className="text-emerald-700 font-medium">印尼语 • 泰语 • 英语 • 越南语</span>
                  <span className="font-semibold text-[#09090B]">99.8% 意图分类率</span>
                </div>
              </div>

              {/* 卡片 2 (5 栏) */}
              <div className="md:col-span-5 p-6 sm:p-8 border border-[#E4E4E7] rounded-xl bg-white flex flex-col justify-between hover:border-indigo-500/50 transition-colors shadow-xs">
                <div>
                  <div className="text-xs font-mono text-indigo-700 font-semibold mb-4">02 · SOLANA PAY</div>
                  <h3 className="text-xl font-mono font-bold text-[#09090B] mb-2">
                    Solana Pay 毫秒级原生结算
                  </h3>
                  <p className="text-sm text-[#27272A] leading-relaxed">
                    0 传统跨国信用卡 3% 货币兑换与通道手续费损耗。原生 USDC 充值即时到账，单笔手续费低至 $0.00025。
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#E4E4E7] flex items-center justify-between text-xs font-mono text-indigo-600 font-semibold">
                  <span>418ms Finality</span>
                  <span>$0.00025 Gas Fee</span>
                </div>
              </div>

              {/* 卡片 3 (4 栏) */}
              <div className="md:col-span-4 p-6 sm:p-8 border border-[#E4E4E7] rounded-xl bg-white hover:border-zinc-400 transition-colors shadow-xs">
                <div className="text-xs font-mono text-[#71717A] mb-4">03 · STORE WEBHOOK</div>
                <h3 className="text-lg font-mono font-bold text-[#09090B] mb-2">
                  全渠道电商店铺秒级直连
                </h3>
                <p className="text-sm text-[#27272A] leading-relaxed">
                  WooCommerce 与 Shopify 官方 Webhook 150ms 极速接入，自动同步订单变动与买家地址。
                </p>
              </div>

              {/* 卡片 4 (4 栏) */}
              <div className="md:col-span-4 p-6 sm:p-8 border border-[#E4E4E7] rounded-xl bg-white hover:border-rose-400 transition-colors shadow-xs">
                <div className="text-xs font-mono text-rose-600 font-semibold mb-4">04 · COD SHIELD</div>
                <h3 className="text-lg font-mono font-bold text-[#09090B] mb-2">
                  COD 拒签发货前防护盾
                </h3>
                <p className="text-sm text-[#27272A] leading-relaxed">
                  结合历史高拒签热力图与空号探测，发货前一键要求补充真实地标，大幅截流往返物流亏损。
                </p>
              </div>

              {/* 卡片 5 (4 栏) */}
              <div className="md:col-span-4 p-6 sm:p-8 border border-[#E4E4E7] rounded-xl bg-white hover:border-amber-400 transition-colors shadow-xs">
                <div className="text-xs font-mono text-amber-600 font-semibold mb-4">05 · HUMAN TAKEOVER</div>
                <h3 className="text-lg font-mono font-bold text-[#09090B] mb-2">
                  人机协同无感接管工作台
                </h3>
                <p className="text-sm text-[#27272A] leading-relaxed">
                  买家情绪波动或议价纠纷时自动暂停 AI 规则，零延迟平滑转交商户人工坐席，保障买家信任。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: 跨境 ROI 利润恢复计算器 */}
        <section className="w-full border-b border-[#E4E4E7] py-20 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-emerald-600 font-bold uppercase tracking-wider">
                04 · PROFIT RECOVERY MODEL
              </div>
              <h2 className="text-2xl sm:text-3xl font-mono font-bold text-[#09090B] uppercase">
                跨境出海 ROI 动态利润计算器
              </h2>
              <p className="text-xs sm:text-sm text-[#71717A] font-mono">
                基于月订单量与平均客单价，实时测算挽回未支付 GMV 与减少的 COD 物流损耗
              </p>
            </div>

            <RoiCalculator />
          </div>
        </section>

        {/* SECTION 5: 商业转化与 SOLANA PAY 入口 */}
        <section className="w-full py-20 px-4 sm:px-8 bg-[#FAFAFA]">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-mono font-bold text-[#09090B] uppercase">
              立即接入您的首个出海店铺
            </h2>
            <p className="text-sm sm:text-base text-[#71717A] font-mono max-w-xl mx-auto">
              完成 6 步商户初始化向导，即刻获得 100 免费 Credits 体验额度，无需绑定信用卡。
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/onboarding">
                <Button size="lg" className="h-12 px-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  立即免费接入 (Claim 100 Credits)
                </Button>
              </Link>
              <Link href="/console/billing" className="inline-flex items-center justify-center border border-zinc-200 px-3 py-2 text-xs hover:bg-zinc-50 focus-visible:outline-2 h-12 px-8 text-xs">
                  Solana Pay Devnet 充值体验
                </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#E4E4E7] bg-white py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#71717A] gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#09090B]">SolaFlow AI</span>
            <span>• Meta BAA & GDPR Compliant</span>
            <span>• Southeast Asia E-Commerce Platform</span>
          </div>
          <div>
            <span>Markets: ID • TH • VN • PH • MY • SG · Copyright © 2026</span>
          </div>
        </div>
      </footer>

      {/* Solana Pay 充值模态框 */}
    </div>
  );
}
