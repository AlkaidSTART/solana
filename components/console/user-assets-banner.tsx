"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/stores/use-app-store";
import { getI18nText } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  ShieldCheck,
  Coins,
  Wallet,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Settings,
} from "lucide-react";

export interface UserAssetsBannerProps {
  sessionEmail?: string;
  tenantName?: string;
}

export function UserAssetsBanner({ sessionEmail, tenantName }: UserAssetsBannerProps) {
  const { userProfile, credits, locale, disconnectWallet, connectWallet } = useAppStore();
  const [copied, setCopied] = useState(false);

  const displayEmail = sessionEmail || userProfile.email;
  const displayName = userProfile.name;
  const displayRole = userProfile.role;
  const displayTenant = tenantName || userProfile.tenantName;

  const truncatedAddress = userProfile.walletAddress
    ? `${userProfile.walletAddress.slice(0, 4)}...${userProfile.walletAddress.slice(-4)}`
    : "";

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(userProfile.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const estimatedUsdc = (credits.available * 0.02).toFixed(2);

  return (
    <Card className="overflow-hidden border-zinc-200/90 shadow-xs bg-white">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
          {/* 左侧：商户主理人身份模块 (占 4 列) */}
          <div className="lg:col-span-4 p-5 sm:p-6 bg-gradient-to-br from-zinc-50/70 via-white to-zinc-50/30 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 flex items-center justify-center shadow-xs">
                    {userProfile.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt={displayName}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-base text-zinc-900 tracking-tight">
                        {displayName}
                      </h2>
                      <Badge variant="success" className="text-[10px] px-1.5 py-0.2">
                        {displayRole}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-zinc-500 mt-0.5 truncate max-w-[210px]">
                      {displayEmail}
                    </p>
                  </div>
                </div>

                <Link href="/console/settings" title={getI18nText(locale, "nav_settings")}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-700">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* 商户与网络身份标签 */}
              <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium">
                  {displayTenant}
                </span>
                <span className="text-zinc-300">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Meta Verified
                </span>
                <span className="text-zinc-300">·</span>
                <span className="text-zinc-400">
                  [{getI18nText(locale, "demo_badge")}]
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>{getI18nText(locale, "console_wallet_ready")}</span>
              <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                {getI18nText(locale, "console_wallet_active")}
              </span>
            </div>
          </div>

          {/* 右侧：三列高密资产网格 (占 8 列) */}
          <div className="lg:col-span-8 p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 资产 1：SolaFlow AI Credits */}
            <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    {getI18nText(locale, "user_assets_credits")}
                  </span>
                  <span className="text-[10px] text-zinc-400">{getI18nText(locale, "console_credits_platform")}</span>
                </div>
                <div className="text-2xl font-bold font-mono text-zinc-900 tracking-tight">
                  {credits.available.toLocaleString()}
                </div>
                <div className="text-[11px] font-mono text-zinc-500 flex justify-between">
                  <span>{getI18nText(locale, "console_credits_reserved_label")}: {credits.reserved}</span>
                  <span className="text-emerald-700 font-medium">≈ ${estimatedUsdc} USDC</span>
                </div>
              </div>

              <Link href="/console/billing" className="block pt-1">
                <Button size="sm" className="w-full text-xs font-mono h-7 justify-center bg-zinc-900 hover:bg-zinc-800 text-white">
                  <CreditCard className="w-3 h-3 mr-1" />
                  {getI18nText(locale, "user_action_topup")}
                </Button>
              </Link>
            </div>

            {/* 资产 2：Solana Devnet Web3 钱包资产 */}
            <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Wallet className="w-4 h-4 text-indigo-600" />
                    {getI18nText(locale, "user_assets_wallet")}
                  </span>
                  {userProfile.isWalletConnected ? (
                    <span className="text-[10px] font-mono text-emerald-600 font-medium">
                      {getI18nText(locale, "user_wallet_connected")}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-400">
                      {getI18nText(locale, "user_wallet_disconnected")}
                    </span>
                  )}
                </div>

                {userProfile.isWalletConnected ? (
                  <>
                    <div className="text-xl font-bold font-mono text-zinc-900 flex items-center justify-between pt-0.5">
                      <span>{userProfile.solBalance}</span>
                      <span className="text-sm text-indigo-600 font-semibold">{userProfile.usdcBalance}</span>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-500 flex items-center justify-between">
                      <span className="truncate max-w-[120px]">{truncatedAddress}</span>
                      <button
                        type="button"
                        onClick={handleCopyWallet}
                        className="text-zinc-400 hover:text-zinc-700 p-0.5"
                        title={getI18nText(locale, "user_action_copy_address")}
                      >
                        {copied ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-2 text-xs text-zinc-400 font-mono">
                    {getI18nText(locale, "console_wallet_bind_prompt")}
                  </div>
                )}
              </div>

              <div className="pt-1">
                {userProfile.isWalletConnected ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => disconnectWallet()}
                    className="w-full text-xs font-mono h-7 justify-center text-zinc-600 hover:text-zinc-900"
                  >
                    {getI18nText(locale, "console_wallet_disconnect_btn")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => connectWallet()}
                    className="w-full text-xs font-mono h-7 justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {getI18nText(locale, "console_wallet_connect_btn")}
                  </Button>
                )}
              </div>
            </div>

            {/* 资产 3：跨境电商已挽回 GMV 资产 */}
            <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    {getI18nText(locale, "overview_stat_recovered")}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">+24.8%</span>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700 tracking-tight">
                  $14,250
                </div>
                <div className="text-[11px] font-mono text-zinc-500 flex justify-between">
                  <span>{locale.startsWith("zh") ? "约 Rp 218M 印尼盾" : "≈ Rp 218M IDR"}</span>
                  <span className="text-zinc-400">{locale.startsWith("zh") ? "全渠道累计" : "Omnichannel Total"}</span>
                </div>
              </div>

              <Link href="/console/orders" className="block pt-1">
                <Button size="sm" variant="outline" className="w-full text-xs font-mono h-7 justify-center">
                  {getI18nText(locale, "nav_orders")}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
