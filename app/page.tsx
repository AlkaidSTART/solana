"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HeroProductDashboard } from "@/components/landing/hero-product-dashboard";
import { TelemetrySandbox } from "@/components/landing/telemetry-sandbox";
import { RoiCalculator } from "@/components/landing/roi-calculator";
import { SolanaPayModal } from "@/components/billing/solana-pay-modal";
import { HeroTopoCanvas } from "@/components/landing/topo-mesh";
import { DialectRoutingConsole } from "@/components/landing/dialect-routing-console";
import { SolanaSettlementConsole } from "@/components/landing/solana-settlement-console";
import { ThreeOnboardingGateway } from "@/components/landing/three-onboarding-gateway";
import { Button } from "@/components/ui/button";
import { GsapEntrance, GsapStagger } from "@/components/ui/gsap-transition";
import { motion, AnimatePresence } from "motion/react";
import { transitions } from "@/lib/animations/motion-transitions";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Coins,
  Globe,
} from "lucide-react";
import { clsx } from "clsx";

import { useAppStore } from "@/stores/use-app-store";
import { getI18nText, type SupportedLocale } from "@/lib/i18n";

type LandingLang = "ZH" | "EN" | "SG" | "ID" | "MY" | "TH" | "VI" | "PH";

const LANDING_LANGS = [
  { code: "ZH", label: "简体中文" },
  { code: "EN", label: "English" },
  { code: "SG", label: "English (SG)" },
  { code: "ID", label: "Bahasa Indonesia" },
  { code: "MY", label: "Bahasa Melayu" },
  { code: "TH", label: "ไทย" },
  { code: "VI", label: "Tiếng Việt" },
  { code: "PH", label: "Filipino" },
] as const;

const LOCALE_TO_CODE: Record<SupportedLocale, LandingLang> = {
  zh_CN: "ZH",
  en_US: "EN",
  en_SG: "SG",
  id_ID: "ID",
  ms_MY: "MY",
  th_TH: "TH",
  vi_VN: "VI",
  fil_PH: "PH",
};

const CODE_TO_LOCALE: Record<LandingLang, SupportedLocale> = {
  ZH: "zh_CN",
  EN: "en_US",
  SG: "en_SG",
  ID: "id_ID",
  MY: "ms_MY",
  TH: "th_TH",
  VI: "vi_VN",
  PH: "fil_PH",
};

