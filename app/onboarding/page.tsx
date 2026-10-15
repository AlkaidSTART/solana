"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/use-app-store";
import { useOnboardingStore } from "@/stores/use-onboarding-store";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  CheckCircle2,
  Check,
  ArrowRight,
  ArrowLeft,
  Gift,
  Sparkles,
  LogOut,
  Home,
  RotateCcw,
  Globe,
} from "lucide-react";
import { clsx } from "clsx";
import { getI18nText, SUPPORTED_LOCALES, MARKETS, type SupportedLocale } from "@/lib/i18n";

export default function OnboardingPage() {
  const router = useRouter();
  const { locale, setLocale, topupCredits } = useAppStore();

  const steps = [
    { id: 1, label: getI18nText(locale, "onboard_step1_label") },
    { id: 2, label: getI18nText(locale, "onboard_step2_label") },
    { id: 3, label: getI18nText(locale, "onboard_step3_label") },
    { id: 4, label: getI18nText(locale, "onboard_step4_label") },
    { id: 5, label: getI18nText(locale, "onboard_step5_label") },
    { id: 6, label: getI18nText(locale, "onboard_step6_label") },
  ];

  const {
    currentStep,
    selectedPlatform,
    storeUrl,
    wabaId,
    phoneId,
    enableAbandoned,
    enableCod,
    testPhone,
    testSent,
    isCompleted,
    hasStarted,
    lastSavedAt,
    hasHydrated,
    setStep,
    updateDraft,
    resetDraft,
    markCompleted,
  } = useOnboardingStore();

  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [activated, setActivated] = useState(false);
  const emptySubscribe = React.useCallback(() => () => {}, []);
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const handleNext = () => {
    if (currentStep < 6) {
      setStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
  };

  const handleClaimTrialAndFinish = () => {
    topupCredits(0, 100, "TRIAL_WELCOME_GRANT_INITIAL_ONBOARDING");
    markCompleted();
    setActivated(true);
    setTimeout(() => {
      router.push("/console");
    }, 800);
  };

  const handleExitToHome = () => {
    setExitModalOpen(false);
    router.push("/");
  };

  const handleExitToConsole = () => {
    setExitModalOpen(false);
    router.push("/console");
  };

  // 格式化上次保存时间
  const formattedSavedTime = React.useMemo(() => {
    if (!lastSavedAt) return null;
    try {
      const date = new Date(lastSavedAt);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  }, [lastSavedAt]);

  const showRecoveryBanner =
    isMounted && hasHydrated && (hasStarted || currentStep > 2) && !isCompleted;

  return (
    <div className="min-h-screen bg-white text-[#09090B] font-sans flex flex-col justify-between selection:bg-[#09090B] selection:text-white">
      {/* 顶部状态栏 */}
      <header className="h-16 border-b border-[#E4E4E7] px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-base font-bold tracking-tight text-[#09090B] hover:opacity-80 transition-opacity"
          >
            SolaFlow AI
          </Link>
          <span className="text-xs font-mono text-[#71717A] hidden sm:inline">
            {getI18nText(locale, "onboard_title")}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* 国际化语言选择器 */}
          <div className="flex items-center gap-1.5 border border-[#E4E4E7] px-2 py-1 text-xs font-mono rounded bg-white">
            <Globe className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as SupportedLocale)}
              className="bg-transparent text-zinc-800 font-mono text-xs focus:outline-none cursor-pointer"
              aria-label="Language"
            >
              {SUPPORTED_LOCALES.map((loc) => {
                const m = MARKETS[loc];
                return (
                  <option key={loc} value={loc}>
                    {m.flag} {m.nativeLabel} ({m.shortLabel})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 自动保存状态指示 */}
          {isMounted && (
            <span className="text-[11px] font-mono text-emerald-600 hidden md:inline-flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {getI18nText(locale, "onboard_auto_saved")}
            </span>
          )}

          {/* 任意阶段安全退出按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExitModalOpen(true)}
            className="text-xs font-mono text-[#71717A] hover:text-[#09090B] flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{getI18nText(locale, "onboard_btn_exit")}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExitToConsole}
            className="text-xs font-mono hidden sm:inline-flex"
          >
            {getI18nText(locale, "nav_overview")} →
          </Button>
        </div>
      </header>

      {/* 企业级入驻步骤条指示器 */}
      <div className="border-b border-[#E4E4E7] bg-[#FAFAFA] py-4 px-6 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex items-center justify-between min-w-[560px]">
          {steps.map((s, idx) => {
            const isCompletedStep = s.id < currentStep;
            const isCurrent = s.id === currentStep;
            const canJump = s.id <= currentStep;

            return (
              <React.Fragment key={s.id}>
                <div
                  onClick={() => canJump && setStep(s.id)}
                  className={clsx(
                    "flex items-center gap-2 text-xs font-mono select-none transition-opacity",
                    canJump ? "cursor-pointer hover:opacity-80" : "cursor-default"
                  )}
                  title={canJump ? `切换到步骤 ${s.id}` : undefined}
                >
                  <div
                    className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] border transition-colors",
                      isCompletedStep
                        ? "bg-[#09090B] text-white border-[#09090B]"
                        : isCurrent
                        ? "bg-white text-[#09090B] border-[#09090B] ring-2 ring-[#09090B]/10"
                        : "bg-white text-[#A1A1AA] border-[#E4E4E7]"
                    )}
                  >
                    {isCompletedStep ? <Check className="w-3.5 h-3.5 text-white" /> : s.id}
                  </div>
                  <span
                    className={clsx(
                      isCurrent
                        ? "text-[#09090B] font-bold"
                        : isCompletedStep
                        ? "text-[#27272A]"
                        : "text-[#A1A1AA]"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-[1px] bg-[#E4E4E7] mx-3" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 主向导视窗 */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-12 flex flex-col justify-center space-y-4">
        {/* 进度自动恢复提醒横幅 */}
        {showRecoveryBanner && (
          <div className="border border-emerald-200 bg-emerald-50/70 p-3.5 rounded-lg flex items-center justify-between text-xs font-mono text-emerald-950">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {getI18nText(locale, "onboard_step_of")} <strong>{currentStep} · {steps[currentStep - 1]?.label}</strong>
                {formattedSavedTime && (
                  <span className="text-emerald-700/80 ml-1.5 text-[11px]">
                    (自动暂存于 {formattedSavedTime})
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="text-[11px] underline text-emerald-800 hover:text-emerald-950 font-medium ml-3 cursor-pointer shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              {getI18nText(locale, "onboard_btn_reset")}
            </button>
          </div>
        )}

        <div className="border border-[#E4E4E7] bg-white p-6 sm:p-8 space-y-6">
          {/* 步骤 1: 账号注册 */}
          {currentStep === 1 && (
            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                <h2 className="text-base font-bold uppercase text-[#09090B]">
                  {steps[0]?.label}: {getI18nText(locale, "onboard_step1_title")}
                </h2>
              </div>
              <p className="text-[#71717A] leading-relaxed">
                {getI18nText(locale, "onboard_step1_desc")}
              </p>
            </div>
          )}

          {/* 步骤 2: 电商授权 */}
          {currentStep === 2 && (
            <div className="space-y-5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#71717A] uppercase block">STEP 02</span>
                <h2 className="text-base font-bold uppercase text-[#09090B]">
                  {steps[1]?.label}: {getI18nText(locale, "onboard_step2_title")}
                </h2>
                <p className="text-[#71717A] mt-1">
                  {getI18nText(locale, "onboard_step2_desc")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => updateDraft({ selectedPlatform: "woocommerce" })}
                  className={clsx(
                    "p-4 border cursor-pointer transition-colors space-y-2",
                    selectedPlatform === "woocommerce"
                      ? "bg-[#FAFAFA] border-[#09090B]"
                      : "bg-white border-[#E4E4E7] hover:border-[#09090B]"
                  )}
                >
                  <div className="font-bold text-[#09090B]">WooCommerce</div>
                  <div className="text-[10px] text-[#71717A]">
                    {getI18nText(locale, "onboard_step2_webhook_hint")}
                  </div>
                </div>

                <div
                  onClick={() => updateDraft({ selectedPlatform: "shopify" })}
                  className={clsx(
                    "p-4 border cursor-pointer transition-colors space-y-2",
                    selectedPlatform === "shopify"
                      ? "bg-[#FAFAFA] border-[#09090B]"
                      : "bg-white border-[#E4E4E7] hover:border-[#09090B]"
                  )}
                >
                  <div className="font-bold text-[#09090B]">Shopify App</div>
                  <div className="text-[10px] text-[#71717A]">
                    {getI18nText(locale, "onboard_step2_webhook_hint")}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[#71717A] uppercase text-[10px] block mb-1">
                  {getI18nText(locale, "onboard_step2_store_url_label")}
                </label>
                <input
                  type="text"
                  value={storeUrl}
                  onChange={(e) => updateDraft({ storeUrl: e.target.value })}
                  placeholder="https://my-store.com"
                  className="w-full p-2 border border-[#E4E4E7] focus:outline-none focus:border-[#09090B]"
                />
              </div>
            </div>
          )}

          {/* 步骤 3: WhatsApp 绑定 */}
          {currentStep === 3 && (
            <div className="space-y-5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#71717A] uppercase block">STEP 03</span>
                <h2 className="text-base font-bold uppercase text-[#09090B]">
                  {steps[2]?.label}: {getI18nText(locale, "onboard_step3_title")}
                </h2>
                <p className="text-[#71717A] mt-1">
                  {getI18nText(locale, "onboard_step3_desc")}
                </p>
              </div>

              <div className="space-y-3">
                <Button className="w-full h-11 text-xs">
                  Meta Embedded Signup (WABA)
                </Button>

                <div className="text-center text-[10px] text-[#71717A] uppercase">
                  —— API ——
                </div>

                <div className="space-y-3 p-4 bg-[#FAFAFA] border border-[#E4E4E7]">
                  <div>
                    <label className="text-[#71717A] text-[10px] block mb-1">
                      {getI18nText(locale, "onboard_step3_waba_label")}
                    </label>
                    <input
                      type="text"
                      value={wabaId}
                      onChange={(e) => updateDraft({ wabaId: e.target.value })}
                      className="w-full p-2 bg-white border border-[#E4E4E7] focus:outline-none focus:border-[#09090B]"
                    />
                  </div>
                  <div>
                    <label className="text-[#71717A] text-[10px] block mb-1">
                      {getI18nText(locale, "onboard_step3_phone_label")}
                    </label>
                    <input
                      type="text"
                      value={phoneId}
                      onChange={(e) => updateDraft({ phoneId: e.target.value })}
                      className="w-full p-2 bg-white border border-[#E4E4E7] focus:outline-none focus:border-[#09090B]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步骤 4: 规则与模板 */}
          {currentStep === 4 && (
            <div className="space-y-5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#71717A] uppercase block">STEP 04</span>
                <h2 className="text-base font-bold uppercase text-[#09090B]">
                  {steps[3]?.label}: {getI18nText(locale, "onboard_step4_title")}
                </h2>
                <p className="text-[#71717A] mt-1">
                  {getI18nText(locale, "onboard_step4_desc")}
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3.5 border border-[#E4E4E7] bg-[#FAFAFA] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAbandoned}
                    onChange={(e) => updateDraft({ enableAbandoned: e.target.checked })}
                    className="mt-0.5 accent-[#09090B]"
                  />
                  <div>
                    <div className="font-bold text-[#09090B]">
                      {getI18nText(locale, "onboard_step4_cart_title")}
                    </div>
                    <div className="text-[11px] text-[#71717A] mt-0.5">
                      {getI18nText(locale, "onboard_step4_cart_desc")}
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 border border-[#E4E4E7] bg-[#FAFAFA] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCod}
                    onChange={(e) => updateDraft({ enableCod: e.target.checked })}
                    className="mt-0.5 accent-[#09090B]"
                  />
                  <div>
                    <div className="font-bold text-[#09090B]">
                      {getI18nText(locale, "onboard_step4_cod_title")}
                    </div>
                    <div className="text-[11px] text-[#71717A] mt-0.5">
                      {getI18nText(locale, "onboard_step4_cod_desc")}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* 步骤 5: 仿真演练 */}
          {currentStep === 5 && (
            <div className="space-y-5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#71717A] uppercase block">STEP 05</span>
                <h2 className="text-base font-bold uppercase text-[#09090B]">
                  {steps[4]?.label}: {getI18nText(locale, "onboard_step5_title")}
                </h2>
                <p className="text-[#71717A] mt-1">
                  {getI18nText(locale, "onboard_step5_desc")}
                </p>
              </div>

              <div>
                <label className="text-[#71717A] uppercase text-[10px] block mb-1">
                  {getI18nText(locale, "onboard_step5_phone_label")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => updateDraft({ testPhone: e.target.value })}
                    className="flex-1 p-2 border border-[#E4E4E7] focus:outline-none focus:border-[#09090B]"
                  />
                  <Button
                    onClick={() => updateDraft({ testSent: true })}
                    variant={testSent ? "outline" : "primary"}
                  >
                    {testSent ? getI18nText(locale, "action_refresh") : getI18nText(locale, "onboard_step5_send_btn")}
                  </Button>
                </div>
              </div>

              {testSent && (
                <div className="p-4 bg-[#059669]/10 border border-[#059669]/20 text-[#059669] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{getI18nText(locale, "onboard_step5_success_msg")}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 步骤 6: 试用激活与 100 Credits */}
          {currentStep === 6 && (
            <div className="space-y-5 text-xs font-mono text-center py-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#09090B] text-white flex items-center justify-center">
                <Gift className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] text-[#71717A] uppercase block">STEP 06 · READY</span>
                <h2 className="text-xl font-bold uppercase text-[#09090B] mt-1">
                  {getI18nText(locale, "onboard_step6_title")}
                </h2>
                <p className="text-xs text-[#71717A] mt-2 max-w-md mx-auto leading-relaxed">
                  {getI18nText(locale, "onboard_step6_desc")}
                </p>
              </div>

              <div className="pt-2 max-w-sm mx-auto space-y-2">
                <Button
                  onClick={handleClaimTrialAndFinish}
                  disabled={activated}
                  className="w-full h-12 text-xs"
                >
                  {activated ? getI18nText(locale, "status_pending") : getI18nText(locale, "onboard_btn_finish")}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExitModalOpen(true)}
                  className="text-[11px] text-[#71717A] hover:text-[#09090B] w-full"
                >
                  {getI18nText(locale, "onboard_btn_exit")}
                </Button>
              </div>
            </div>
          )}

          {/* 底部上一步/下一步控制条 */}
          {currentStep < 6 && (
            <div className="pt-6 border-t border-[#E4E4E7] flex justify-between items-center">
              <Button
                variant="outline"
                disabled={currentStep <= 1}
                onClick={handleBack}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                {getI18nText(locale, "onboard_btn_back")}
              </Button>

              {/* 辅助退出入口 */}
              <button
                type="button"
                onClick={() => setExitModalOpen(true)}
                className="text-xs font-mono text-[#71717A] hover:text-[#09090B] underline cursor-pointer"
              >
                {getI18nText(locale, "onboard_btn_exit")}
              </button>

              <Button onClick={handleNext}>
                {getI18nText(locale, "onboard_btn_next")}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* 底部状态 */}
      <footer className="h-12 border-t border-[#E4E4E7] px-6 flex items-center justify-between text-[11px] font-mono text-[#71717A]">
        <span>SolaFlow AI Merchant Onboarding</span>
        <span>Meta BAA Compliant</span>
      </footer>

      {/* 退出向导确认对话框 */}
      <Modal
        open={exitModalOpen}
        onClose={() => setExitModalOpen(false)}
        title={getI18nText(locale, "onboard_exit_modal_title")}
        subtitle={getI18nText(locale, "onboard_exit_modal_desc")}
        width="md"
      >
        <div className="space-y-4 text-xs font-mono">
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between text-zinc-900 font-bold">
              <span>{getI18nText(locale, "onboard_auto_saved")}</span>
              <span className="text-emerald-600 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> {getI18nText(locale, "status_normal")}
              </span>
            </div>
            <div className="text-zinc-700 font-medium">
              {getI18nText(locale, "onboard_step_of")} {currentStep} / 6: {steps[currentStep - 1]?.label}
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              {getI18nText(locale, "onboard_exit_modal_desc")}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              className="w-full justify-center h-10 text-xs bg-zinc-900 text-white hover:bg-zinc-800"
              onClick={handleExitToHome}
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              {getI18nText(locale, "onboard_exit_to_home")}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-center h-10 text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              onClick={handleExitToConsole}
            >
              {getI18nText(locale, "onboard_exit_to_console")} →
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-center h-9 text-xs text-zinc-500 hover:text-zinc-800"
              onClick={() => setExitModalOpen(false)}
            >
              {getI18nText(locale, "action_cancel")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 重置向导进度确认对话框 */}
      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={getI18nText(locale, "onboard_reset_modal_title")}
        width="sm"
      >
        <div className="space-y-4 text-xs font-mono">
          <p className="text-zinc-600 leading-relaxed">
            {getI18nText(locale, "onboard_reset_modal_desc")}
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetModalOpen(false)}
            >
              {getI18nText(locale, "action_cancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                resetDraft();
                setResetModalOpen(false);
              }}
            >
              {getI18nText(locale, "onboard_reset_confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
