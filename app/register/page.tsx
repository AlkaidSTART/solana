"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { useAppStore } from "@/stores/use-app-store";
import type { SupportedLocale } from "@/lib/i18n";

export default function RegisterPage() {
  const { locale, setLocale } = useAppStore();

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans flex flex-col justify-between selection:bg-zinc-950 selection:text-white">
      {/* 顶部商户导航 */}
      <header className="h-16 border-b border-zinc-200 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-sans text-base font-bold tracking-tight text-zinc-950">
              SolaFlow
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-zinc-950 text-white rounded">
              AI
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-500 border-l border-zinc-200 pl-4">
            <span>东南亚跨境电商 WhatsApp 订单助手</span>
          </div>
        </div>

        {/* 顶部右侧：多语言切换与返回官网 */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 border border-zinc-200 px-2 py-1 text-xs font-mono bg-zinc-50">
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as SupportedLocale)}
              className="bg-transparent text-zinc-900 font-mono text-xs focus:outline-none cursor-pointer"
              aria-label="选择语言"
            >
              <option value="zh_CN">🇨🇳 中文</option>
              <option value="en_US">🌐 English</option>
              <option value="id_ID">🇮🇩 Bahasa Indonesia</option>
            </select>
          </div>

          <Link
            href="/"
            className="text-xs font-mono text-zinc-500 hover:text-zinc-950 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">返回官网</span>
          </Link>
        </div>
      </header>

      {/* 居中商户认证卡片（预设注册模式） */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <AuthCard initialMode="register" />
      </main>

      {/* 底部版权 */}
      <footer className="h-14 border-t border-zinc-200 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-zinc-500 gap-2 sm:gap-0 py-2 sm:py-0">
        <span>SolaFlow AI © 2026 · 东南亚出海跨境电商基础设施</span>
        <div className="flex items-center gap-4">
          <span>Meta BAA 合规认证</span>
          <span>•</span>
          <span>Solana L1 结算引擎</span>
        </div>
      </footer>
    </div>
  );
}
