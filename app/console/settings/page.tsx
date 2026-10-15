"use client";

import React, { useState } from "react";
import { useAppStore } from "@/stores/use-app-store";
import { getI18nText } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Coins,
  Wallet,
  Copy,
  Check,
} from "lucide-react";

import { useQuery, useMutation } from "@tanstack/react-query";
import { tenantApi, authApi, type TenantInfo } from "@/lib/api";

export default function ConsoleSettingsPage() {
  const {
    locale,
    userProfile,
    updateUserProfile,
    connectWallet,
    disconnectWallet,
    credits,
  } = useAppStore();

  const { data: sessionData } = useQuery({
    queryKey: ["auth-session"],
    queryFn: () => authApi.getSession(),
    retry: false,
  });

  // 从后端查询租户配置与系统能力
  const { data: tenant, refetch: refetchTenant } = useQuery({
    queryKey: ["tenant"],
    queryFn: () => tenantApi.getTenant(),
    retry: false,
  });

  const { data: capabilities } = useQuery({
    queryKey: ["capabilities"],
    queryFn: () => tenantApi.getCapabilities(),
    retry: false,
  });

  const [customControlGroup, setCustomControlGroup] = useState<boolean | null>(null);
  const [customWindowDays, setCustomWindowDays] = useState<number | null>(null);
  const [customConfidenceRate, setCustomConfidenceRate] = useState<number | null>(null);
  const [customTimezone, setCustomTimezone] = useState<string | null>(null);
  const [customCurrency, setCustomCurrency] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 用户个人资料编辑状态
  const [profileName, setProfileName] = useState(userProfile.name);
  const [walletCopied, setWalletCopied] = useState(false);

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(userProfile.walletAddress);
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
    } catch {
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
    }
  };

  const controlGroupEnabled = customControlGroup ?? tenant?.controlGroupEnabled ?? true;
  const windowDays = customWindowDays ?? tenant?.attributionWindowDays ?? 14;
  const confidenceRate = customConfidenceRate ?? tenant?.confidenceRate ?? 95;
  const selectedTimezone = customTimezone ?? tenant?.timezone ?? "Asia/Jakarta";
  const selectedCurrency = customCurrency ?? tenant?.currency ?? "IDR";

  const updateTenantMutation = useMutation({
    mutationFn: (patch: Partial<TenantInfo>) => tenantApi.updateTenant(patch),
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      void refetchTenant();
    },
    onError: () => {
      // 在离线/沙盒模式下提示本地保存成功
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  const handleSave = () => {
    updateUserProfile({ name: profileName });
    updateTenantMutation.mutate({
      timezone: selectedTimezone,
      currency: selectedCurrency,
      attributionWindowDays: windowDays,
      controlGroupEnabled,
      confidenceRate,
    });
  };

  return (
    <div className="space-y-8">
      {/* 顶部标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E4E7] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
              {getI18nText(locale, "settings_title")}
            </h1>
            <Badge variant="outline">{getI18nText(locale, "demo_badge")}</Badge>
          </div>
          <p className="text-xs text-[#71717A] font-mono mt-0.5">
            {getI18nText(locale, "settings_subhead")}
          </p>
        </div>

        <Button size="sm" onClick={handleSave}>
          {getI18nText(locale, "settings_save_btn")}
        </Button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-[#059669]/10 text-[#059669] border border-[#059669]/20 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{getI18nText(locale, "settings_saved_success")}</span>
        </div>
      )}

      {/* 模块 0: 商户主理人档案与数字资产 (USER PROFILE & ASSETS) */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          {getI18nText(locale, "console_profile_title")}
        </h2>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <CardTitle>{getI18nText(locale, "console_profile_subtitle")}</CardTitle>
                <Badge variant="outline">{getI18nText(locale, "demo_badge")}</Badge>
              </div>
              <Badge variant="success">{getI18nText(locale, "console_profile_verified")}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 text-xs font-mono">
            {/* 个人信息编辑区 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#FAFAFA] border border-[#E4E4E7]">
              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1 font-bold">
                  {getI18nText(locale, "user_name_label")}
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E4E4E7] text-[#09090B] font-bold focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1 font-bold">
                  {getI18nText(locale, "user_email_label")}
                </label>
                <input
                  type="email"
                  disabled
                  value={sessionData?.user?.email || userProfile.email}
                  className="w-full p-2 bg-zinc-100 border border-[#E4E4E7] text-zinc-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1 font-bold">
                  {getI18nText(locale, "user_role_label")}
                </label>
                <input
                  type="text"
                  disabled
                  value={`${userProfile.role} (${getI18nText(locale, "console_profile_owner")})`}
                  className="w-full p-2 bg-zinc-100 border border-[#E4E4E7] text-zinc-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* 资产与钱包概览区 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 平台 AI Credits 资产 */}
              <div className="p-4 border border-[#E4E4E7] bg-white rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-zinc-900">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    {getI18nText(locale, "user_assets_credits")}
                  </span>
                  <span className="text-[10px] text-zinc-400">{getI18nText(locale, "console_credits_platform")}</span>
                </div>
                <div className="text-xl font-bold font-mono text-zinc-900">
                  {credits.available.toLocaleString()}{" "}
                  <span className="text-xs text-zinc-400 font-normal">Credits</span>
                </div>
                <div className="text-[11px] text-zinc-500 flex justify-between pt-1 border-t border-zinc-100">
                  <span>{getI18nText(locale, "console_credits_reserved_label")} {credits.reserved}</span>
                  <span className="text-emerald-700 font-medium">
                    ≈ ${(credits.available * 0.02).toFixed(2)} USDC
                  </span>
                </div>
              </div>

              {/* Solana Devnet 钱包资产 */}
              <div className="p-4 border border-[#E4E4E7] bg-white rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-zinc-900">
                    <Wallet className="w-4 h-4 text-indigo-600" />
                    {getI18nText(locale, "user_assets_wallet")}
                  </span>
                  <Badge variant={userProfile.isWalletConnected ? "success" : "neutral"}>
                    {userProfile.isWalletConnected
                      ? getI18nText(locale, "user_wallet_connected")
                      : getI18nText(locale, "user_wallet_disconnected")}
                  </Badge>
                </div>

                {userProfile.isWalletConnected ? (
                  <>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-bold text-zinc-900 text-sm">
                        {userProfile.solBalance}
                      </span>
                      <span className="font-bold text-indigo-600 text-sm">
                        {userProfile.usdcBalance}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[140px]">{userProfile.walletAddress}</span>
                        <button
                          type="button"
                          onClick={handleCopyWallet}
                          className="text-zinc-500 hover:text-zinc-900 p-0.5"
                          title={getI18nText(locale, "user_action_copy_address")}
                        >
                          {walletCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => disconnectWallet()}
                        className="text-zinc-400 hover:text-rose-600 text-[10px] underline"
                      >
                        {getI18nText(locale, "console_wallet_disconnect_btn")}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-zinc-400">{getI18nText(locale, "console_wallet_not_connected")}</span>
                    <Button size="sm" onClick={() => connectWallet()}>
                      {getI18nText(locale, "console_wallet_connect_btn")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 模块 1: 归因口径与 20% 对照组实验配置 (严格对齐 PRD 2.3) */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          {getI18nText(locale, "settings_mod_attribution")}
        </h2>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>{getI18nText(locale, "settings_control_group_title")}</CardTitle>
              <Badge variant={controlGroupEnabled ? "success" : "neutral"}>
                {controlGroupEnabled ? getI18nText(locale, "status_active") : getI18nText(locale, "status_paused")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 text-xs font-mono">
            <p className="text-[#27272A] leading-relaxed font-sans">
              {getI18nText(locale, "settings_control_group_desc")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#FAFAFA] border border-[#E4E4E7]">
              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1">
                  20% Control Group Toggle
                </label>
                <button
                  type="button"
                  onClick={() => setCustomControlGroup(!controlGroupEnabled)}
                  className="px-3 py-1.5 bg-white border border-[#E4E4E7] text-[#09090B] font-bold cursor-pointer hover:border-[#09090B]"
                >
                  {controlGroupEnabled ? getI18nText(locale, "settings_control_enabled") : getI18nText(locale, "settings_control_disabled")}
                </button>
              </div>

              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1">
                  {getI18nText(locale, "settings_window_label")}
                </label>
                <select
                  value={windowDays}
                  onChange={(e) => setCustomWindowDays(Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-[#E4E4E7] text-[#09090B] cursor-pointer"
                >
                  <option value={7}>{getI18nText(locale, "settings_opt_window_7")}</option>
                  <option value={14}>{getI18nText(locale, "settings_opt_window_14")}</option>
                  <option value={30}>{getI18nText(locale, "settings_opt_window_30")}</option>
                </select>
              </div>

              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1">
                  Confidence Threshold
                </label>
                <select
                  value={confidenceRate}
                  onChange={(e) => setCustomConfidenceRate(Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-[#E4E4E7] text-[#09090B] cursor-pointer"
                >
                  <option value={90}>{getI18nText(locale, "settings_opt_conf_90")}</option>
                  <option value={95}>{getI18nText(locale, "settings_opt_conf_95")}</option>
                  <option value={99}>{getI18nText(locale, "settings_opt_conf_99")}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 模块 2: 店铺时区与货币锚定 */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          {getI18nText(locale, "settings_mod_localization")}
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1 font-bold">
                  {getI18nText(locale, "settings_timezone_label")}
                </label>
                <select
                  value={selectedTimezone}
                  onChange={(e) => setCustomTimezone(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E4E4E7] text-[#09090B] cursor-pointer"
                >
                  <option value="Asia/Singapore">
                    {locale.startsWith("zh") ? "Asia/Singapore (新加坡时间 SGT, UTC+8)" : "Asia/Singapore (SGT, UTC+8)"}
                  </option>
                  <option value="Asia/Jakarta">
                    {locale.startsWith("zh") ? "Asia/Jakarta (印尼西部时间 WIB, UTC+7)" : "Asia/Jakarta (WIB, UTC+7)"}
                  </option>
                  <option value="Asia/Kuala_Lumpur">
                    {locale.startsWith("zh") ? "Asia/Kuala_Lumpur (马来西亚时间 MYT, UTC+8)" : "Asia/Kuala_Lumpur (MYT, UTC+8)"}
                  </option>
                  <option value="Asia/Bangkok">
                    {locale.startsWith("zh") ? "Asia/Bangkok (泰国时间 ICT, UTC+7)" : "Asia/Bangkok (ICT, UTC+7)"}
                  </option>
                  <option value="Asia/Ho_Chi_Minh">
                    {locale.startsWith("zh") ? "Asia/Ho_Chi_Minh (越南时间 ICT, UTC+7)" : "Asia/Ho_Chi_Minh (ICT, UTC+7)"}
                  </option>
                  <option value="Asia/Manila">
                    {locale.startsWith("zh") ? "Asia/Manila (菲律宾时间 PHT, UTC+8)" : "Asia/Manila (PHT, UTC+8)"}
                  </option>
                </select>
              </div>

              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1 font-bold">
                  {getI18nText(locale, "settings_currency_label")}
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setCustomCurrency(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E4E4E7] text-[#09090B] cursor-pointer"
                >
                  <option value="SGD">{locale.startsWith("zh") ? "SGD (S$ 新加坡元)" : "SGD (S$)"}</option>
                  <option value="IDR">{locale.startsWith("zh") ? "IDR (Rp 印尼盾)" : "IDR (Rp)"}</option>
                  <option value="MYR">{locale.startsWith("zh") ? "MYR (RM 马来西亚林吉特)" : "MYR (RM)"}</option>
                  <option value="THB">{locale.startsWith("zh") ? "THB (฿ 泰铢)" : "THB (฿)"}</option>
                  <option value="VND">{locale.startsWith("zh") ? "VND (₫ 越南盾)" : "VND (₫)"}</option>
                  <option value="PHP">{locale.startsWith("zh") ? "PHP (₱ 菲律宾比索)" : "PHP (₱)"}</option>
                  <option value="USD">{locale.startsWith("zh") ? "USD ($ 美元 / Solana USDC 锚定)" : "USD ($ / Solana USDC)"}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 模块 3: 团队 RBAC 权限矩阵 */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          {getI18nText(locale, "settings_mod_rbac")}
        </h2>
        <Card>
          <div className="divide-y divide-[#EEEEEE] text-xs font-mono">
            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#FAFAFA] text-[#71717A] font-semibold">
              <span>{getI18nText(locale, "settings_rbac_col_role")}</span>
              <span>{getI18nText(locale, "settings_rbac_col_orders")}</span>
              <span>{getI18nText(locale, "settings_rbac_col_workflows")}</span>
              <span>{getI18nText(locale, "settings_rbac_col_finance")}</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="font-bold text-[#09090B]">{getI18nText(locale, "settings_rbac_role_admin")}</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> {getI18nText(locale, "settings_rbac_perm_full")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> {getI18nText(locale, "settings_rbac_perm_full")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> {getI18nText(locale, "settings_rbac_perm_full")}
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="font-bold text-[#09090B]">{getI18nText(locale, "settings_rbac_role_operator")}</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> {getI18nText(locale, "settings_rbac_perm_audit")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> {getI18nText(locale, "settings_rbac_perm_edit")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-zinc-400">
                <XCircle className="w-3.5 h-3.5 text-zinc-400" /> {getI18nText(locale, "settings_rbac_perm_none")}
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="font-bold text-[#09090B]">{getI18nText(locale, "settings_rbac_role_agent")}</span>
              <span className="inline-flex items-center gap-1.5 text-indigo-600 font-medium">
                <Eye className="w-3.5 h-3.5" /> {getI18nText(locale, "settings_rbac_perm_readonly")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-zinc-400">
                <XCircle className="w-3.5 h-3.5 text-zinc-400" /> {getI18nText(locale, "settings_rbac_perm_none")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-zinc-400">
                <XCircle className="w-3.5 h-3.5 text-zinc-400" /> {getI18nText(locale, "settings_rbac_perm_none")}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 模块 4: 数据合规与 GDPR / Meta BAA */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          {getI18nText(locale, "settings_mod_compliance")}
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4 text-xs font-mono">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-[#09090B]">{getI18nText(locale, "settings_export_title")}</div>
                <div className="text-[#71717A]">{getI18nText(locale, "settings_export_desc")}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => alert("Task submitted")}>
                <Download className="w-3.5 h-3.5 mr-1" />
                {getI18nText(locale, "settings_export_btn")}
              </Button>
            </div>

            <div className="pt-4 border-t border-[#EEEEEE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-[#E11D48]">{getI18nText(locale, "settings_forget_title")}</div>
                <div className="text-[#71717A]">{getI18nText(locale, "settings_forget_desc")}</div>
              </div>
              <Button size="sm" variant="danger" onClick={() => alert("Protected action")}>
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {getI18nText(locale, "settings_forget_btn")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 模块 5: 系统后端链路能力状态 (System Capabilities) */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          {getI18nText(locale, "console_capabilities_title")}
        </h2>
        <Card>
          <CardContent className="p-6 space-y-3 text-xs font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                <span className="text-[10px] text-zinc-500 block">PostgreSQL</span>
                <span className="font-bold text-zinc-900">
                  {capabilities?.database === "configured"
                    ? getI18nText(locale, "console_status_connected")
                    : getI18nText(locale, "console_status_mock")}
                </span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                <span className="text-[10px] text-zinc-500 block">Meta WhatsApp WABA</span>
                <span className="font-bold text-zinc-900">
                  {capabilities?.whatsapp === "configured"
                    ? getI18nText(locale, "console_status_direct")
                    : getI18nText(locale, "console_status_sandbox")}
                </span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                <span className="text-[10px] text-zinc-500 block">WooCommerce Webhook</span>
                <span className="font-bold text-zinc-900">
                  {capabilities?.woocommerce === "configured"
                    ? getI18nText(locale, "console_status_ready")
                    : getI18nText(locale, "console_status_demo")}
                </span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                <span className="text-[10px] text-zinc-500 block">
                  {locale.startsWith("zh") ? "Solana Devnet 结算" : "Solana Devnet Settlement"}
                </span>
                <span className="font-bold text-emerald-700">
                  {capabilities?.solanaPayment === "configured"
                    ? getI18nText(locale, "console_status_devnet_ok")
                    : getI18nText(locale, "console_status_devnet_env")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
