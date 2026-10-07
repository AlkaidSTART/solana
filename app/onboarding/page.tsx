"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Store,
  MessageSquare,
  GitBranch,
  Play,
  Gift,
  ShieldCheck,
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
  const [currentStep, setCurrentStep] = useState(2); // Step 1 is already completed upon login

  // Step 2 state
  const [selectedPlatform, setSelectedPlatform] = useState<"woocommerce" | "shopify">("woocommerce");
  const [storeUrl, setStoreUrl] = useState("https://tokosepatu.co.id");

  // Step 3 state
  const [wabaMode, setWabaMode] = useState<"embedded" | "manual">("embedded");
  const [wabaId, setWabaId] = useState("902819280192");
  const [phoneId, setPhoneId] = useState("102938192039");

  // Step 4 state
  const [enableAbandoned, setEnableAbandoned] = useState(true);
  const [enableCod, setEnableCod] = useState(true);

  // Step 5 state
  const [testPhone, setTestPhone] = useState("+62 812-9812-4412");
  const [testSent, setTestSent] = useState(false);

  // Step 6 state
  const [activated, setActivated] = useState(false);

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClaimTrialAndFinish = () => {
    topupCredits(0, 100, "TRIAL_WELCOME_GRANT_INITIAL_ONBOARDING");
    setActivated(true);
    setTimeout(() => {
      router.push("/console");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white text-[#09090B] font-sans flex flex-col justify-between selection:bg-[#09090B] selection:text-white">
      {/* 顶部状态栏 */}
      <header className="h-16 border-b border-[#E4E4E7] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-mono text-base font-bold tracking-tight text-[#09090B]">
            SolaFlow AI
          </Link>
          <span className="text-xs font-mono text-[#71717A] hidden sm:inline">
            // 出海商户 6 步初始化激活向导 (严格对齐 PRD 3.1)
          </span>
        </div>

        <Link href="/console">
          <Button variant="ghost" size="sm">
            暂存并稍后继续 →
          </Button>
        </Link>
      </header>

      {/* 步进条指示器 (发丝黑白) */}
      <div className="border-b border-[#E4E4E7] bg-[#FAFAFA] py-4 px-6 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex items-center justify-between min-w-[560px]">
          {STEPS.map((s, idx) => {
            const isCompleted = s.id < currentStep;
            const isCurrent = s.id === currentStep;

            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-2 text-xs font-mono select-none">
                  <div
                    className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] border",
                      isCompleted
                        ? "bg-[#09090B] text-white border-[#09090B]"
                        : isCurrent
                        ? "bg-white text-[#09090B] border-[#09090B] ring-2 ring-[#09090B]/10"
                        : "bg-white text-[#A1A1AA] border-[#E4E4E7]"
                    )}
                  >
                    {isCompleted ? "✓" : s.id}
                  </div>
                  <span
                    className={clsx(
                      isCurrent
                        ? "text-[#09090B] font-bold"
                        : isCompleted
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
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-12 flex flex-col justify-center">
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
                  onClick={() => setSelectedPlatform("woocommerce")}
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
                  onClick={() => setSelectedPlatform("shopify")}
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
                  onChange={(e) => setStoreUrl(e.target.value)}
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
                      onChange={(e) => setWabaId(e.target.value)}
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
                      onChange={(e) => setPhoneId(e.target.value)}
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
                    onChange={(e) => setEnableAbandoned(e.target.checked)}
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
                    onChange={(e) => setEnableCod(e.target.checked)}
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
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="flex-1 p-2 border border-[#E4E4E7] focus:outline-none focus:border-[#09090B]"
                  />
                  <Button
                    onClick={() => setTestSent(true)}
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
                <span className="text-[10px] text-[#71717A] uppercase block">STEP 06 // READY</span>
                <h2 className="text-xl font-bold uppercase text-[#09090B] mt-1">
                  激活店铺并领取 100 免费 Credits
                </h2>
                <p className="text-xs text-[#71717A] mt-2 max-w-md mx-auto leading-relaxed">
                  恭喜！您的店铺已成功接入 SolaFlow AI 神经规则引擎。点击下方按钮立即派发 100 Credits 试用额度并进入控制台。
                </p>
              </div>

              <div className="pt-2 max-w-sm mx-auto">
                <Button
                  onClick={handleClaimTrialAndFinish}
                  disabled={activated}
                  className="w-full h-12 text-xs"
                >
                  {activated ? "正在进入控制台..." : "领取 100 Credits 并开始使用"}
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
    </div>
  );
}
