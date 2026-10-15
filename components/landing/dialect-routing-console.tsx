"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { CheckCircle2, MessageSquare, Sparkles } from "lucide-react";
import { MOCK_SEA_NODES } from "@/mock";

interface DialectSample {
  cityId: string;
  dialectName: string;
  buyerQuote: string;
  translation: string;
  tokens: { word: string; meaning: string }[];
  intentBadge: string;
  confidence: string;
  actionNote: string;
}

const DIALECT_SAMPLES: Record<string, DialectSample> = {
  cgk: {
    cityId: "cgk",
    dialectName: "Bahasa Gaul / 雅加达口语俚语",
    buyerQuote: "Min, tolong di paket tulis depan Alfamart ya min, biar kurir ga nyasar.",
    translation: "掌柜，请在包裹上写 Alfamart 对面，免得快递员跑错迷路。",
    tokens: [
      { word: "min", meaning: "Admin 缩写 · 掌柜/客服" },
      { word: "ga nyasar", meaning: "不会跑偏迷路 (tidak tersesat)" },
      { word: "ongkir", meaning: "Ongkos Kirim · 运费" },
    ],
    intentBadge: "COD 地标高阶提取 · 自动纠偏",
    confidence: "99.8% 意图分类",
    actionNote: "提取周边标志物「Alfamart」并自动注入面单备注",
  },
  sin: {
    cityId: "sin",
    dialectName: "Singlish / 新加坡本地英语",
    buyerQuote: "Can deliver by tomorrow anot ah? Size 10 chopped already right?",
    translation: "明天能送到吗？10 码已经帮我预留好了对吧？",
    tokens: [
      { word: "anot", meaning: "Or not (询问确认意图)" },
      { word: "ah / lah", meaning: "Singlish 亲和语气后缀" },
      { word: "chopped", meaning: "锁定库存 / 预订完成" },
    ],
    intentBadge: "弃购极速加急挽回 · 动态发券",
    confidence: "99.9% 意图分类",
    actionNote: "实时匹配本地 NinjaVan 闪电件，即时发放专属折扣",
  },
  bkk: {
    cityId: "bkk",
    dialectName: "Bangkok Central / 泰语礼貌助词体系",
    buyerQuote: "มีของพร้อมส่งไหมครับ อยากได้ด่วนเลยครับผม COD ได้ไหม",
    translation: "有现货能立刻发吗？非常想要，支持货到付款吗？",
    tokens: [
      { word: "ครับ (krub)", meaning: "男性礼貌语气助词 (高真实意向)" },
      { word: "เก็บเงินปลายทาง", meaning: "货到付款 (COD 意愿确立)" },
    ],
    intentBadge: "曼谷仓现货直连 · 礼貌客群促单",
    confidence: "99.4% 意图分类",
    actionNote: "检测到极高真实购买意图，锁定素万那普仓现货配额",
  },
  mnl: {
    cityId: "mnl",
    dialectName: "Taglish / 菲律宾马尼拉混语",
    buyerQuote: "Available pa po ba? Ship COD to Quezon City please po.",
    translation: "还有现货吗？麻烦帮我发 COD 到奎松市。",
    tokens: [
      { word: "po", meaning: "菲律宾敬语尊称" },
      { word: "pa po ba", meaning: "是否仍有库存 (询问短语)" },
      { word: "QC area", meaning: "Quezon City 奎松核心配送区" },
    ],
    intentBadge: "GCash 预校验 · COD 防拒签盾",
    confidence: "99.2% 意图分类",
    actionNote: "比对历史高拒签街区数据，已通过首期地标真伪审核",
  },
  sgn: {
    cityId: "sgn",
    dialectName: "Vietnamese E-com / 越南电商口语",
    buyerQuote: "Shop còn hàng k ạ? Ship COD qua Q1 HCM giúp em nhé.",
    translation: "店铺还有货吗？请帮忙发货到付款到胡志明第一郡。",
    tokens: [
      { word: "k / ko", meaning: "không 缩写 (否定/询问语气)" },
      { word: "ạ / nhé", meaning: "越语礼貌尊称与应答助词" },
      { word: "Q1 HCM", meaning: "Quận 1 (胡志明核心商业区)" },
    ],
    intentBadge: "02:00 夜间咨询自动应答 · 秒级留存",
    confidence: "99.5% 意图分类",
    actionNote: "夜间自动化 1.8s 应答，拦截因客服下线造成的买家流失",
  },
  szx: {
    cityId: "szx",
    dialectName: "Cross-Border Gateway / 跨境供应链节点",
    buyerQuote: "Shopify / WooCommerce Webhook 150ms 订单捕获并完成海关申报预核验。",
    translation: "国内出海总仓即时捕获跨国订单，完成跨境保税/直发数据同步。",
    tokens: [
      { word: "150ms", meaning: "Webhook 双向纳秒级事件处理" },
      { word: "ERP Sync", meaning: "全生命周期状态对齐" },
      { word: "Auto Routing", meaning: "多国物流最优渠道分流" },
    ],
    intentBadge: "跨境出海总控 · 全渠道自动化",
    confidence: "100% 规则对齐",
    actionNote: "实现国内出海商家 ERP 与东南亚本土配送网的无缝直连",
  },
};

