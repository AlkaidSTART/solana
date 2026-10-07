"use client";

import React, { useState } from "react";
import { clsx } from "clsx";

export const RoiCalculator: React.FC = () => {
  const [currency, setCurrency] = useState<"USD" | "IDR" | "THB">("USD");
  const [monthlyOrders, setMonthlyOrders] = useState<number>(5000);
  const [aovUsd, setAovUsd] = useState<number>(35);
  const [codRejectionRate, setCodRejectionRate] = useState<number>(18);

  // 货币汇率转换基数
  const rates = {
    USD: { symbol: "$", rate: 1 },
    IDR: { symbol: "Rp ", rate: 15800 },
    THB: { symbol: "฿ ", rate: 35 },
  };

  const curr = rates[currency];

  // 核心测算业务逻辑 (对齐 PRD 2.3 与行业基准)
  // 1. 待支付弃购挽回: 约 20% 订单涉及待支付/弃购，SolaFlow 温和挽回净增量 18.4%
  const abandonedOrders = monthlyOrders * 0.2;
  const recoveredOrders = abandonedOrders * 0.184;
  const recoveredGmvUsd = recoveredOrders * aovUsd;

  // 2. COD 防损截流: COD 订单约占 40%，发货前核查挽回 6.2% 的拒签包裹退运及物料损耗 (按 $8/单计)
  const codOrders = monthlyOrders * 0.4;
  const savedRejections = codOrders * (codRejectionRate / 100) * 0.35;
  const savedLossUsd = savedRejections * 8.5;

  // 3. 总恢复价值与 SolaFlow 费用 (月度基础费 + Credits 预估约 $299)
  const totalValueUsd = recoveredGmvUsd + savedLossUsd;
  const estimatedCostUsd = 299;
  const roiMultiplier = (totalValueUsd / estimatedCostUsd).toFixed(1);

  const formatAmount = (usdValue: number) => {
    const val = usdValue * curr.rate;
    if (currency === "IDR") {
      return `${curr.symbol}${(val / 1000000).toFixed(1)} Juta`;
    }
    return `${curr.symbol}${val.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <div className="w-full border border-zinc-200/90 rounded-2xl bg-white p-7 sm:p-10 shadow-xl shadow-zinc-950/[0.03]">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-7 border-b border-zinc-200/80 gap-4">
        <div>
          <h3 className="text-lg font-sans font-bold text-zinc-900 tracking-tight">
            Southeast Asia Cross-Border ROI Calculator
          </h3>
          <p className="text-xs text-zinc-500 font-sans mt-1">
            动态测算待支付挽回 GMV、COD 拒签截流防护与投资回报倍数
          </p>
        </div>

        {/* 货币切换胶囊 */}
        <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 self-start md:self-auto">
          {(["USD", "IDR", "THB"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={clsx(
                "px-3 py-1 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer",
                currency === c
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-7">
        {/* 左侧：3 大滑块控制台 */}
        <div className="lg:col-span-7 space-y-7">
          {/* 滑块 1: 月度活跃订单量 */}
          <div>
            <div className="flex justify-between items-center text-xs font-sans mb-2.5">
              <span className="text-zinc-700 font-medium">月度活跃订单量 (Monthly Orders)</span>
              <span className="text-zinc-900 font-mono font-bold text-sm">
                {monthlyOrders.toLocaleString()} 单
              </span>
            </div>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={monthlyOrders}
              onChange={(e) => setMonthlyOrders(Number(e.target.value))}
              className="w-full accent-zinc-900 cursor-pointer h-2 bg-zinc-100 rounded-lg"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-400 mt-1.5">
              <span>500 单</span>
              <span>25,000 单</span>
              <span>50,000+ 单</span>
            </div>
          </div>

          {/* 滑块 2: 平均客单价 AOV */}
          <div>
            <div className="flex justify-between items-center text-xs font-sans mb-2.5">
              <span className="text-zinc-700 font-medium">平均客单价 (Average Order Value, AOV)</span>
              <span className="text-zinc-900 font-mono font-bold text-sm">
                {formatAmount(aovUsd)}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={250}
              step={5}
              value={aovUsd}
              onChange={(e) => setAovUsd(Number(e.target.value))}
              className="w-full accent-zinc-900 cursor-pointer h-2 bg-zinc-100 rounded-lg"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-400 mt-1.5">
              <span>{formatAmount(10)}</span>
              <span>{formatAmount(120)}</span>
              <span>{formatAmount(250)}</span>
            </div>
          </div>

          {/* 滑块 3: COD 历史拒签率 */}
          <div>
            <div className="flex justify-between items-center text-xs font-sans mb-2.5">
              <span className="text-zinc-700 font-medium">COD 历史拒签率 (Rejection Rate)</span>
              <span className="text-zinc-900 font-mono font-bold text-sm">
                {codRejectionRate}%
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={35}
              step={1}
              value={codRejectionRate}
              onChange={(e) => setCodRejectionRate(Number(e.target.value))}
              className="w-full accent-zinc-900 cursor-pointer h-2 bg-zinc-100 rounded-lg"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-400 mt-1.5">
              <span>5% (低损)</span>
              <span>18% (行业平均)</span>
              <span>35% (重灾区)</span>
            </div>
          </div>
        </div>

        {/* 右侧：产出大盘 (大字号黑铅排版) */}
        <div className="lg:col-span-5 p-7 bg-zinc-50/80 rounded-2xl border border-zinc-200/80 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
              Estimated Net Value Recovered · Monthly
            </div>

            <div className="border-b border-zinc-200/80 pb-4">
              <div className="text-xs text-zinc-500 font-sans">每月待支付净挽回 GMV</div>
              <div className="text-3xl sm:text-4xl font-sans font-bold text-emerald-600 tracking-tight mt-1">
                {formatAmount(recoveredGmvUsd)}
              </div>
            </div>

            <div className="border-b border-zinc-200/80 pb-4">
              <div className="text-xs text-zinc-500 font-sans">截流 COD 往返运费亏损</div>
              <div className="text-2xl sm:text-3xl font-sans font-bold text-zinc-900 tracking-tight mt-1">
                {formatAmount(savedLossUsd)}
              </div>
            </div>

            <div>
              <div className="text-xs text-zinc-500 font-sans">预估投资回报倍数 (Estimated ROI)</div>
              <div className="text-3xl sm:text-4xl font-sans font-bold text-zinc-900 tracking-tight mt-1">
                {roiMultiplier}x
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-200/80 text-[11px] font-mono text-zinc-400">
            * 基于 PRD 2.3 规范，20% 对照组真实增量 A/B 差异模型测算
          </div>
        </div>
      </div>
    </div>
  );
};
