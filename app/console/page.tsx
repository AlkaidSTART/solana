"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/stores/use-app-store";
import { getI18nText } from "@/lib/i18n";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { GsapEntrance, GsapStagger } from "@/components/ui/gsap-transition";

export default function ConsoleOverviewPage() {
  const { credits, orders, conversations, locale } = useAppStore();
  const [viewState, setViewState] = useState<"normal" | "loading" | "empty" | "error">("normal");

  const pendingTakeovers = conversations.filter((c) => c.isHumanTakeover || c.unread);
  const pendingOrders = orders.filter((o) => o.status === "PENDING");

  if (viewState === "loading") {
    return (
      <GsapEntrance direction="fade" duration={0.25} className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-6 w-48 bg-[#F4F4F5] animate-pulse" />
          <Button size="sm" variant="outline" onClick={() => setViewState("normal")}>
            {getI18nText(locale, "action_reset_view")}
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#F4F4F5] border border-[#E4E4E7] animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-[#F4F4F5] border border-[#E4E4E7] animate-pulse" />
      </GsapEntrance>
    );
  }

  if (viewState === "empty") {
    return (
      <GsapEntrance direction="fade" duration={0.25} className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
            {getI18nText(locale, "overview_title")}
          </h1>
          <Button size="sm" variant="outline" onClick={() => setViewState("normal")}>
            {getI18nText(locale, "action_reset_view")}
          </Button>
        </div>
        <div className="border border-dashed border-[#E4E4E7] p-12 text-center bg-[#FAFAFA] space-y-4">
          <div className="w-10 h-10 mx-auto rounded-full bg-white border border-[#E4E4E7] flex items-center justify-center text-[#71717A]">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-mono uppercase font-bold text-[#09090B]">
              {getI18nText(locale, "overview_empty_title")}
            </h3>
            <p className="text-xs font-mono text-[#71717A] mt-1 max-w-md mx-auto">
              {getI18nText(locale, "overview_empty_desc")}
            </p>
          </div>
          <Link href="/console/stores">
            <Button size="md">{getI18nText(locale, "overview_bind_store")}</Button>
          </Link>
        </div>
      </GsapEntrance>
    );
  }

  if (viewState === "error") {
    return (
      <GsapEntrance direction="fade" duration={0.25} className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
            {getI18nText(locale, "overview_title")}
          </h1>
          <Button size="sm" variant="outline" onClick={() => setViewState("normal")}>
            {getI18nText(locale, "action_reset_view")}
          </Button>
        </div>
        <div className="border border-[#E11D48]/30 bg-white p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#E11D48] font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>{getI18nText(locale, "overview_error_title")} (TraceID: req_err_99812x)</span>
          </div>
          <p className="text-xs font-mono text-[#71717A]">
            {getI18nText(locale, "overview_error_desc")}
          </p>
          <div className="pt-2 flex gap-3">
            <Button size="sm" variant="danger" onClick={() => setViewState("normal")}>
              {getI18nText(locale, "overview_retry_conn")}
            </Button>
            <Button size="sm" variant="outline">
              Diagnostic Logs
            </Button>
          </div>
        </div>
      </GsapEntrance>
    );
  }

  return (
    <GsapEntrance triggerKey={viewState} direction="fade" duration={0.25} className="space-y-8">
      {/* 顶部标题栏与状态机测试切换器 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E4E7] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
              {getI18nText(locale, "overview_title")}
            </h1>
            <Badge variant="outline">{getI18nText(locale, "demo_badge")}</Badge>
          </div>
          <p className="text-xs text-[#71717A] font-mono mt-0.5">
            {getI18nText(locale, "overview_recent_activity")}
          </p>
        </div>

        {/* 状态机演示调试切换器 (对齐设计规范) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono text-zinc-400">Demo State:</span>
          <Tabs
            variant="capsule"
            activeId={viewState}
            onChange={(id) => setViewState(id as "normal" | "loading" | "empty" | "error")}
            items={[
              { id: "normal", label: getI18nText(locale, "status_normal") },
              { id: "loading", label: "Loading" },
              { id: "empty", label: "Empty" },
              { id: "error", label: getI18nText(locale, "status_warning") },
            ]}
          />
        </div>
      </div>

      {/* ROW 1: 四大核心高密指标卡片 (GSAP 级联交错出现) */}
      <GsapStagger
        selector=".stat-card-cell"
        stagger={0.06}
        distance={14}
        duration={0.35}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="stat-card-cell h-full">
          <StatCard
            label={`${getI18nText(locale, "orders_tab_pending")} (${pendingOrders.length})`}
            value="18"
            subValue="COD / Pre-dispatch"
            trend={{ text: "+4 today", warning: true }}
            indicator={<Badge variant="warning">{getI18nText(locale, "status_pending")}</Badge>}
          />
        </div>
        <div className="stat-card-cell h-full">
          <StatCard
            label={getI18nText(locale, "overview_stat_human_queue")}
            value={pendingTakeovers.length}
            subValue="Critical SLA: 14m"
            trend={{ text: "Meta 24h Window", positive: true }}
            indicator={<Badge variant="danger">{getI18nText(locale, "status_warning")}</Badge>}
          />
        </div>
        <div className="stat-card-cell h-full">
          <StatCard
            label={getI18nText(locale, "overview_stat_credits")}
            value={credits.available.toLocaleString()}
            subValue="Reserved: 120"
            trend={{ text: "~8,400 messages", positive: true }}
            indicator={<Badge variant="success">{getI18nText(locale, "status_normal")}</Badge>}
          />
        </div>
        <div className="stat-card-cell h-full">
          <StatCard
            label={getI18nText(locale, "overview_stat_recovered")}
            value="$ 1,420.00"
            subValue={getI18nText(locale, "overview_stat_cod_rate") + ": 90.6%"}
            trend={{ text: "Lift: +47.1%", positive: true }}
            indicator={<TrendingUp className="w-3.5 h-3.5 text-[#059669]" />}
          />
        </div>
      </GsapStagger>

      {/* ROW 2: 真实催付增量效果分析 — 20% 对照组差异模型 (GSAP 平滑进场) */}
      <GsapEntrance direction="up" distance={16} delay={0.12} duration={0.36}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>{getI18nText(locale, "settings_control_group_title")}</CardTitle>
              <Badge variant="success">
                95% Confidence Verified
              </Badge>
            </div>
            <div className="text-[11px] font-mono text-[#71717A]">
              14-Day Rolling Window
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 指标 1: 弃购待支付转化对比 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-semibold text-[#09090B]">
                【1】{getI18nText(locale, "workflows_rule_cart_recovery")}
              </span>
              <span className="text-[#059669] font-bold">
                Net Lift: +5.7% (Abs) / +47.1% (Rel)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* 提醒组 */}
              <div className="p-3.5 border border-[#E4E4E7] bg-[#FAFAFA] space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#71717A]">WhatsApp Active (80%, 1,240 orders)</span>
                  <span className="font-bold text-[#09090B]">17.8% Conversion</span>
                </div>
                <div className="w-full bg-[#E4E4E7] h-2">
                  <div className="bg-[#09090B] h-2" style={{ width: "17.8%" }} />
                </div>
                <div className="text-[11px] font-mono text-[#71717A] flex justify-between pt-1">
                  <span>{getI18nText(locale, "orders_status_recovered")}: 221</span>
                  <span>GMV: $ 6,851.00</span>
                </div>
              </div>

              {/* 对照组 */}
              <div className="p-3.5 border border-[#E4E4E7] bg-white space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#71717A]">Silent Control (20%, 310 orders)</span>
                  <span className="font-bold text-[#71717A]">12.1% Organic</span>
                </div>
                <div className="w-full bg-[#E4E4E7] h-2">
                  <div className="bg-[#A1A1AA] h-2" style={{ width: "12.1%" }} />
                </div>
                <div className="text-[11px] font-mono text-[#71717A] flex justify-between pt-1">
                  <span>Organic: 38</span>
                  <span>GMV: $ 1,178.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* 指标 2: COD 签收率与防损截流 */}
          <div className="space-y-2 pt-4 border-t border-[#EEEEEE]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-semibold text-[#09090B]">
                【2】{getI18nText(locale, "workflows_rule_cod_verify")}
              </span>
              <span className="text-[#059669] font-bold">
                Loss Avoidance: $ 2,480.00 Saved
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 border border-[#E4E4E7] bg-[#FAFAFA] space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#71717A]">Landmark Verified (COD)</span>
                  <span className="font-bold text-[#059669]">90.6% Delivered (9.4% RTS)</span>
                </div>
                <div className="w-full bg-[#E4E4E7] h-2">
                  <div className="bg-[#059669] h-2" style={{ width: "90.6%" }} />
                </div>
                <div className="text-[11px] font-mono text-[#71717A] pt-1">
                  Intercepted fake addresses: 38 (Prevented round-trip freight loss)
                </div>
              </div>

              <div className="p-3.5 border border-[#E4E4E7] bg-white space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#71717A]">Unverified Baseline</span>
                  <span className="font-bold text-[#E11D48]">83.8% Delivered (16.2% RTS)</span>
                </div>
                <div className="w-full bg-[#E4E4E7] h-2">
                  <div className="bg-[#E11D48] h-2" style={{ width: "83.8%" }} />
                </div>
                <div className="text-[11px] font-mono text-[#71717A] pt-1">
                  RTS Rate exceeds baseline by +6.8%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </GsapEntrance>

      {/* ROW 3: 紧急待办与高危事件队列 (GSAP 级联交错出现) */}
      <GsapStagger
        selector=".queue-card-cell"
        stagger={0.08}
        delay={0.18}
        distance={16}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* 卡片 A: 待人工接管会话 */}
        <div className="queue-card-cell h-full">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>
                  {getI18nText(locale, "inbox_queue_human")} ({pendingTakeovers.length})
                </CardTitle>
                <Link href="/console/inbox">
                  <Button variant="ghost" size="sm">
                    {getI18nText(locale, "nav_inbox")} →
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
                        <Badge variant="warning">{getI18nText(locale, "inbox_btn_takeover")}</Badge>
                      ) : (
                        <Badge variant="neutral">{getI18nText(locale, "inbox_queue_ai")}</Badge>
                      )}
                    </div>
                    <p className="text-xs font-mono text-[#71717A] truncate max-w-xs">
                      {chat.lastMessage}
                    </p>
                  </div>
                  <Link href="/console/inbox">
                    <Button size="sm" variant="outline">
                      {getI18nText(locale, "action_search")}
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 卡片 B: 待处理订单列表 */}
        <div className="queue-card-cell h-full">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>
                  {getI18nText(locale, "orders_tab_pending")} ({pendingOrders.length})
                </CardTitle>
                <Link href="/console/orders">
                  <Button variant="ghost" size="sm">
                    {getI18nText(locale, "nav_orders")} →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-[#EEEEEE] p-0">
              {pendingOrders.slice(0, 3).map((ord) => (
                <div key={ord.id} className="p-4 hover:bg-[#FAFAFA] transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#09090B]">
                        #{ord.orderNumber}
                      </span>
                      <Badge variant={ord.type === "COD" ? "outline" : "neutral"}>
                        {ord.type === "COD" ? getI18nText(locale, "orders_type_cod") : getI18nText(locale, "orders_type_prepaid")}
                      </Badge>
                    </div>
                    <div className="text-[11px] font-mono text-[#71717A] flex gap-2">
                      <span>{ord.customerName}</span>
                      <span>·</span>
                      <span className="font-bold text-[#09090B]">{ord.amountLocal}</span>
                    </div>
                  </div>
                  <Link href="/console/orders">
                    <Button size="sm" variant="outline">
                      {getI18nText(locale, "orders_col_action")}
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </GsapStagger>
    </GsapEntrance>
  );
}
