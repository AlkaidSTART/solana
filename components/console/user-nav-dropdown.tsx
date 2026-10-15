"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/use-app-store";
import { getI18nText } from "@/lib/i18n";
import { authApi } from "@/lib/api";
import {
  User,
  ShieldCheck,
  Coins,
  Wallet,
  Copy,
  Check,
  ChevronDown,
  LogOut,
  Settings,
  CreditCard,
} from "lucide-react";
import { clsx } from "clsx";

export interface UserNavDropdownProps {
  sessionEmail?: string;
  tenantName?: string;
}

export function UserNavDropdown({ sessionEmail, tenantName }: UserNavDropdownProps) {
  const router = useRouter();
  const { userProfile, credits, locale, disconnectWallet, connectWallet } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // 优先级：后端认证 session 邮箱 > 本地 profile 邮箱
  const displayEmail = sessionEmail || userProfile.email;
  const displayName = userProfile.name;
  const displayRole = userProfile.role;
  const displayTenant = tenantName || userProfile.tenantName;

  // 点击外部或按 Escape 关闭下拉
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleCopyWallet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(userProfile.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 兼容性降级
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // 即使后端会话清理失败，也导向登录页
    } finally {
      router.push("/login");
    }
  };

  const truncatedAddress = userProfile.walletAddress
    ? `${userProfile.walletAddress.slice(0, 4)}...${userProfile.walletAddress.slice(-4)}`
    : "";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* 触发器胶囊按钮 */}
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={getI18nText(locale, "user_assets_title")}
        className={clsx(
          "flex items-center gap-2 pl-1.5 pr-2.5 py-1 border rounded-lg transition-all select-none font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
          isOpen
            ? "border-emerald-500 bg-emerald-50/40 text-zinc-900 shadow-xs"
            : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-800 shadow-2xs"
        )}
      >
        {/* 默认用户头像（采用图标库 User 矢量图标） */}
        <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200/80 text-zinc-600 flex items-center justify-center shrink-0">
          {userProfile.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-3.5 h-3.5 text-zinc-600" />
          )}
        </div>

        {/* 姓名与角色 */}
        <div className="hidden sm:flex flex-col text-left leading-none max-w-[120px]">
          <span className="font-semibold text-zinc-900 truncate text-[11px]">{displayName}</span>
          <span className="text-[9px] text-zinc-400 font-mono tracking-tight mt-0.5 truncate">
            {displayRole} · {getI18nText(locale, "demo_badge")}
          </span>
        </div>

        <ChevronDown
          className={clsx(
            "w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-emerald-600"
          )}
        />
      </button>

      {/* 展开的下拉资产与身份面板 */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-80 sm:w-88 rounded-xl bg-white border border-zinc-200 shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 font-sans"
        >
          {/* 区块 1：商户身份名片 */}
          <div className="p-4 bg-gradient-to-b from-zinc-50/80 to-white border-b border-zinc-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 flex items-center justify-center shrink-0 shadow-xs">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-zinc-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-semibold text-sm text-zinc-900 truncate">{displayName}</h3>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                    {displayRole}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400">
                    [{getI18nText(locale, "demo_badge")}]
                  </span>
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5 font-mono">{displayEmail}</p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400 font-mono">
                  <span className="text-zinc-600 font-medium">{displayTenant}</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 区块 2：商户资产总览 (Credits + Solana 钱包) */}
          <div className="p-3.5 space-y-3 bg-zinc-50/50">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span className="uppercase font-semibold tracking-wider flex items-center gap-1">
                <Coins className="w-3 h-3 text-emerald-600" />
                {getI18nText(locale, "user_assets_title")}
              </span>
              <span className="text-[10px] text-zinc-400">Solana Devnet</span>
            </div>

            {/* A. AI Credits 资产 */}
            <div className="bg-white rounded-lg p-2.5 border border-zinc-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Coins className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-900 leading-none">
                      {credits.available.toLocaleString()}{" "}
                      <span className="text-[10px] text-zinc-400 font-normal">Credits</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {getI18nText(locale, "overview_stat_reserved")}: {credits.reserved}
                    </div>
                  </div>
                </div>
                <Link
                  href="/console/billing"
                  onClick={() => setIsOpen(false)}
                  className="px-2 py-1 text-[10px] font-mono font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                >
                  {getI18nText(locale, "user_action_topup")}
                </Link>
              </div>
            </div>

            {/* B. Solana Web3 钱包资产 */}
            <div className="bg-white rounded-lg p-2.5 border border-zinc-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-medium text-zinc-800">
                    {getI18nText(locale, "user_assets_wallet")}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  {userProfile.isWalletConnected ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        {getI18nText(locale, "user_wallet_connected")}
                      </span>
                      <button
                        type="button"
                        onClick={() => disconnectWallet()}
                        className="text-zinc-400 hover:text-rose-600 underline text-[9px]"
                      >
                        {getI18nText(locale, "console_wallet_disconnect_btn")}
                      </button>
                    </div>
                  ) : (
                    <span className="text-zinc-400">
                      {getI18nText(locale, "user_wallet_disconnected")}
                    </span>
                  )}
                </div>
              </div>

              {/* 钱包地址与余额 */}
              {userProfile.isWalletConnected ? (
                <div className="pt-1 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-zinc-600">
                    <span>{truncatedAddress}</span>
                    <button
                      type="button"
                      onClick={handleCopyWallet}
                      title={getI18nText(locale, "user_action_copy_address")}
                      className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    {copied && (
                      <span className="text-[9px] text-emerald-600 font-sans">
                        {getI18nText(locale, "user_copied_address")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <span className="text-zinc-900 font-bold">{userProfile.solBalance}</span>
                    <span className="text-zinc-300">·</span>
                    <span className="text-indigo-600 font-bold">{userProfile.usdcBalance}</span>
                  </div>
                </div>
              ) : (
                <div className="pt-1 border-t border-zinc-100 flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">{getI18nText(locale, "console_wallet_not_connected")}</span>
                  <button
                    type="button"
                    onClick={() => connectWallet()}
                    className="text-emerald-700 font-medium hover:underline text-xs"
                  >
                    {getI18nText(locale, "console_wallet_connect_btn")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 区块 3：快捷导航与操作 */}
          <div className="p-2 divide-y divide-zinc-100 text-xs font-mono">
            <div className="space-y-0.5 pb-1">
              <Link
                href="/console/billing"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                <span>{getI18nText(locale, "nav_billing")}</span>
              </Link>
              <Link
                href="/console/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>{getI18nText(locale, "nav_settings")}</span>
              </Link>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>{getI18nText(locale, "user_logout")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
