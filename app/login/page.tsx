"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Globe, Shield, Sparkles } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { useAppStore } from "@/stores/use-app-store";
import type { SupportedLocale } from "@/lib/i18n";

function LoginContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  return <AuthCard initialMode={initialMode} />;
}

export default function LoginPage() {
  const { locale, setLocale } = useAppStore();

  const isEn = locale === "en_US";
  const isId = locale === "id_ID";

  const t = {
    tagline: isEn
      ? "Autonomous WhatsApp Order Assistant for Southeast Asia"
      : isId
      ? "Asisten Pesanan WhatsApp Otonom Asia Tenggara"
      : "东南亚跨境电商 WhatsApp 订单自动化与 COD 防损引擎",
    backHome: isEn ? "Back to Home" : isId ? "Kembali ke Beranda" : "返回官网",
    copyright: isEn
      ? "SolaFlow AI © 2026 · Southeast Asian Cross-border Commerce Infrastructure"
      : isId
      ? "SolaFlow AI © 2026 · Infrastruktur E-commerce Lintas Batas Asia Tenggara"
      : "SolaFlow AI © 2026 · 东南亚出海跨境电商自动化基础设施",
    compliance: isEn ? "Meta BAA Compliant" : isId ? "Kepatuhan Meta BAA" : "Meta BAA 商业数据合规",
    settlement: isEn ? "Solana Pay Settlement" : isId ? "Settlement Solana Pay" : "Solana Pay USDC 即时结算",
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans flex flex-col justify-between selection:bg-zinc-950 selection:text-white">
      {/* 顶部高定极简商户导航 */}
      <header className="h-16 border-b border-zinc-200/90 px-4 sm:px-8 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <span className="font-sans text-base font-extrabold tracking-tight text-zinc-950">
              SolaFlow
            </span>
            <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 bg-zinc-950 text-white">
              AI
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-500 border-l border-zinc-200 pl-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>{t.tagline}</span>
          </div>
        </div>

        {/* 顶部右侧：多语言切换与快捷返回 */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* 国际化语言选择器 */}
          <div className="flex items-center gap-1.5 border border-zinc-200 px-2 py-1 text-xs font-mono bg-zinc-50 hover:bg-zinc-100/70 transition-colors">
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as SupportedLocale)}
              className="bg-transparent text-zinc-900 font-mono text-xs focus:outline-none cursor-pointer"
              aria-label="选择语言"
            >
              <option value="zh_CN">🇨🇳 简体中文</option>
              <option value="en_US">🌐 English</option>
              <option value="id_ID">🇮🇩 Bahasa Indonesia</option>
            </select>
          </div>

          <Link
            href="/"
            className="text-xs font-mono text-zinc-600 hover:text-zinc-950 flex items-center gap-1.5 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline font-medium">{t.backHome}</span>
          </Link>
        </div>
      </header>

      {/* 核心分屏主体 */}
      <main className="flex-1 flex w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-8rem)]">
          {/* 左侧：出海商业实时遥测展厅 (桌面端 >=1024px 显示) */}
          <section className="hidden lg:block lg:col-span-6 xl:col-span-7 bg-zinc-950 h-full">
            <AuthShowcase />
          </section>

          {/* 右侧：高保真鉴权交互中心 */}
          <section className="col-span-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center p-4 sm:p-8 xl:p-12 bg-white relative">
            {/* 极轻微发丝网格底纹衬托质感 */}
            <div
              className="absolute inset-0 opacity-[0.025] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(#000000 1px, transparent 1px), linear-gradient(90deg, #000000 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* 移动端顶部轻量业务标头 (<1024px 显示) */}
            <div className="lg:hidden w-full max-w-md mb-6 p-3.5 border border-zinc-200/90 bg-zinc-50/80 font-mono space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-500 uppercase tracking-wider">SOLAFLOW OS</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Meta BAA 直连
                </span>
              </div>
              <p className="text-xs text-zinc-700 font-medium leading-snug">
                {t.tagline}
              </p>
            </div>

            {/* 居中认证卡片 */}
            <div className="w-full max-w-md relative z-10 my-auto py-4">
              <Suspense
                fallback={
                  <div className="w-full h-96 border border-zinc-200 bg-white p-8 flex items-center justify-center text-xs font-mono text-zinc-400">
                    加载中...
                  </div>
                }
              >
                <LoginContent />
              </Suspense>
            </div>
          </section>
        </div>
      </main>

      {/* 底部版权与合规规范 */}
      <footer className="h-14 border-t border-zinc-200/90 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-zinc-500 gap-2 sm:gap-0 py-2 sm:py-0 bg-white">
        <span>{t.copyright}</span>
        <div className="flex items-center gap-3 sm:gap-4 text-zinc-600">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span>{t.compliance}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-zinc-700" />
            <span>{t.settlement}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
