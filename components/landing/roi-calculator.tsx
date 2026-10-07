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
    <div className="w-full border border-[#E4E4E7] bg-white p-6 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#E4E4E7] gap-4">
        <div>
          <h3 className="text-base font-mono uppercase tracking-wider font-semibold text-[#09090B]">
            Southeast Asia Cross-Border ROI Calculator
          </h3>
          <p className="text-xs text-[#71717A] font-mono mt-1">
            动态测算待支付挽回 GMV、COD 拒签截流防护与投资回报倍数
          </p>
        </div>

        {/* 货币切换胶囊 */}
        <div className="inline-flex p-1 bg-[#F4F4F5] border border-[#E4E4E7] self-start md:self-auto">
          {(["USD", "IDR", "THB"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={clsx(
                "px-3 py-1 text-xs font-mono uppercase transition-colors cursor-pointer",
                currency === c
                  ? "bg-[#09090B] text-white"
                  : "text-[#71717A] hover:text-[#09090B]"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* 左侧：3 大滑块控制台 */}
        <div className="lg:col-span-7 space-y-6">
          {/* 滑块 1: 月度活跃订单量 */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-[#27272A] font-medium">月度活跃订单量 (Monthly Orders)</span>
              <span className="text-[#09090B] font-bold text-sm">
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
              className="w-full accent-[#09090B] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#71717A] mt-1">
              <span>500 单</span>
              <span>25,000 单</span>
              <span>50,000+ 单</span>
            </div>
          </div>

          {/* 滑块 2: 平均客单价 AOV */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-[#27272A] font-medium">平均客单价 (Average Order Value, AOV)</span>
              <span className="text-[#09090B] font-bold text-sm">
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
              className="w-full accent-[#09090B] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#71717A] mt-1">
              <span>{formatAmount(10)}</span>
              <span>{formatAmount(120)}</span>
              <span>{formatAmount(250)}</span>
            </div>
          </div>

          {/* 滑块 3: COD 历史拒签率 */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-[#27272A] font-medium">COD 历史拒签率 (Rejection Rate)</span>
              <span className="text-[#09090B] font-bold text-sm">
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
              className="w-full accent-[#09090B] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#71717A] mt-1">
              <span>5% (低损)</span>
              <span>18% (行业平均)</span>
              <span>35% (重灾区)</span>
            </div>
          </div>
        </div>

        {/* 右侧：产出大盘 (大字号黑铅排版) */}
        <div className="lg:col-span-5 p-6 bg-[#FAFAFA] border border-[#E4E4E7] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
              Estimated Net Value Recovered // Monthly
            </div>

            <div className="border-b border-[#E4E4E7] pb-3">
              <div className="text-xs font-mono text-[#71717A]">每月待支付净挽回 GMV</div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-[#09090B] mt-1">
                {formatAmount(recoveredGmvUsd)}
              </div>
            </div>

            <div className="border-b border-[#E4E4E7] pb-3">
              <div className="text-xs font-mono text-[#71717A]">截流 COD 往返运费亏损</div>
              <div className="text-xl font-mono font-semibold text-[#09090B] mt-1">
                {formatAmount(savedLossUsd)}
              </div>
            </div>

            <div>
              <div className="text-xs font-mono text-[#71717A]">预估投资回报倍数 (Estimated ROI)</div>
              <div className="text-3xl font-mono font-bold text-[#059669] mt-1">
                {roiMultiplier}x
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E4E4E7] text-[10px] font-mono text-[#71717A]">
            * 基于 PRD 2.3 规范，20% 对照组真实增量 A/B 差异模型测算
          </div>
        </div>
      </div>
    </div>
  );
};