export const DialectRoutingConsole: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [activeId, setActiveId] = useState<string>("cgk");

  const activeNode = MOCK_SEA_NODES.find((n) => n.id === activeId) || MOCK_SEA_NODES[0];
  const activeSample = DIALECT_SAMPLES[activeId] || DIALECT_SAMPLES.cgk;

  return (
    <div className={clsx("w-full flex flex-col space-y-3.5", className)}>
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2.5 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-zinc-700 font-semibold tracking-tight">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>REGIONAL NLP ENGINE · SE ASIA</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>32ms INFERENCE</span>
        </div>
      </div>

      {/* 枢纽选择器 (6 城市药丸按钮) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {MOCK_SEA_NODES.map((node) => {
          const isSelected = node.id === activeId;
          return (
            <button
              key={node.id}
              onClick={() => setActiveId(node.id)}
              className={clsx(
                "px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1",
                isSelected
                  ? "bg-zinc-950 text-white shadow-xs"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400 hover:text-zinc-950"
              )}
            >
              <span>{node.code}</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">
                {node.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 主展示卡片：语言语料解析与俚语拆解 */}
      <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-3 shadow-2xs">
        {/* 买家原话气泡 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-zinc-400" />
              <span>买家原声识别 ({activeSample.dialectName})</span>
            </span>
            <span className="text-emerald-700 font-semibold">{activeSample.confidence}</span>
          </div>
          <div className="p-2.5 bg-zinc-50/80 rounded-lg border border-zinc-100 text-xs sm:text-sm font-sans text-zinc-900 leading-relaxed">
            &ldquo;{activeSample.buyerQuote}&rdquo;
          </div>
          <div className="text-[11px] text-zinc-500 font-sans italic pl-1">
            中文对齐: {activeSample.translation}
          </div>
        </div>

        {/* 俚语分解 Tokens */}
        <div className="pt-2 border-t border-zinc-100">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
            AI 本土俚语与口语拆解 (SLANG MAPPING)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeSample.tokens.map((tok, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-950 font-sans"
              >
                <span className="font-mono font-bold text-emerald-800">{tok.word}</span>
                <span className="text-emerald-600 text-[10px]">→</span>
                <span className="text-zinc-700">{tok.meaning}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 决策执行动作 */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs font-sans text-zinc-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] text-zinc-800">{activeSample.actionNote}</span>
          </div>
          <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-md">
            {activeSample.intentBadge}
          </span>
        </div>
      </div>

      {/* 底部城市指标条 */}
      <div className="p-2.5 bg-zinc-50 border border-zinc-200/70 rounded-xl flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-zinc-900">{activeNode.name}</span>
          <span className="text-zinc-500 text-[11px] hidden sm:inline">{activeNode.market}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-[11px] font-bold text-emerald-700">
            {activeNode.metric}
          </span>
        </div>
      </div>
    </div>
  );
};
