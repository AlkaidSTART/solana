"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HeroProductDashboard } from "@/components/landing/hero-product-dashboard";
import { TelemetrySandbox } from "@/components/landing/telemetry-sandbox";
import { RoiCalculator } from "@/components/landing/roi-calculator";
import { SolanaPayModal } from "@/components/billing/solana-pay-modal";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";

type LandingLang = "ZH" | "EN" | "SG" | "ID" | "MY" | "TH" | "VI" | "PH";

const LANDING_LANGS = [
  { code: "ZH", label: "中文", flag: "🇨🇳" },
  { code: "EN", label: "EN", flag: "🌐" },
  { code: "SG", label: "SG (Singlish)", flag: "🇸🇬" },
  { code: "ID", label: "ID (Bahasa)", flag: "🇮🇩" },
  { code: "MY", label: "MY (Melayu)", flag: "🇲🇾" },
  { code: "TH", label: "TH (ไทย)", flag: "🇹🇭" },
  { code: "VI", label: "VI (Tiếng Việt)", flag: "🇻🇳" },
  { code: "PH", label: "PH (Filipino)", flag: "🇵🇭" },
] as const;

export default function LandingPage() {
  const [lang, setLang] = useState<LandingLang>("ZH");
  const [payModalOpen, setPayModalOpen] = useState(false);

  const heroTitles: Record<LandingLang, { headline: string; subhead: string; badge: string }> = {
    ZH: {
      headline: "Autonomous WhatsApp Agents.\nSettled on Solana.",
      subhead:
        "专为东南亚跨境电商打造：待支付订单 15 分钟温和挽回，印尼 COD 订单发货前智能地标核验。官方 WhatsApp 商业 API 直连，USDC 零汇损即时结算。",
      badge: "2026 东南亚电商 AI · 新加坡 / 印尼 / 大马 / 泰国 / 越南 / 菲律宾",
    },
    EN: {
      headline: "Autonomous WhatsApp Agents.\nSettled on Solana.",
      subhead:
        "Engineered for Southeast Asian cross-border e-commerce: 15-minute abandoned cart recovery and pre-dispatch COD address verification. Official WhatsApp API with instant USDC settlement.",
      badge: "2026 SOUTHEAST ASIA COMMERCE AI · SOLANA PAY",
    },
    SG: {
      headline: "Autonomous WhatsApp Agents.\nSettled on Solana.",
      subhead:
        "Built for SG & Southeast Asian cross-border sellers: 15-minute gentle cart recovery and pre-delivery COD landmark verification lah. Official WhatsApp Cloud API with zero-slippage USDC settlement.",
      badge: "SINGAPORE & SEA HUB · FAST PAYNOW & SOLANA USDC SETTLEMENT",
    },
    ID: {
      headline: "Asisten Pesanan WhatsApp Otonom.\nSelesai di Solana.",
      subhead:
        "Solusi cerdas e-commerce Asia Tenggara: pemulihan keranjang belanja 15 menit dan verifikasi alamat COD pra-pengiriman. Terhubung ke API resmi WhatsApp dengan settlement USDC instan.",
      badge: "AI E-COMMERCE ASIA TENGGARA 2026 · SOLANA PAY",
    },
    MY: {
      headline: "Ejen Pesanan WhatsApp Autonomi.\nSelesai di Solana.",
      subhead:
        "Khas untuk e-dagang rentas sempadan Asia Tenggara: pemulihan troli terbiar 15 minit & pengesahan COD sebelum pos laju. API rasmi WhatsApp dengan penyelesaian USDC segera.",
      badge: "AI E-DAGANG ASIA TENGGARA · MALAYSIA & REGIONAL",
    },
    TH: {
      headline: "ระบบผู้ช่วยคำสั่งซื้อ WhatsApp อัตโนมัติ\nชำระเงินบน Solana",
      subhead:
        "ออกแบบมาเพื่ออีคอมเมิร์ซเอเชียตะวันออกเฉียงใต้: กู้คืนตะกร้าสินค้าใน 15 นาที และยืนยันที่อยู่ COD ก่อนจัดส่ง เชื่อมต่อ WhatsApp Business API ทางการ พร้อมชำระเงิน USDC ทันที",
      badge: "AI อีคอมเมิร์ซเอเชียตะวันออกเฉียงใต้ 2026 · SOLANA PAY",
    },
    VI: {
      headline: "Trợ Lý Đơn Hàng WhatsApp Tự Động.\nThanh Toán Trên Solana.",
      subhead:
        "Thiết kế riêng cho thương mại điện tử Đông Nam Á: thu hồi giỏ hàng bỏ quên sau 15 phút, xác minh địa chỉ giao COD trước khi gửi hàng. Kết nối trực tiếp WhatsApp Cloud API, tất toán USDC không trượt giá.",
      badge: "AI THƯƠNG MẠI ĐIỆN TỬ ĐÔNG NAM Á 2026 · SOLANA PAY",
    },
    PH: {
      headline: "Awtomatikong WhatsApp Order Assistant.\nSettled sa Solana.",
      subhead:
        "Ginawa para sa e-commerce sa Southeast Asia: 15-minutong pagbawi ng abandoned cart at beripikasyon ng landmark sa COD bago i-dispatch po. Opisyal na WhatsApp API na may instant settlement gamit ang USDC.",
      badge: "SOUTHEAST ASIA COMMERCE AI 2026 · PILIPINAS & REGIONAL",
    },
  };

  const t = heroTitles[lang];

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans selection:bg-zinc-900 selection:text-white relative">
      {/* 顶部固定导航栏 (64px, 柔和发丝边框, 毛玻璃) */}
      <header className="sticky top-0 z-40 w-full h-16 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 flex items-center justify-between">
          {/* 品牌标识与环境标识 */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 select-none group">
              <span className="font-sans text-base font-bold tracking-tight text-zinc-950">
                SolaFlow
              </span>
              <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 bg-zinc-900 text-white rounded">
                AI
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500 border-l border-zinc-200 pl-4">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Devnet v1.1 · Meta BAA</span>
            </div>
          </div>

          {/* 右侧：语言切换胶囊与行动链接 */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* 语言切换器：大屏为药丸组，小屏为下拉选择 */}
            <div className="hidden xl:inline-flex p-1 border border-zinc-200/80 bg-zinc-100/80 rounded-xl">
              {LANDING_LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={clsx(
                    "px-2 py-1 text-xs font-mono font-medium transition-all cursor-pointer rounded-lg flex items-center gap-1",
                    lang === l.code
                      ? "bg-white text-zinc-950 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900"
                  )}
                  title={l.label}
                >
                  <span className="text-[11px]">{l.flag}</span>
                  <span>{l.code}</span>
                </button>
              ))}
            </div>

            {/* 中小屏精简下拉切换 */}
            <div className="xl:hidden flex items-center border border-zinc-200/80 rounded-lg px-2 py-1 bg-zinc-50 text-xs font-mono">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LandingLang)}
                className="bg-transparent text-zinc-900 font-semibold focus:outline-none cursor-pointer"
                aria-label="切换出海官网语言"
              >
                {LANDING_LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.code} - {l.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPayModalOpen(true)}
              className="hidden md:inline-flex text-xs text-zinc-600 hover:text-zinc-950"
            >
              Solana Pay
            </Button>

            <Link href="/console">
              <Button variant="outline" size="sm" className="rounded-xl border-zinc-200 text-xs">
                商户工作台
              </Button>
            </Link>

            <Link href="/onboarding">
              <Button size="sm" className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs px-3.5">
                免费接入
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full">
        {/* SECTION 1: HERO & EXPANSIVE LIVE PRODUCT WORKSPACE */}
        <section className="relative w-full overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
          {/* 背景极其细腻的径向微光 */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(16,185,129,0.04),rgba(255,255,255,0))]" />

          <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
            {/* 顶部微胶囊标签 */}
            <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-600 border border-zinc-200/80 px-3.5 py-1.5 bg-zinc-50/80 rounded-full mb-6 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t.badge}</span>
            </div>

            {/* 极简超大标题 */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-bold tracking-tight text-zinc-950 leading-[1.08] max-w-4xl mx-auto whitespace-pre-line text-balance">
              {t.headline}
            </h1>

            {/* 优雅呼吸感副标 */}
            <p className="text-base sm:text-lg lg:text-xl text-zinc-600 font-sans leading-relaxed max-w-2xl mx-auto pt-6 text-balance">
              {t.subhead}
            </p>

            {/* 行动召唤按钮组 */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-8 sm:pt-10">
              <Link href="/onboarding">
                <Button size="lg" className="h-12 px-7 text-xs bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl shadow-sm">
                  免费接入 (Claim 100 Credits)
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="#sandbox">
                <Button variant="outline" size="lg" className="h-12 px-6 text-xs rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900">
                  体验交互沙盒
                </Button>
              </a>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setPayModalOpen(true)}
                className="h-12 px-5 text-xs text-zinc-600 hover:text-zinc-950"
              >
                Solana Pay 体验 →
              </Button>
            </div>

            {/* 宽幅实时商户控制台预览视窗 */}
            <div className="pt-14 sm:pt-20 max-w-5xl mx-auto w-full text-left">
              <HeroProductDashboard />
            </div>

            {/* 4 维核心业务数据行 (通透轻量大字号排版) */}
            <div className="pt-16 sm:pt-24 max-w-5xl mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-zinc-200">
                <div className="p-4 sm:p-6 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 text-center">
                  <div className="text-3xl sm:text-4xl font-sans font-bold text-zinc-950 tracking-tight">
                    +18.4%
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-1.5 uppercase">
                    待支付弃购挽回率
                  </div>
                </div>

                <div className="p-4 sm:p-6 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 text-center">
                  <div className="text-3xl sm:text-4xl font-sans font-bold text-zinc-950 tracking-tight">
                    -6.2%
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-1.5 uppercase">
                    COD 拒签退运损失
                  </div>
                </div>

                <div className="p-4 sm:p-6 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 text-center">
                  <div className="text-3xl sm:text-4xl font-sans font-bold text-zinc-950 tracking-tight">
                    &lt; 3.2s
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-1.5 uppercase">
                    夜间买家平均响应
                  </div>
                </div>

                <div className="p-4 sm:p-6 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 text-center">
                  <div className="text-3xl sm:text-4xl font-sans font-bold text-zinc-950 tracking-tight">
                    $0.00025
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-1.5 uppercase">
                    链上单笔结算手续费
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: 出海业务交互演练台 (WORKFLOW SIMULATOR) */}
        <section id="sandbox" className="w-full border-t border-zinc-200/80 py-24 sm:py-32 px-4 sm:px-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-mono text-emerald-600 font-semibold uppercase tracking-wider">
                02 · INTERACTIVE WORKFLOW SIMULATOR
              </div>
              <h2 className="text-2xl sm:text-4xl font-sans font-bold tracking-tight text-zinc-950">
                出海业务交互演练台
              </h2>
              <p className="text-sm sm:text-base text-zinc-600 font-sans leading-relaxed">
                点击切换 4 大出海真实场景，体验东南亚本土多语言原声解析、COD 发货前地标校准与订单全流程实时流转。
              </p>
            </div>

            <TelemetrySandbox />
          </div>
        </section>

        {/* SECTION 3: 5 大企业级核心能力与业务基建 */}
        <section className="w-full border-t border-zinc-200/80 py-24 sm:py-32 px-4 sm:px-8 bg-zinc-50/40">
          <div className="max-w-7xl mx-auto space-y-12 sm:space-y-14">
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-mono text-indigo-600 font-semibold uppercase tracking-wider">
                03 · ENTERPRISE CAPABILITIES & INFRASTRUCTURE
              </div>
              <h2 className="text-2xl sm:text-4xl font-sans font-bold tracking-tight text-zinc-950">
                5 大企业级核心能力与业务基建
              </h2>
              <p className="text-sm sm:text-base text-zinc-600 font-sans leading-relaxed">
                专为东南亚多国跨境生态打造的高可用自动化服务矩阵与企业级基础设施。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-7">
              {/* 卡片 1 (7 栏) */}
              <div className="md:col-span-7 p-7 sm:p-9 border border-zinc-200/80 rounded-2xl bg-white flex flex-col justify-between hover:border-zinc-400/80 transition-all shadow-xs">
                <div>
                  <div className="text-xs font-mono text-emerald-700 font-semibold mb-4">
                    01 · NLP & DIALECT
                  </div>
                  <h3 className="text-xl sm:text-2xl font-sans font-bold text-zinc-950 tracking-tight mb-3">
                    东南亚多语言与印尼俚语深度解析
                  </h3>
                  <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-sans">
                    不仅掌握标准印尼语（Bahasa Indonesia），更精准识别雅加达本土口语缩写（Bahasa Gaul，如 <em>min, ongkir, ga nyasar</em>）与泰语礼貌语气助词（<em>krub/ka</em>）。
                  </p>
                </div>
                <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span className="text-emerald-700 font-medium">印尼语 • 泰语 • 英语 • 越南语</span>
                  <span className="font-semibold text-zinc-900">99.8% 意图分类率</span>
                </div>
              </div>

              {/* 卡片 2 (5 栏) */}
              <div className="md:col-span-5 p-7 sm:p-9 border border-zinc-200/80 rounded-2xl bg-white flex flex-col justify-between hover:border-zinc-400/80 transition-all shadow-xs">
                <div>
                  <div className="text-xs font-mono text-indigo-700 font-semibold mb-4">
                    02 · SOLANA PAY
                  </div>
                  <h3 className="text-xl sm:text-2xl font-sans font-bold text-zinc-950 tracking-tight mb-3">
                    Solana Pay 毫秒级原生结算
                  </h3>
                  <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-sans">
                    0 传统跨国信用卡 3% 货币兑换与通道手续费损耗。原生 USDC 充值即时到账，单笔手续费低至 $0.00025。
                  </p>
                </div>
                <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center justify-between text-xs font-mono text-indigo-700 font-semibold">
                  <span>418ms Finality</span>
                  <span>$0.00025 Gas Fee</span>
                </div>
              </div>

              {/* 卡片 3 (4 栏) */}
              <div className="md:col-span-4 p-7 sm:p-8 border border-zinc-200/80 rounded-2xl bg-white hover:border-zinc-400/80 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-zinc-500 mb-4 font-semibold">
                    03 · STORE WEBHOOK
                  </div>
                  <h3 className="text-lg font-sans font-bold text-zinc-950 tracking-tight mb-2">
                    全渠道电商店铺秒级直连
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed font-sans">
                    WooCommerce 与 Shopify 官方 Webhook 150ms 极速接入，自动同步订单变动与买家地址。
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 text-xs font-mono text-zinc-500">
                  <span>Webhook 150ms 接入</span>
                </div>
              </div>

              {/* 卡片 4 (4 栏) */}
              <div className="md:col-span-4 p-7 sm:p-8 border border-zinc-200/80 rounded-2xl bg-white hover:border-zinc-400/80 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-zinc-500 mb-4 font-semibold">
                    04 · COD SHIELD
                  </div>
                  <h3 className="text-lg font-sans font-bold text-zinc-950 tracking-tight mb-2">
                    COD 拒签发货前防护盾
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed font-sans">
                    结合历史高拒签热力图与空号探测，发货前一键要求补充真实地标，大幅截流往返物流亏损。
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 text-xs font-mono text-zinc-500">
                  <span>截流 6.2% 运费损耗</span>
                </div>
              </div>

              {/* 卡片 5 (4 栏) */}
              <div className="md:col-span-4 p-7 sm:p-8 border border-zinc-200/80 rounded-2xl bg-white hover:border-zinc-400/80 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-zinc-500 mb-4 font-semibold">
                    05 · HUMAN TAKEOVER
                  </div>
                  <h3 className="text-lg font-sans font-bold text-zinc-950 tracking-tight mb-2">
                    人机协同无感接管工作台
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed font-sans">
                    买家情绪波动或议价纠纷时自动暂停 AI 规则，零延迟平滑转交商户人工坐席，保障买家信任。
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 text-xs font-mono text-zinc-500">
                  <span>平滑转交零延迟</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: 跨境 ROI 利润恢复计算器 */}
        <section className="w-full border-t border-zinc-200/80 py-24 sm:py-32 px-4 sm:px-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-mono text-emerald-600 font-semibold uppercase tracking-wider">
                04 · PROFIT RECOVERY MODEL
              </div>
              <h2 className="text-2xl sm:text-4xl font-sans font-bold tracking-tight text-zinc-950">
                跨境出海 ROI 动态利润计算器
              </h2>
              <p className="text-sm sm:text-base text-zinc-600 font-sans leading-relaxed">
                基于月订单量与平均客单价，实时测算挽回未支付 GMV 与减少的 COD 物流损耗。
              </p>
            </div>

            <RoiCalculator />
          </div>
        </section>

        {/* SECTION 5: 商业转化与 SOLANA PAY 入口 (极简暗黑视窗) */}
        <section className="w-full border-t border-zinc-200/80 py-24 sm:py-32 px-4 sm:px-8 bg-zinc-950 text-white relative overflow-hidden">
          {/* 细腻环境背景光 */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.12),rgba(9,9,11,0))]" />

          <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 border border-zinc-800 px-3 py-1 rounded-full bg-zinc-900/60">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>CLAIM YOUR ONBOARDING CREDITS</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-white leading-tight">
              立即接入您的首个出海店铺
            </h2>

            <p className="text-sm sm:text-base text-zinc-400 font-sans max-w-xl mx-auto leading-relaxed">
              完成 6 步商户初始化向导，即刻获得 100 免费 Credits 体验额度，无需绑定信用卡。
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
              <Link href="/onboarding">
                <Button size="lg" className="h-12 px-8 text-xs bg-white text-zinc-950 hover:bg-zinc-200 font-medium rounded-xl shadow-sm">
                  立即免费接入 (Claim 100 Credits)
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPayModalOpen(true)}
                className="h-12 px-8 text-xs border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-200 rounded-xl"
              >
                Solana Pay Devnet 充值体验
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-zinc-200/80 bg-white py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-zinc-950 font-sans">SolaFlow AI</span>
            <span>• Meta BAA & GDPR Compliant</span>
            <span>• Southeast Asia E-Commerce Platform</span>
          </div>
          <div>
            <span>Markets: ID • TH • VN • PH • MY • SG · Copyright © 2026</span>
          </div>
        </div>
      </footer>

      {/* Solana Pay 充值模态框 */}
      <SolanaPayModal open={payModalOpen} onClose={() => setPayModalOpen(false)} />
    </div>
  );
}
