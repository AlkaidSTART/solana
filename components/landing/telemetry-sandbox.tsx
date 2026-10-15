"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Terminal,
  Check,
  Edit3,
  X,
  CreditCard,
  Package,
  Truck,
  Tag,
  ShoppingBag,
  MessageSquare,
  ExternalLink,
  FileText,
  Sparkles,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import { gsap } from "gsap";
import { MOCK_TELEMETRY_SCENARIOS, type ScenarioAction, type Scenario } from "@/mock";

export type { ScenarioAction, Scenario };

export const TelemetrySandbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("cod_confirm");
  const [selectedAction, setSelectedAction] = useState<ScenarioAction | null>(null);

  const scenario = MOCK_TELEMETRY_SCENARIOS.find((s) => s.id === activeTab) || MOCK_TELEMETRY_SCENARIOS[0];

  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // GSAP 场景切换动效
  useEffect(() => {
    if (leftPaneRef.current && rightPaneRef.current) {
      gsap.fromTo(
        [leftPaneRef.current, rightPaneRef.current],
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.06 }
      );
    }
  }, [activeTab]);

  // GSAP 反馈泡泡动效
  useEffect(() => {
    if (feedbackRef.current && selectedAction) {
      gsap.fromTo(
        feedbackRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(1.7)" }
      );
    }
  }, [selectedAction]);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSelectedAction(null);
  };

  const handleSelectAction = (action: ScenarioAction) => {
    setSelectedAction(action);
  };

  const renderActionIcon = (icon: ScenarioAction["icon"]) => {
    const iconClass = "w-3.5 h-3.5 shrink-0";
    switch (icon) {
      case "check":
        return <Check className={clsx(iconClass, "text-emerald-500")} />;
      case "edit":
        return <Edit3 className={clsx(iconClass, "text-indigo-500")} />;
      case "cancel":
        return <X className={clsx(iconClass, "text-rose-500")} />;
      case "card":
        return <CreditCard className={clsx(iconClass, "text-emerald-500")} />;
      case "package":
        return <Package className={clsx(iconClass, "text-amber-500")} />;
      case "truck":
        return <Truck className={clsx(iconClass, "text-blue-500")} />;
      case "tag":
        return <Tag className={clsx(iconClass, "text-emerald-500")} />;
      case "bag":
        return <ShoppingBag className={clsx(iconClass, "text-purple-500")} />;
      case "message":
        return <MessageSquare className={clsx(iconClass, "text-indigo-500")} />;
      case "link":
        return <ExternalLink className={clsx(iconClass, "text-emerald-500")} />;
      case "file":
        return <FileText className={clsx(iconClass, "text-indigo-500")} />;
      default:
        return <Sparkles className={clsx(iconClass, "text-emerald-500")} />;
    }
  };

  const currentRiskScore = selectedAction?.updatedRiskScore ?? scenario.riskScore;
  const currentIntent = selectedAction?.updatedIntent ?? scenario.intent;

  return (
    <div className="w-full border border-zinc-200/90 rounded-2xl overflow-hidden bg-white shadow-xl shadow-zinc-950/[0.03]">
      {/* 顶部场景切换 Tab 栏 */}
      <div className="flex items-center overflow-x-auto border-b border-zinc-200/80 bg-zinc-50/80 p-2 gap-1.5 scrollbar-none">
        {MOCK_TELEMETRY_SCENARIOS.map((s) => {
          const isActive = s.id === activeTab;
          return (
            <button
              key={s.id}
              onClick={() => handleTabChange(s.id)}
              className={clsx(
                "px-4 py-2 text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all select-none cursor-pointer rounded-xl border font-medium",
                isActive
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                  : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-900 hover:bg-white"
              )}
            >
              <span>{s.tabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 左右分屏对比控制台 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
        {/* 左视窗：真实 WhatsApp 手机端仿真视图 (5 栏宽) */}
        <div
          ref={leftPaneRef}
          className="lg:col-span-5 p-6 sm:p-7 border-b lg:border-b-0 lg:border-r border-zinc-200/80 bg-zinc-50/40 flex flex-col justify-between"
        >
          <div>
            {/* WhatsApp 顶部商业号标头 */}
            <div className="p-3.5 bg-white border border-zinc-200/80 rounded-xl flex items-center justify-between mb-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-mono font-bold flex items-center justify-center ring-2 ring-emerald-500/20">
                  {scenario.avatarLetter}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-900">
                      {scenario.buyerName}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50" />
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    {scenario.buyerPhone}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                <Zap className="w-2.5 h-2.5" />
                <span>OFFICIAL BIZ</span>
              </div>
            </div>

            {/* 对话气泡流 */}
            <div className="space-y-3">
              {/* Bot 消息 */}
              <div className="max-w-[88%] p-3.5 bg-white border border-zinc-200 rounded-xl text-xs font-sans text-zinc-700 leading-relaxed shadow-2xs">
                <div className="text-[9px] font-mono text-emerald-600 uppercase mb-1 font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>SolaFlow AI Assistant · {scenario.buyerTime}</span>
                </div>
                {scenario.botMessage}
              </div>

              {/* 买家原声消息 */}
              <div className="ml-auto max-w-[88%] p-3.5 bg-zinc-900 text-white rounded-xl text-xs font-sans leading-relaxed shadow-sm">
                <div className="text-[9px] font-mono text-zinc-400 uppercase mb-1 flex items-center justify-between">
                  <span className="text-emerald-400">Buyer Reply</span>
                  <span>{scenario.buyerTime}</span>
                </div>
                {scenario.buyerMessage}
              </div>

              {/* 买家选择的反馈 */}
              {selectedAction && (
                <div
                  ref={feedbackRef}
                  className="ml-auto max-w-[90%] p-3 bg-emerald-50 text-emerald-950 rounded-xl text-xs border border-emerald-200/80 shadow-2xs"
                >
                  <div className="text-[10px] font-mono text-emerald-700 font-semibold mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>执行动作反馈 · {selectedAction.label}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-900">
                    {selectedAction.feedbackText}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 仿真买家交互按钮胶囊 */}
          <div className="mt-5 pt-4 border-t border-zinc-200">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2 flex items-center justify-between">
              <span>交互场景动作模拟 (点击测试)</span>
              <span className="text-emerald-600 font-medium">Interactive Demo</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {scenario.actions.map((act) => {
                const isSelected = selectedAction?.id === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => handleSelectAction(act)}
                    className={clsx(
                      "w-full text-left p-2.5 text-xs font-mono rounded-lg border transition-all cursor-pointer flex items-center justify-between",
                      isSelected
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                        : "bg-white text-zinc-900 border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50/20"
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      {renderActionIcon(act.icon)}
                      <span className="font-medium">{act.label}</span>
                    </span>
                    <ArrowRight
                      className={clsx(
                        "w-3.5 h-3.5 transition-transform",
                        isSelected ? "translate-x-0.5 opacity-100 text-emerald-400" : "opacity-40"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右视窗：SolaFlow Neural Engine 实时遥测分析视窗 (7 栏宽) */}
        <div
          ref={rightPaneRef}
          className="lg:col-span-7 p-7 sm:p-8 bg-white flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-zinc-900 text-emerald-400">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-900">
                  SolaFlow 神经规则引擎实时遥测
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-medium text-zinc-600">LIVE TELEMETRY</span>
              </div>
            </div>

            {/* 遥测多维度卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1.5 flex items-center justify-between">
                  <span>多语言与方言分类</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                    {scenario.languageCode}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-zinc-900">
                  {scenario.language}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  {scenario.dialectName}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1.5">
                  识别意图分类 (Classified Intent)
                </div>
                <div className="text-xs font-mono font-bold text-indigo-700 truncate">
                  {currentIntent}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  置信度 99.8% · 零样本泛化
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1.5">
                  COD 拒签风险评分
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "text-base font-mono font-bold",
                      currentRiskScore > 50 ? "text-rose-600" : "text-emerald-600"
                    )}
                  >
                    {currentRiskScore} / 100
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {currentRiskScore > 50 ? "(高危拦截建议)" : "(极低拒签风险)"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1.5">
                  Solana 链上审计结算
                </div>
                <div className="text-xs font-mono text-zinc-900 flex items-center justify-between">
                  <span className="font-semibold text-emerald-600">{scenario.solanaDuration}</span>
                  <span className="text-[11px] text-zinc-500 font-mono">Gas: {scenario.solanaFee}</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 truncate">
                  {scenario.solanaStatus}
                </div>
              </div>
            </div>

            {/* 印尼俚语 / 语气词精准解构 */}
            <div className="p-4.5 rounded-xl border border-zinc-200/80 bg-white mb-6">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3 flex items-center justify-between">
                <span>东南亚俚语与本土虚词解析 (Slang Lexicon)</span>
                <span className="text-[10px] text-indigo-600 font-medium">NLP Parser</span>
              </div>
              <div className="space-y-2.5">
                {scenario.slangTokens.map((st, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200/80 text-zinc-900 font-bold text-[11px]">
                      {st.token}
                    </span>
                    <span className="text-zinc-600 text-xs pt-0.5 leading-relaxed">{st.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Webhook 同步状态 */}
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-mono flex items-center justify-between">
              <div>
                <span className="text-zinc-500">ECOMMERCE WEBHOOK: </span>
                <span className="text-zinc-900 font-semibold">{scenario.webhookStatus}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold">
                SYNCED
              </span>
            </div>
          </div>

          <div className="pt-5 border-t border-zinc-200/80 flex items-center justify-between text-[11px] font-mono text-zinc-500 mt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>确定性规则引擎</span>
            </div>
            <span className="text-emerald-700 font-medium">Status: 200 OK · 遥测就绪</span>
          </div>
        </div>
      </div>
    </div>
  );
};
