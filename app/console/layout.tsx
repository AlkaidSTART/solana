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
    <div className="min-h-screen bg-[#FFFFFF] text-[#09090B] font-sans flex flex-col antialiased">
      {/* 顶部全局状态栏 (Topbar, 56px, 发丝下边框) */}
      <header className="h-14 border-b border-[#E4E4E7] bg-white sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
        {/* 左侧：Logo 与店铺切换器 */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 text-[#71717A] hover:text-[#09090B]"
            aria-label="打开导航菜单"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/console" className="flex items-center gap-2 select-none">
            <span className="font-mono text-sm font-bold tracking-tight text-[#09090B]">
              SolaFlow
            </span>
            <span className="text-[9px] font-mono uppercase px-1 py-0.2 bg-[#09090B] text-white">
              CONSOLE
            </span>
          </Link>

          {/* 店铺下拉选择 */}
          <div className="hidden sm:flex items-center gap-2 border border-[#E4E4E7] px-2.5 py-1 bg-[#FAFAFA] text-xs font-mono">
            <span className="text-[#71717A]">店铺:</span>
            <select
              value={currentStoreId}
              onChange={(e) => setStoreId(e.target.value)}
              className="bg-transparent text-[#09090B] font-medium focus:outline-none cursor-pointer"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-[#71717A]">[Demo/Mock]</span>
          </div>
        </div>

        {/* 右侧：通道状态灯、额度胶囊、语言切换 */}
        <div className="flex items-center gap-3 sm:gap-5 text-xs font-mono">
          {/* WhatsApp API 健康度灯 */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-[#71717A]">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <span>WABA: 正常</span>
          </div>

          {/* Webhook 健康度灯 */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-[#71717A]">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <span>Webhook: 正常</span>
          </div>

          {/* Credits 额度指示器 */}
          <Link
            href="/console/billing"
            className="flex items-center gap-1.5 px-2.5 py-1 border border-[#E4E4E7] hover:border-[#09090B] transition-colors bg-[#FAFAFA]"
          >
            <Coins className="w-3.5 h-3.5 text-[#09090B]" />
            <span className="text-[#71717A]">额度:</span>
            <span className="font-bold text-[#09090B]">
              {credits.available.toLocaleString()}
            </span>
          </Link>

          {/* 语言选择 */}
          <select
            value={locale}
            onChange={(e) =>
              setLocale(e.target.value as "zh_CN" | "en_US" | "id_ID")
            }
            className="border border-[#E4E4E7] px-2 py-1 bg-white text-[11px] font-mono text-[#09090B] focus:outline-none cursor-pointer"
          >
            <option value="zh_CN">中文 (zh_CN)</option>
            <option value="en_US">English (en_US)</option>
            <option value="id_ID">Bahasa (id_ID)</option>
          </select>

          {/* 官网返回入口 */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1 text-[11px] text-[#71717A] hover:text-[#09090B]"
          >
            <span>出海官网</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* 侧边栏与主工作区分屏容器 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧固定菜单 (220px, 发丝右边框) */}
        <aside
          className={clsx(
            "fixed inset-y-14 left-0 z-20 w-56 border-r border-[#E4E4E7] bg-white flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0",
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
                    "flex items-center gap-2.5 px-3 py-2 text-xs font-mono transition-colors select-none",
                    isActive
                      ? "bg-[#09090B] text-white font-medium"
                      : "text-[#71717A] hover:text-[#09090B] hover:bg-[#FAFAFA]"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* 侧栏底部环境元信息 */}
          <div className="p-3.5 border-t border-[#E4E4E7] bg-[#FAFAFA] text-[10px] font-mono text-[#71717A] space-y-1">
            <div className="flex justify-between">
              <span>TENANT:</span>
              <span className="text-[#09090B]">SEA_8892 (Demo)</span>
            </div>
            <div className="flex justify-between">
              <span>TIMEZONE:</span>
              <span className="text-[#09090B] truncate max-w-[100px]">WIB (UTC+7)</span>
            </div>
            <div className="flex justify-between">
              <span>VERSION:</span>
              <span className="text-[#09090B]">Devnet v1.1</span>
            </div>
          </div>
        </aside>

        {/* 右侧主工作区画布 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#FFFFFF]">
          <div className="max-w-7xl mx-auto space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
