"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Shield, Sparkles, Lock, Radio } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { useAppStore } from "@/stores/use-app-store";
import type { SupportedLocale } from "@/lib/i18n";

export default function RegisterPage() {
  const { locale, setLocale } = useAppStore();

  const isEn = locale === "en_US";
  const isId = locale === "id_ID";

  const t = {
    tagline: isEn
      ? "Enterprise Console // WhatsApp Commerce Automation"
      : isId
      ? "Konsol Enterprise // Otomatisasi WhatsApp Asia Tenggara"
      : "商户控制台 // 东南亚 WhatsApp 订单转化与 COD 防损",
    statusLive: isEn
      ? "META BAA DIRECT · 99.99% UPTIME"
      : isId
      ? "META BAA TERHUBUNG · 99.99% AKTIF"
      : "META BAA 官方直连 · 99.99% 运行正常",
    backHome: isEn ? "Back to Home" : isId ? "Kembali ke Beranda" : "返回官网",
    copyright: isEn
      ? "SolaFlow AI © 2026 · Southeast Asian Cross-border Commerce Infrastructure"
      : isId
      ? "SolaFlow AI © 2026 · Infrastruktur E-commerce Lintas Batas Asia Tenggara"
      : "SolaFlow AI © 2026 · 东南亚出海跨境电商自动化基础设施",
    compliance: isEn ? "Meta BAA Compliant" : isId ? "Kepatuhan Meta BAA" : "Meta BAA 商业数据合规",
    settlement: isEn ? "Solana Pay Settlement" : isId ? "Settlement Solana Pay" : "Solana Pay USDC 即时结算",
    encryption: isEn ? "256-bit Encrypted" : isId ? "Enkripsi 256-bit" : "256-bit 端到端安全加密",
    loading: isEn ? "Loading registration console..." : isId ? "Memuat konsol pendaftaran..." : "加载商户注册控制台...",
    selectLanguage: isEn ? "Select Language" : isId ? "Pilih Bahasa" : "选择语言",
  };

  return (
    <div className="h-dvh max-h-dvh overflow-hidden bg-zinc-50/50 text-zinc-900 font-sans flex flex-col justify-between selection:bg-zinc-900 selection:text-white relative">
      {/* 极简发丝建筑几何点阵网格 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#000000 1px, transparent 1px), linear-gradient(90deg, #000000 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* 居中环境柔和渐变微光圈 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[520px] max-w-full bg-gradient-to-tr from-emerald-100/35 via-zinc-100/40 to-teal-100/25 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 顶部高定极简商户导航 */}
      <header className="h-13 sm:h-14 shrink-0 border-b border-zinc-200/80 px-4 sm:px-8 flex items-center justify-between bg-white/75 backdrop-blur-md z-30">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer">
            <span className="font-sans text-base font-extrabold tracking-tight text-zinc-900">
              SolaFlow
            </span>
            <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-sm bg-zinc-900 text-white tracking-wide">
              AI
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500 border-l border-zinc-200/80 pl-3 sm:pl-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-[11px] font-medium tracking-tight text-zinc-600">
              {t.statusLive}
            </span>
          </div>
        </div>

        {/* 顶部右侧：矢量多语言切换与快捷返回 */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="flex items-center gap-1.5 border border-zinc-200/80 px-2.5 py-1 text-xs font-sans rounded-md bg-white hover:bg-zinc-50 transition-colors shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as SupportedLocale)}
              className="bg-transparent text-zinc-800 font-sans text-xs focus:outline-none cursor-pointer"
              aria-label={t.selectLanguage}
            >
              <option value="zh_CN">简体中文</option>
              <option value="en_US">English</option>
              <option value="id_ID">Bahasa Indonesia</option>
            </select>
          </div>

          <Link
            href="/"
            className="text-xs font-sans text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 shrink-0" />
            <span className="hidden sm:inline font-medium">{t.backHome}</span>
          </Link>
        </div>
      </header>

      {/* 核心居中聚焦舞台 (初始预设注册模式) */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 py-4 sm:py-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[440px] my-auto flex flex-col items-center relative z-10">
          <Suspense
            fallback={
              <div className="w-full h-80 rounded-2xl border border-zinc-200/80 bg-white/95 p-8 flex items-center justify-center text-xs font-mono text-zinc-400 shadow-sm">
                {t.loading}
              </div>
            }
          >
            <AuthCard initialMode="register" />
          </Suspense>

          {/* 卡片底部企业信誉背书条 */}
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 text-[10px] sm:text-[11px] font-mono text-zinc-500 select-none px-2 text-center">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{t.compliance}</span>
            </span>
            <span className="text-zinc-300 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>{t.settlement}</span>
            </span>
            <span className="text-zinc-300 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{t.encryption}</span>
            </span>
          </div>
        </div>
      </main>

      {/* 底部版权与东南亚低延迟节点 */}
      <footer className="h-9 sm:h-10 shrink-0 border-t border-zinc-200/80 px-4 sm:px-8 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-zinc-400 bg-white/70 backdrop-blur-xs z-30">
        <span className="truncate max-w-[55%] sm:max-w-none">{t.copyright}</span>
        <div className="flex items-center gap-2 sm:gap-3 text-zinc-500 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 text-emerald-700 font-medium">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>CGK · 8ms</span>
          </span>
          <span className="hidden md:inline text-zinc-300">•</span>
          <span className="hidden md:inline">BKK · 14ms</span>
          <span className="hidden md:inline text-zinc-300">•</span>
          <span className="inline">SIN · 2ms</span>
        </div>
      </footer>
    </div>
  );
}
