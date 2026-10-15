"use client";

import React, { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";
import { Zap, CheckCircle2, ShieldCheck, RefreshCw, Copy, Check } from "lucide-react";

export const SolanaSettlementConsole: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(418);
  const [stepIndex, setStepIndex] = useState(3); // 1: Signed, 2: Consensus, 3: Finalized
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTestFinality = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setElapsedMs(0);
    setStepIndex(0);

    const startTime = Date.now();
    const targetMs = 418;

    const interval = setInterval(() => {
      const now = Date.now();
      const currentElapsed = now - startTime;

      if (currentElapsed >= targetMs) {
        setElapsedMs(targetMs);
        setStepIndex(3);
        setIsSimulating(false);
        clearInterval(interval);
      } else {
        setElapsedMs(currentElapsed);
        if (currentElapsed > 240) {
          setStepIndex(2);
        } else if (currentElapsed > 80) {
          setStepIndex(1);
        }
      }
    }, 20);

    timerRef.current = interval as unknown as NodeJS.Timeout;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleCopyTx = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={clsx("w-full flex flex-col space-y-3.5", className)}>
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2.5 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-indigo-900 font-semibold tracking-tight">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>SOLANA PAY ENGINE · DEVNET</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>418ms FINALITY</span>
        </div>
      </div>

      {/* 核心对比条 */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 bg-zinc-50 border border-zinc-200/70 rounded-xl space-y-1">
          <div className="text-[10px] text-zinc-400 uppercase">传统跨国信用卡</div>
          <div className="font-bold text-zinc-800">3.2% 损耗</div>
          <div className="text-[10px] text-zinc-500">T+2 周期 · 汇损高</div>
        </div>
        <div className="p-2.5 bg-zinc-950 text-white rounded-xl space-y-1 shadow-2xs">
          <div className="text-[10px] text-emerald-400 uppercase flex items-center justify-between">
            <span>Solana Pay 原生</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="font-bold text-white">$0.00025 矿工费</div>
          <div className="text-[10px] text-zinc-400">418ms 终态 · 0 汇损</div>
        </div>
      </div>

      {/* 毫秒级结算动态演练卡片 */}
      <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-3 shadow-2xs">
        {/* 计时器与操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              SETTLEMENT LATENCY
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-zinc-950 tracking-tight">
                {elapsedMs}
              </span>
              <span className="text-xs font-mono text-zinc-500">ms</span>
            </div>
          </div>

          <button
            onClick={handleTestFinality}
            disabled={isSimulating}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5",
              isSimulating
                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs"
            )}
          >
            <RefreshCw className={clsx("w-3 h-3", isSimulating && "animate-spin")} />
            <span>{isSimulating ? "结算验证中..." : "测试结算时延"}</span>
          </button>
        </div>

        {/* 动态进度条 */}
        <div className="space-y-1.5">
          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-75 ease-out rounded-full"
              style={{ width: `${Math.min((elapsedMs / 418) * 100, 100)}%` }}
            />
          </div>

          {/* 3 段状态步进 */}
          <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono">
            <div
              className={clsx(
                "flex items-center gap-1 transition-colors",
                stepIndex >= 1 ? "text-emerald-700 font-semibold" : "text-zinc-400"
              )}
            >
              <span className="w-1 h-1 rounded-full bg-current" />
              <span>1. 签名验签</span>
            </div>
            <div
              className={clsx(
                "flex items-center justify-center gap-1 transition-colors",
                stepIndex >= 2 ? "text-emerald-700 font-semibold" : "text-zinc-400"
              )}
            >
              <span className="w-1 h-1 rounded-full bg-current" />
              <span>2. 集群共识</span>
            </div>
            <div
              className={clsx(
                "flex items-center justify-end gap-1 transition-colors",
                stepIndex >= 3 ? "text-emerald-700 font-semibold" : "text-zinc-400"
              )}
            >
              <span className="w-1 h-1 rounded-full bg-current" />
              <span>3. L1 终态</span>
            </div>
          </div>
        </div>

        {/* 结算凭证与入账反馈 */}
        <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <div className="font-semibold text-zinc-900">+100.00 USDC 即时入账</div>
              <div className="text-[10px] text-zinc-400">Tx #248 · 5x9K...m2E9</div>
            </div>
          </div>

          <button
            onClick={handleCopyTx}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer"
            title="复制交易签名"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 底部保障提示 */}
      <div className="p-2.5 bg-zinc-50 border border-zinc-200/70 rounded-xl flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-zinc-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[11px]">Finalized 确认入账 · 防双花</span>
        </div>
        <span className="text-[11px] font-bold text-indigo-700">0 汇损滑点</span>
      </div>
    </div>
  );
};