export default function LandingPage() {
  const { locale, setLocale } = useAppStore();
  const lang = LOCALE_TO_CODE[locale] || "ZH";
  const setLang = (code: LandingLang) => setLocale(CODE_TO_LOCALE[code]);
  const [payModalOpen, setPayModalOpen] = useState(false);

  const headline = getI18nText(locale, "hero_headline");
  const subhead = getI18nText(locale, "hero_subhead");

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
              <span>Devnet · Meta BAA</span>
            </div>
          </div>

          {/* 右侧：语言切换胶囊与行动链接 */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* 语言切换器：大屏为药丸组，小屏为下拉选择 */}
            {/* 语言切换器：大屏为药丸组 (Motion.dev layoutId 弹簧滑块)，小屏为下拉选择 */}
            <div className="hidden xl:inline-flex items-center p-1 border border-zinc-200/80 bg-zinc-100/80 rounded-xl select-none">
              <Globe className="w-3.5 h-3.5 text-zinc-400 mx-1.5 shrink-0" aria-hidden="true" />
              {LANDING_LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={clsx(
                    "relative px-2 py-1 text-xs font-mono font-medium transition-colors cursor-pointer rounded-lg flex items-center z-10",
                    lang === l.code
                      ? "text-zinc-950 font-semibold"
                      : "text-zinc-500 hover:text-zinc-900"
                  )}
                  title={l.label}
                >
                  {lang === l.code && (
                    <motion.div
                      layoutId="landing-lang-indicator"
                      transition={transitions.springTab}
                      className="absolute inset-0 bg-white shadow-xs rounded-lg -z-10"
                    />
                  )}
                  <span>{l.code}</span>
                </button>
              ))}
            </div>

            {/* 中小屏精简下拉切换 */}
            <div className="xl:hidden flex items-center gap-1.5 border border-zinc-200/80 rounded-lg px-2 py-1 bg-zinc-50 text-xs font-mono">
              <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LandingLang)}
                className="bg-transparent text-zinc-900 font-semibold focus:outline-none cursor-pointer"
                aria-label="切换出海官网语言"
              >
                {LANDING_LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label} ({l.code})
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
                {getI18nText(locale, "landing_nav_console")}
              </Button>
            </Link>

            <Link href="/onboarding">
              <Button size="sm" className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs px-3.5">
                {getI18nText(locale, "landing_nav_onboard")}
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

          {/* 3D WebGL 极简单色拓扑地貌雕塑微动效背景 */}
          <div className="absolute inset-0 pointer-events-none opacity-85 flex items-center justify-center overflow-hidden">
            <HeroTopoCanvas className="w-full h-full max-w-6xl mx-auto" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
            {/* 多语言标题组平滑过渡 (AnimatePresence mode="wait") */}
            <AnimatePresence mode="wait">
              <motion.div
                key={lang}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={transitions.entrance}
              >
                {/* 极简超大标题 */}
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-bold tracking-tight text-zinc-950 leading-[1.08] max-w-4xl mx-auto whitespace-pre-line text-balance">
                  {headline}
                </h1>

                {/* 优雅呼吸感副标 */}
                <p className="text-base sm:text-lg lg:text-xl text-zinc-600 font-sans leading-relaxed max-w-2xl mx-auto pt-6 text-balance">
                  {subhead}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* 行动召唤按钮组 (GSAP 进场) */}
            <GsapEntrance direction="up" distance={12} delay={0.12} duration={0.35}>
              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-8 sm:pt-10">
                <Link href="/onboarding">
                  <Button size="lg" className="h-12 px-7 text-xs bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl shadow-sm">
                    {getI18nText(locale, "landing_hero_claim_badge")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <a href="#sandbox">
                  <Button variant="outline" size="lg" className="h-12 px-6 text-xs rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900">
                    {getI18nText(locale, "landing_hero_sandbox_btn")}
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setPayModalOpen(true)}
                  className="h-12 px-5 text-xs text-zinc-600 hover:text-zinc-950"
                >
                  {getI18nText(locale, "landing_hero_solana_pay_btn")}
                </Button>
              </div>
            </GsapEntrance>

            {/* 宽幅实时商户控制台预览视窗 (GSAP 平滑浮现) */}
            <GsapEntrance direction="up" distance={18} delay={0.2} duration={0.42}>
              <div className="pt-14 sm:pt-20 max-w-5xl mx-auto w-full text-left">
                <HeroProductDashboard />
              </div>
            </GsapEntrance>

            {/* 4 维核心业务数据行 (GSAP Stagger 级联进场) */}
            <div className="pt-16 sm:pt-24 max-w-5xl mx-auto">
              <GsapStagger
                selector=".metric-cell"
                stagger={0.06}
                delay={0.25}
                distance={14}
                duration={0.35}
                className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-zinc-200"
              >
                <div className="metric-cell p-4 sm:p-6 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 text-center">
                  <div className="text-3xl sm:text-4xl font-sans font-bold text-zinc-950 tracking-tight">
                    +18.4%
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-1.5 uppercase">
                    {getI18nText(locale, "landing_metric_recovery")}
                  </div>
                </div>

                <div className="metric-cell p-4 sm:p-6 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 text-center">
                  <div className="text-3xl sm:text-4xl font-sans font-bold text-zinc-950 tracking-tight">
                    -6.2%
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-1.5 uppercase">
                    {getI18nText(locale, "landing_metric_cod")}
                  </div>
                </div>

                <div className="metric-cell p-4 sm:p-6 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 text-center">
                  <div className="text-3xl sm:text-4xl font-sans font-bold text-zinc-950 tracking-tight">
                    &lt; 3.2s
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-1.5 uppercase">
                    {getI18nText(locale, "landing_metric_response")}
                  </div>
                </div>

                <div className="metric-cell p-4 sm:p-6 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 text-center">
                  <div className="text-3xl sm:text-4xl font-sans font-bold text-zinc-950 tracking-tight">
                    $0.00025
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-1.5 uppercase">
                    {getI18nText(locale, "landing_metric_gas")}
                  </div>
                </div>
              </GsapStagger>
            </div>
          </div>
        </section>

        {/* SECTION 2: 出海业务交互演练台 (WORKFLOW SIMULATOR) */}
        <section id="sandbox" className="w-full border-t border-zinc-200/80 py-24 sm:py-32 px-4 sm:px-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-mono text-emerald-600 font-semibold uppercase tracking-wider">
                {getI18nText(locale, "landing_sec2_badge")}
              </div>
              <h2 className="text-2xl sm:text-4xl font-sans font-bold tracking-tight text-zinc-950">
                {getI18nText(locale, "landing_sec2_title")}
              </h2>
              <p className="text-sm sm:text-base text-zinc-600 font-sans leading-relaxed">
                {getI18nText(locale, "landing_sec2_desc")}
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
                {getI18nText(locale, "landing_sec3_badge")}
              </div>
              <h2 className="text-2xl sm:text-4xl font-sans font-bold tracking-tight text-zinc-950">
                {getI18nText(locale, "landing_sec3_title")}
              </h2>
              <p className="text-sm sm:text-base text-zinc-600 font-sans leading-relaxed">
                {getI18nText(locale, "landing_sec3_desc")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-7">
              {/* 卡片 1 (7 栏) */}
              <div className="md:col-span-7 p-7 sm:p-9 border border-zinc-200/80 rounded-2xl bg-white flex flex-col justify-between hover:border-zinc-400/80 transition-all shadow-xs">
                <div>
                  <div className="text-xs font-mono text-emerald-700 font-semibold mb-4">
                    {getI18nText(locale, "landing_card1_tag")}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-sans font-bold text-zinc-950 tracking-tight mb-3">
                    {getI18nText(locale, "landing_card1_title")}
                  </h3>
                  <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-sans mb-6">
                    {getI18nText(locale, "landing_card1_desc")}
                  </p>

                  {/* 东南亚跨境多语言与印尼俚语高阶解析视窗 */}
                  <div className="mt-2 p-3 sm:p-4 bg-zinc-50/60 rounded-xl border border-zinc-200/70">
                    <DialectRoutingConsole />
                  </div>
                </div>
                <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span className="text-emerald-700 font-medium">{getI18nText(locale, "landing_card1_footer_left")}</span>
                  <span className="font-semibold text-zinc-900">{getI18nText(locale, "landing_card1_footer_right")}</span>
                </div>
              </div>

              {/* 卡片 2 (5 栏) */}
              <div className="md:col-span-5 p-7 sm:p-9 border border-zinc-200/80 rounded-2xl bg-white flex flex-col justify-between hover:border-zinc-400/80 transition-all shadow-xs">
                <div>
                  <div className="text-xs font-mono text-indigo-700 font-semibold mb-4">
                    {getI18nText(locale, "landing_card2_tag")}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-sans font-bold text-zinc-950 tracking-tight mb-3">
                    {getI18nText(locale, "landing_card2_title")}
                  </h3>
                  <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-sans mb-6">
                    {getI18nText(locale, "landing_card2_desc")}
                  </p>

                  {/* Solana Pay 毫秒级原生结算引擎与通道对比视窗 */}
                  <div className="mt-2 p-3 sm:p-4 bg-zinc-50/60 rounded-xl border border-zinc-200/70">
                    <SolanaSettlementConsole />
                  </div>
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
                    {getI18nText(locale, "landing_card3_tag")}
                  </div>
                  <h3 className="text-lg font-sans font-bold text-zinc-950 tracking-tight mb-2">
                    {getI18nText(locale, "landing_card3_title")}
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed font-sans">
                    {getI18nText(locale, "landing_card3_desc")}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 text-xs font-mono text-zinc-500">
                  <span>{getI18nText(locale, "landing_card3_footer")}</span>
                </div>
              </div>

              {/* 卡片 4 (4 栏) */}
              <div className="md:col-span-4 p-7 sm:p-8 border border-zinc-200/80 rounded-2xl bg-white hover:border-zinc-400/80 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-zinc-500 mb-4 font-semibold">
                    {getI18nText(locale, "landing_card4_tag")}
                  </div>
                  <h3 className="text-lg font-sans font-bold text-zinc-950 tracking-tight mb-2">
                    {getI18nText(locale, "landing_card4_title")}
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed font-sans">
                    {getI18nText(locale, "landing_card4_desc")}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 text-xs font-mono text-zinc-500">
                  <span>{getI18nText(locale, "landing_card4_footer")}</span>
                </div>
              </div>

              {/* 卡片 5 (4 栏) */}
              <div className="md:col-span-4 p-7 sm:p-8 border border-zinc-200/80 rounded-2xl bg-white hover:border-zinc-400/80 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-zinc-500 mb-4 font-semibold">
                    {getI18nText(locale, "landing_card5_tag")}
                  </div>
                  <h3 className="text-lg font-sans font-bold text-zinc-950 tracking-tight mb-2">
                    {getI18nText(locale, "landing_card5_title")}
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed font-sans">
                    {getI18nText(locale, "landing_card5_desc")}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 text-xs font-mono text-zinc-500">
                  <span>{getI18nText(locale, "landing_card5_footer")}</span>
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
                {getI18nText(locale, "landing_sec4_badge")}
              </div>
              <h2 className="text-2xl sm:text-4xl font-sans font-bold tracking-tight text-zinc-950">
                {getI18nText(locale, "landing_sec4_title")}
              </h2>
              <p className="text-sm sm:text-base text-zinc-600 font-sans leading-relaxed">
                {getI18nText(locale, "landing_sec4_desc")}
              </p>
            </div>

            <RoiCalculator />
          </div>
        </section>

        {/* SECTION 5: 商业转化与 SOLANA PAY 入口 (极简暗黑视窗) */}
        <section className="w-full border-t border-zinc-200/80 py-24 sm:py-32 px-4 sm:px-8 bg-zinc-950 text-white relative overflow-hidden">
          {/* 细腻环境背景光 */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.12),rgba(9,9,11,0))]" />

          <div className="max-w-5xl mx-auto text-center space-y-10 sm:space-y-12 relative z-10">
            {/* 标头区域 */}
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 border border-zinc-800 px-3.5 py-1.5 rounded-full bg-zinc-900/60 shadow-2xs">
                <span>{getI18nText(locale, "landing_sec5_badge")}</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-sans font-bold tracking-tight text-white leading-tight">
                {getI18nText(locale, "landing_sec5_title")}
              </h2>

              <p className="text-sm sm:text-base text-zinc-400 font-sans max-w-xl mx-auto leading-relaxed">
                {getI18nText(locale, "landing_sec5_desc")}
              </p>
            </div>

            {/* 3D 接入传送门视窗与极速流线 */}
            <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-xs space-y-5">
              <ThreeOnboardingGateway />

              {/* 3 步极速开通向导流线 */}
              <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="p-3 bg-zinc-950/60 border border-zinc-800/70 rounded-xl">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1">STEP 01</div>
                  <div className="text-xs font-bold text-white">{getI18nText(locale, "landing_sec5_step1_title")}</div>
                  <div className="text-[11px] text-zinc-400 font-sans mt-0.5">{getI18nText(locale, "landing_sec5_step1_desc")}</div>
                </div>

                <div className="p-3 bg-zinc-950/60 border border-zinc-800/70 rounded-xl">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1">STEP 02</div>
                  <div className="text-xs font-bold text-white">{getI18nText(locale, "landing_sec5_step2_title")}</div>
                  <div className="text-[11px] text-zinc-400 font-sans mt-0.5">{getI18nText(locale, "landing_sec5_step2_desc")}</div>
                </div>

                <div className="p-3 bg-zinc-950/60 border border-zinc-800/70 rounded-xl">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1">STEP 03</div>
                  <div className="text-xs font-bold text-white">{getI18nText(locale, "landing_sec5_step3_title")}</div>
                  <div className="text-[11px] text-zinc-400 font-sans mt-0.5">{getI18nText(locale, "landing_sec5_step3_desc")}</div>
                </div>
              </div>
            </div>

            {/* 行动号召按钮组 */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/onboarding">
                <Button size="lg" className="h-12 px-8 text-xs bg-white text-zinc-950 hover:bg-zinc-200 font-medium rounded-xl shadow-sm">
                  {getI18nText(locale, "landing_sec5_btn_claim")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPayModalOpen(true)}
                className="h-12 px-8 text-xs border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-200 rounded-xl"
              >
                {getI18nText(locale, "landing_sec5_btn_pay")}
              </Button>
            </div>

            {/* 4 维企业级入驻信任保障卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-left border-t border-zinc-900">
              <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xs font-bold text-white">{getI18nText(locale, "landing_sec5_trust1_title")}</div>
                <div className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {getI18nText(locale, "landing_sec5_trust1_desc")}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-zinc-200" />
                </div>
                <div className="text-xs font-bold text-white">{getI18nText(locale, "landing_sec5_trust2_title")}</div>
                <div className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {getI18nText(locale, "landing_sec5_trust2_desc")}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xs font-bold text-white">{getI18nText(locale, "landing_sec5_trust3_title")}</div>
                <div className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {getI18nText(locale, "landing_sec5_trust3_desc")}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Coins className="w-3.5 h-3.5 text-zinc-200" />
                </div>
                <div className="text-xs font-bold text-white">{getI18nText(locale, "landing_sec5_trust4_title")}</div>
                <div className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {getI18nText(locale, "landing_sec5_trust4_desc")}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-zinc-200/80 bg-white py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-zinc-950 font-sans">SolaFlow AI</span>
            <span>• {getI18nText(locale, "landing_footer_text")}</span>
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
