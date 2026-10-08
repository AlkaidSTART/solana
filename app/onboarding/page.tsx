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
} from "lucide-react";
import { clsx } from "clsx";

const STEPS = [
  { id: 1, label: "账号注册" },
  { id: 2, label: "电商授权" },
  { id: 3, label: "WhatsApp绑定" },
  { id: 4, label: "规则与模板" },
  { id: 5, label: "仿真演练" },
  { id: 6, label: "试用激活" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { topupCredits } = useAppStore();

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
      <header className="h-16 border-b border-[#E4E4E7] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-base font-bold tracking-tight text-[#09090B] hover:opacity-80 transition-opacity"
          >
            SolaFlow AI
          </Link>
          <span className="text-xs font-mono text-[#71717A] hidden sm:inline">
            出海商户 6 步初始化激活向导 (严格对齐 PRD 3.1)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* 自动保存状态指示 */}
          {isMounted && (
            <span className="text-[11px] font-mono text-emerald-600 hidden md:inline-flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              进度已自动保存
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
            <span>退出向导</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExitToConsole}
            className="text-xs font-mono hidden sm:inline-flex"
          >
            控制台 →
          </Button>
        </div>
      </header>

      {/* 企业级入驻步骤条指示器 */}
      <div className="border-b border-[#E4E4E7] bg-[#FAFAFA] py-4 px-6 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex items-center justify-between min-w-[560px]">
          {STEPS.map((s, idx) => {
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
                {idx < STEPS.length - 1 && (
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
                已恢复上次填写的接入进度：<strong>步骤 {currentStep} · {STEPS[currentStep - 1]?.label}</strong>
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
              从头开始
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
                  步骤 1: 商户账号注册完成
                </h2>
              </div>
              <p className="text-[#71717A] leading-relaxed">
                您已使用 merchant@crossborder-shop.com 完成工作邮箱鉴权。
              </p>
            </div>
          )}

          {/* 步骤 2: 电商授权 */}
          {currentStep === 2 && (
            <div className="space-y-5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#71717A] uppercase block">STEP 02</span>
                <h2 className="text-base font-bold uppercase text-[#09090B]">
                  步骤 2: 绑定您的独立电商出海店铺
                </h2>
                <p className="text-[#71717A] mt-1">
                  选择电商品牌平台以监听订单与弃购事件 Webhook (耗时约 30 秒)
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
                  <div className="font-bold text-[#09090B]">WooCommerce 直连</div>
                  <div className="text-[10px] text-[#71717A]">
                    安装 SolaFlow 官方插件或录入 REST API Consumer Key
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
                  <div className="font-bold text-[#09090B]">Shopify App 直连</div>
                  <div className="text-[10px] text-[#71717A]">
                    通过 Shopify App Store 一键官方 OAuth 授权
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[#71717A] uppercase text-[10px] block mb-1">
                  店铺站点公开 URL
                </label>
                <input
                  type="text"
                  value={storeUrl}
                  onChange={(e) => updateDraft({ storeUrl: e.target.value })}
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
                  步骤 3: 绑定商户自有 WhatsApp Business (Meta 官方直连)
                </h2>
                <p className="text-[#71717A] mt-1">
                  SolaFlow 采用商户自有 WABA 模式，消息费用由商户直接向 Meta 结算，保障账号主权
                </p>
              </div>

              <div className="space-y-3">
                <Button className="w-full h-11 text-xs">
                  启动 Meta 官方嵌入式快速登录 (Embedded Signup)
                </Button>

                <div className="text-center text-[10px] text-[#71717A] uppercase">
                  —— 或手动录入 API 凭据 ——
                </div>

                <div className="space-y-3 p-4 bg-[#FAFAFA] border border-[#E4E4E7]">
                  <div>
                    <label className="text-[#71717A] text-[10px] block mb-1">
                      WABA ID (WhatsApp Business Account ID)
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
                      Phone Number ID
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
                  步骤 4: 预装官方获批规则与多语言模板
                </h2>
                <p className="text-[#71717A] mt-1">
                  勾选开箱即用的自动化流程，系统已为您预置 Meta 官方绿色通道获批模板
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
                      15 分钟待支付弃购温和挽回 (WF_RECOVERY_ABANDONED)
                    </div>
                    <div className="text-[11px] text-[#71717A] mt-0.5">
                      支持印尼语、泰语、英语多语言分流，夜间 22:00 ~ 08:00 自动顺延免打扰。
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
                      COD 货到付款发货前地址核验 (WF_COD_CONFIRM)
                    </div>
                    <div className="text-[11px] text-[#71717A] mt-0.5">
                      发货前通过 WhatsApp 发送地址核验消息，引导买家补充真实地标，截流拒签亏损。
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
                  步骤 5: 交互仿真演练 (Dry-Run Test)
                </h2>
                <p className="text-[#71717A] mt-1">
                  向您的测试手机发送一条真实的 WhatsApp 仿真核验消息，亲身体验买家端交互
                </p>
              </div>

              <div>
                <label className="text-[#71717A] uppercase text-[10px] block mb-1">
                  测试手机号 (含国际区号)
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
                    {testSent ? "重新发送" : "发送测试仿真消息"}
                  </Button>
                </div>
              </div>

              {testSent && (
                <div className="p-4 bg-[#059669]/10 border border-[#059669]/20 text-[#059669] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>仿真消息已成功送达您的 WhatsApp！</span>
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    已验证 Webhook 回执与双向状态同步，您的商业通道已就绪。
                  </p>
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
                  激活店铺并领取 100 免费 Credits
                </h2>
                <p className="text-xs text-[#71717A] mt-2 max-w-md mx-auto leading-relaxed">
                  恭喜！您的店铺已成功接入 SolaFlow AI 神经规则引擎。点击下方按钮立即派发 100 Credits 试用额度并进入控制台。
                </p>
              </div>

              <div className="pt-2 max-w-sm mx-auto space-y-2">
                <Button
                  onClick={handleClaimTrialAndFinish}
                  disabled={activated}
                  className="w-full h-12 text-xs"
                >
                  {activated ? "正在进入控制台..." : "领取 100 Credits 并开始使用"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExitModalOpen(true)}
                  className="text-[11px] text-[#71717A] hover:text-[#09090B] w-full"
                >
                  稍后激活，暂存并退出
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
                上一步
              </Button>

              {/* 辅助退出入口 */}
              <button
                type="button"
                onClick={() => setExitModalOpen(true)}
                className="text-xs font-mono text-[#71717A] hover:text-[#09090B] underline cursor-pointer"
              >
                暂存进度并退出
              </button>

              <Button onClick={handleNext}>
                下一步
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
        title="暂存进度并退出向导"
        subtitle="随时离开，您的配置已自动安全保存"
        width="md"
      >
        <div className="space-y-4 text-xs font-mono">
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between text-zinc-900 font-bold">
              <span>当前保存节点</span>
              <span className="text-emerald-600 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> 进度已自动持久化
              </span>
            </div>
            <div className="text-zinc-700 font-medium">
              步骤 {currentStep} / 6: {STEPS[currentStep - 1]?.label}
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              您当前已配置的平台 ({selectedPlatform})、店铺 URL 以及凭证均已妥善保留。任何时候重新进入「免费接入」，均可从当前步骤无缝继续。
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              className="w-full justify-center h-10 text-xs bg-zinc-900 text-white hover:bg-zinc-800"
              onClick={handleExitToHome}
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              返回官网首页
            </Button>

            <Button
              variant="outline"
              className="w-full justify-center h-10 text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              onClick={handleExitToConsole}
            >
              前往商户控制台 (Console) →
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-center h-9 text-xs text-zinc-500 hover:text-zinc-800"
              onClick={() => setExitModalOpen(false)}
            >
              继续完成向导
            </Button>
          </div>
        </div>
      </Modal>

      {/* 重置向导进度确认对话框 */}
      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="确认重置接入进度？"
        width="sm"
      >
        <div className="space-y-4 text-xs font-mono">
          <p className="text-zinc-600 leading-relaxed">
            重置后将清除当前已暂存的店铺信息与表单填写内容，并返回第 2 步重新开始。此操作不可逆。
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetModalOpen(false)}
            >
              取消
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
              确认重置并从头开始
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
