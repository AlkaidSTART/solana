"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/use-app-store";
import {
  LayoutDashboard,
  Store,
  GitBranch,
  ShoppingBag,
  MessageSquare,
  BookOpen,
  CreditCard,
  Settings,
  ExternalLink,
  Coins,
  Menu,
  X,
} from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/console", label: "监控总览", icon: LayoutDashboard },
  { href: "/console/stores", label: "店铺与通道", icon: Store },
  { href: "/console/workflows", label: "工作流配置", icon: GitBranch },
  { href: "/console/orders", label: "订单中心", icon: ShoppingBag },
  { href: "/console/inbox", label: "会话与人工队列", icon: MessageSquare },
  { href: "/console/knowledge", label: "多语言知识库", icon: BookOpen },
  { href: "/console/billing", label: "财务充值中心", icon: CreditCard },
  { href: "/console/settings", label: "报表与设置", icon: Settings },
];

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { stores, currentStoreId, setStoreId, credits, locale, setLocale } =
    useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans flex flex-col antialiased">
      {/* 顶部全局状态栏 (Topbar, 56px) */}
      <header className="h-14 border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
        {/* 左侧：Logo 与店铺切换器 */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 text-zinc-500 hover:text-zinc-900"
            aria-label="打开导航菜单"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/console" className="flex items-center gap-2 select-none group">
            <span className="font-mono text-base font-bold tracking-tight text-zinc-900 group-hover:text-emerald-600 transition-colors">
              SolaFlow
            </span>
            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-emerald-400">
              AI CONSOLE
            </span>
          </Link>

          {/* 店铺下拉选择 */}
          <div className="hidden sm:flex items-center gap-2 border border-zinc-200 rounded-lg px-2.5 py-1 bg-zinc-50 text-xs font-mono shadow-2xs">
            <span className="text-zinc-400">店铺:</span>
            <select
              value={currentStoreId}
              onChange={(e) => setStoreId(e.target.value)}
              className="bg-transparent text-zinc-900 font-semibold focus:outline-none cursor-pointer"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-zinc-400">[Demo/Mock]</span>
          </div>
        </div>

        {/* 右侧：通道状态灯、额度胶囊、语言切换 */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
          {/* WhatsApp API 健康度灯 */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>WABA: 正常</span>
          </div>

          {/* Webhook 健康度灯 */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Webhook: 正常</span>
          </div>

          {/* Credits 额度指示器 */}
          <Link
            href="/console/billing"
            className="flex items-center gap-1.5 px-3 py-1 border border-zinc-200 rounded-lg hover:border-emerald-500 transition-colors bg-gradient-to-r from-zinc-50 to-emerald-50/30 shadow-2xs group"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-12 transition-transform" />
            <span className="text-zinc-500">额度:</span>
            <span className="font-bold text-zinc-900 group-hover:text-emerald-700">
              {credits.available.toLocaleString()}
            </span>
          </Link>

          {/* 语言选择 */}
          <select
            value={locale}
            onChange={(e) =>
              setLocale(e.target.value as "zh_CN" | "en_US" | "id_ID")
            }
            className="border border-zinc-200 rounded-lg px-2.5 py-1 bg-white text-[11px] font-mono text-zinc-900 focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="zh_CN">中文 (zh_CN)</option>
            <option value="en_US">English (en_US)</option>
            <option value="id_ID">Bahasa (id_ID)</option>
          </select>

          {/* 官网返回入口 */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <span>出海官网</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        </div>
      </header>

      {/* 侧边栏与主工作区分屏容器 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧固定菜单 (220px) */}
        <aside
          className={clsx(
            "fixed inset-y-14 left-0 z-20 w-56 border-r border-zinc-200 bg-white flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 shadow-xs md:shadow-none",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* 导航菜单列表 */}
          <nav className="p-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/console"
                  ? pathname === "/console"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-lg transition-all select-none",
                    isActive
                      ? "bg-zinc-900 text-white font-medium shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  )}
                >
                  <Icon
                    className={clsx(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-emerald-400" : "text-zinc-400"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* 侧栏底部环境元信息 */}
          <div className="p-3.5 border-t border-zinc-200 bg-zinc-50/70 text-[10px] font-mono text-zinc-500 space-y-1.5">
            <div className="flex justify-between">
              <span>TENANT:</span>
              <span className="text-zinc-900 font-medium">SEA_8892 (Demo)</span>
            </div>
            <div className="flex justify-between">
              <span>TIMEZONE:</span>
              <span className="text-zinc-900 truncate max-w-[100px]">WIB (UTC+7)</span>
            </div>
            <div className="flex justify-between">
              <span>NETWORK:</span>
              <span className="text-emerald-700 font-bold">Solana Devnet</span>
            </div>
          </div>
        </aside>

        {/* 右侧主工作区画布 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-50/30">
          <div className="max-w-7xl mx-auto space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
