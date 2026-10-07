"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/stores/use-app-store";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  AlertTriangle,
  Info,
} from "lucide-react";
import { clsx } from "clsx";

export default function ConsoleOverviewPage() {
  const { credits, orders, conversations } = useAppStore();
  const [viewState, setViewState] = useState<"normal" | "loading" | "empty" | "error">("normal");

  const pendingTakeovers = conversations.filter((c) => c.isHumanTakeover || c.unread);
  const pendingOrders = orders.filter((o) => o.status === "PENDING");

  if (viewState === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-6 w-48 bg-[#F4F4F5] animate-pulse" />
          <Button size="sm" variant="outline" onClick={() => setViewState("normal")}>
            恢复正常视图
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#F4F4F5] border border-[#E4E4E7] animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-[#F4F4F5] border border-[#E4E4E7] animate-pulse" />
      </div>
    );
  }

  if (viewState === "empty") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
            监控总览 // Overview
          </h1>
          <Button size="sm" variant="outline" onClick={() => setViewState("normal")}>
            恢复正常视图
          </Button>
        </div>
        <div className="border border-dashed border-[#E4E4E7] p-12 text-center bg-[#FAFAFA] space-y-4">
          <div className="w-10 h-10 mx-auto rounded-full bg-white border border-[#E4E4E7] flex items-center justify-center text-[#71717A]">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-mono uppercase font-bold text-[#09090B]">
              暂未绑定店铺或尚无事件数据
            </h3>
            <p className="text-xs font-mono text-[#71717A] mt-1 max-w-md mx-auto">
              请前往“店铺与通道”授权您的首个 WooCommerce 或 Shopify 店铺，系统将自动开始监听 Webhook。
            </p>
          </div>
          <Link href="/console/stores">
            <Button size="md">立即绑定店铺</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
            监控总览 // Overview
          </h1>
          <Button size="sm" variant="outline" onClick={() => setViewState("normal")}>
            恢复正常视图
          </Button>
        </div>
        <div className="border border-[#E11D48]/30 bg-white p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#E11D48] font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>网络与通道异常告警 (TraceID: req_err_99812x)</span>
          </div>
          <p className="text-xs font-mono text-[#71717A]">
            Meta WhatsApp Cloud API 返回凭证过期 (Code 190, Access Token Expired)。当前待发送队列已自动降级暂存。
          </p>
          <div className="pt-2 flex gap-3">
            <Button size="sm" variant="danger" onClick={() => setViewState("normal")}>
              重试连通性测试
            </Button>
            <Button size="sm" variant="outline">
              查看诊断日志
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 顶部标题栏与状态机测试切换器 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E4E7] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
              监控总览 // Overview
            </h1>
            <Badge variant="outline">Demo/Mock</Badge>
          </div>
          <p className="text-xs text-[#71717A] font-mono mt-0.5">
            实时监控通道健康度、待办积压与 20% 对照组真实催付增量效果
          </p>
        </div>

        {/* 状态机演示调试切换器 (对齐设计规范) */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono bg-[#FAFAFA] p-1 border border-[#E4E4E7] self-start sm:self-auto">
          <span className="text-[#71717A] px-1">状态演示:</span>
          {(["normal", "loading", "empty", "error"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setViewState(st)}
              className={clsx(
                "px-2 py-0.5 uppercase transition-colors cursor-pointer",
                viewState === st
                  ? "bg-[#09090B] text-white"
                  : "text-[#71717A] hover:text-[#09090B]"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ROW 1: 四大核心高密指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="待处理订单 (COD/改址)"
          value="18"
          subValue="高危待核验: 3"
          trend={{ text: "较昨日同期: +4 单", warning: true }}
          indicator={<Badge variant="warning">待办</Badge>}
        />
        <StatCard
          label="待人工接管会话"
          value={pendingTakeovers.length}
          subValue="临界窗口: 14m"
          trend={{ text: "Meta 24h 窗口保护中", positive: true }}
          indicator={<Badge variant="danger">紧急</Badge>}
        />
        <StatCard
          label="可用 Credits 余额"
          value={credits.available.toLocaleString()}
          subValue="已预留: 120 / 试用: 0"
          trend={{ text: "充足可发 ~8,400 消息", positive: true }}
          indicator={<Badge variant="success">正常</Badge>}
        />
        <StatCard
          label="今日已挽回金额"
          value="$ 1,420.00"
          subValue="约 22.4 Juta IDR"
          trend={{ text: "相对对照组净增量 +47.1%", positive: true }}
          indicator={<TrendingUp className="w-3.5 h-3.5 text-[#059669]" />}
        />
      </div>

      {/* ROW 2: 真实催付增量效果分析 — 20% 对照组差异模型 (严格对齐 PRD 2.3) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>真实催付增量效果分析 — 20% 对照组差异模型</CardTitle>
              <Badge variant="success" dot>
                置信度 95% 已达标
              </Badge>
            </div>
            <div className="text-[11px] font-mono text-[#71717A]">
              统计观察期: 2026-09-24 ~ 2026-10-07 (14 天滚动窗口)
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 指标 1: 弃购待支付转化对比 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-semibold text-[#09090B]">
                【指标 1】待支付订单弃购挽回转化率 (Abandoned Cart Lift)
              </span>
              <span className="text-[#059669] font-bold">
                净增量 (Lift): +5.7% (绝对值) / +47.1% (相对提升)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* 提醒组 */}
              <div className="p-3.5 border border-[#E4E4E7] bg-[#FAFAFA] space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#71717A]">智能提醒组 (80% 样本, 1,240 单)</span>
                  <span className="font-bold text-[#09090B]">17.8% 支付转化</span>
                </div>
                <div className="w-full bg-[#E4E4E7] h-2">
                  <div className="bg-[#09090B] h-2" style={{ width: "17.8%" }} />
                </div>
                <div className="text-[11px] font-mono text-[#71717A] flex justify-between pt-1">
                  <span>成功挽回: 221 笔</span>
                  <span>挽回 GMV: $ 6,851.00</span>
                </div>
              </div>

              {/* 对照组 */}
              <div className="p-3.5 border border-[#E4E4E7] bg-white space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#71717A]">纯自然对照组 (20% 样本, 310 单)</span>
                  <span className="font-bold text-[#71717A]">12.1% 自然支付</span>
                </div>
                <div className="w-full bg-[#E4E4E7] h-2">
                  <div className="bg-[#A1A1AA] h-2" style={{ width: "12.1%" }} />
                </div>
                <div className="text-[11px] font-mono text-[#71717A] flex justify-between pt-1">
                  <span>自然完成: 38 笔</span>
                  <span>参考 GMV: $ 1,178.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* 指标 2: COD 签收率与防损截流 */}
          <div className="space-y-2 pt-4 border-t border-[#EEEEEE]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-semibold text-[#09090B]">
                【指标 2】COD 货到付款签收率与防损截流 (Rejection Prevention)
              </span>
              <span className="text-[#059669] font-bold">
                截流防损: 挽回拒签损失 $ 2,480.00
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 border border-[#E4E4E7] bg-[#FAFAFA] space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#71717A]">发货前核查组 (COD 确认)</span>
                  <span className="font-bold text-[#059669]">90.6% 最终签收 (拒签 9.4%)</span>
                </div>
                <div className="w-full bg-[#E4E4E7] h-2">
                  <div className="bg-[#059669] h-2" style={{ width: "90.6%" }} />
                </div>
                <div className="text-[11px] font-mono text-[#71717A] pt-1">
                  拦截空号/错误地址: 38 单 (成功止损往返退运费)
                </div>
              </div>

              <div className="p-3.5 border border-[#E4E4E7] bg-white space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#71717A]">盲发对照组 (未核验)</span>
                  <span className="font-bold text-[#E11D48]">83.8% 最终签收 (拒签 16.2%)</span>
                </div>
                <div className="w-full bg-[#E4E4E7] h-2">
                  <div className="bg-[#E11D48] h-2" style={{ width: "83.8%" }} />
                </div>
                <div className="text-[11px] font-mono text-[#71717A] pt-1">
                  盲发退货率超基准线 +6.8%，产生无效运费支出
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROW 3: 紧急待办与高危事件队列 (分屏双卡片) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 卡片 A: 待人工接管会话 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>待人工接管会话 ({pendingTakeovers.length})</CardTitle>
              <Link href="/console/inbox">
                <Button variant="ghost" size="sm">
                  进入会话中心 →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-[#EEEEEE] p-0">
            {conversations.slice(0, 3).map((chat) => (
              <div key={chat.id} className="p-4 hover:bg-[#FAFAFA] transition-colors flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#09090B]">
                      {chat.customerName}
                    </span>
                    <span className="text-[10px] font-mono text-[#71717A]">
                      ({chat.customerPhone})
                    </span>
                    {chat.isHumanTakeover ? (
                      <Badge variant="warning">人工已接管</Badge>
                    ) : (
                      <Badge variant="outline">AI 托管中</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#27272A] truncate max-w-xs sm:max-w-md font-sans">
                    {chat.lastMessage}
                  </p>
                </div>
                <Link href="/console/inbox">
                  <Button size="sm" variant="outline">
                    处理
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 卡片 B: COD 改址/取消待审核 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>COD 改址与高危审核 ({pendingOrders.length})</CardTitle>
              <Link href="/console/orders">
                <Button variant="ghost" size="sm">
                  批量审核 →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-[#EEEEEE] p-0">
            {orders.slice(0, 3).map((ord) => (
              <div key={ord.id} className="p-4 hover:bg-[#FAFAFA] transition-colors flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#09090B]">
                      #{ord.orderNumber}
                    </span>
                    <span className="text-xs font-mono text-[#09090B]">
                      {ord.amountLocal}
                    </span>
                    {ord.riskScore && ord.riskScore > 50 ? (
                      <Badge variant="danger">高危风险 ({ord.riskScore})</Badge>
                    ) : (
                      <Badge variant="success">建议发货</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#71717A] font-mono truncate max-w-xs">
                    {ord.modifiedAddress || ord.originalAddress || "买家已确认地址"}
                  </p>
                </div>
                <Link href="/console/orders">
                  <Button size="sm" variant="outline">
                    审核
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
