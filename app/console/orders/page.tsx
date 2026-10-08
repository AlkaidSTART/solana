"use client";

import React, { useState } from "react";
import { useAppStore, OrderItem } from "@/stores/use-app-store";
import { getI18nText } from "@/lib/i18n";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Tabs } from "@/components/ui/tabs";
import {
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { clsx } from "clsx";

export default function ConsoleOrdersPage() {
  const { orders, approveCodOrder, rejectCodOrder, markRecoveredOrder, addOrder, locale } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery);

    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const matchesType = typeFilter === "ALL" || o.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: OrderItem["status"]) => {
    switch (status) {
      case "RECOVERED":
        return <Badge variant="success" dot>{getI18nText(locale, "orders_status_recovered")}</Badge>;
      case "COD_VERIFIED":
        return <Badge variant="success" dot>{getI18nText(locale, "orders_status_cod_verified")}</Badge>;
      case "PENDING":
        return <Badge variant="warning" dot>{getI18nText(locale, "orders_status_pending")}</Badge>;
      case "COD_REJECTED":
        return <Badge variant="danger" dot>{getI18nText(locale, "orders_status_rejected")}</Badge>;
      case "CANCELLED":
        return <Badge variant="neutral">{getI18nText(locale, "orders_status_cancelled")}</Badge>;
    }
  };

  const handleApprove = (id: string) => {
    approveCodOrder(id);
    const updated = orders.find((o) => o.id === id);
    if (updated) {
      setSelectedOrder({
        ...updated,
        status: "COD_VERIFIED",
      });
    }
  };

  const handleReject = (id: string) => {
    rejectCodOrder(id);
    const updated = orders.find((o) => o.id === id);
    if (updated) {
      setSelectedOrder({
        ...updated,
        status: "COD_REJECTED",
      });
    }
  };

  const handleRecover = (id: string) => {
    markRecoveredOrder(id);
    const updated = orders.find((o) => o.id === id);
    if (updated) {
      setSelectedOrder({
        ...updated,
        status: "RECOVERED",
      });
    }
  };

  const handleResendNotification = () => {
    setResending(true);
    setResendSuccess(false);
    setTimeout(() => {
      setResending(false);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    }, 600);
  };

  const handleCreateMockOrder = (type: "COD" | "ABANDONED_CHECKOUT") => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrder: OrderItem = {
      id: `ord_${Date.now()}`,
      orderNumber: `ID-${randomSuffix}`,
      storeId: "store_id_tokosepatu",
      customerName: type === "COD" ? "Agus Pratama" : "Dewi Lestari",
      customerPhone: "+62 813-" + Math.floor(10000000 + Math.random() * 90000000),
      amountLocal: type === "COD" ? "Rp 420.000" : "Rp 680.000",
      amountUsd: type === "COD" ? "$26.50" : "$43.10",
      type: type === "COD" ? "COD" : "ABANDONED_CHECKOUT",
      status: "PENDING",
      language: "id_ID",
      createdAt: "刚刚",
      originalAddress: "Jl. Merdeka No. 45, RT 01 / RW 03, Bandung",
      modifiedAddress: type === "COD" ? "Depan Indomaret seberang lapangan bola" : undefined,
      riskScore: type === "COD" ? 18 : 6,
      steps: [
        {
          title: type === "COD" ? "电商店铺 COD 新订单产生" : "买家弃购离场 (触发 15m 规则)",
          timestamp: "刚刚",
          completed: true,
        },
        {
          title: "SolaFlow WhatsApp 自动化触达",
          timestamp: "进行中",
          completed: false,
          active: true,
          note: type === "COD" ? "已向买家发送地址核验与地标补充请求" : "已生成 10 分钟限时免邮挽回链接",
        },
      ],
    };

    addOrder(newOrder);
    setSelectedOrder(newOrder);
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题与导出 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-zinc-900">
              {getI18nText(locale, "orders_title")}
            </h1>
            <Badge variant="outline">{getI18nText(locale, "demo_badge")}</Badge>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            {getI18nText(locale, "orders_drawer_title")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 快捷新建模拟测试订单 */}
          <Button
            size="sm"
            onClick={() => handleCreateMockOrder("COD")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            + {getI18nText(locale, "orders_type_cod")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateMockOrder("ABANDONED_CHECKOUT")}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            + {getI18nText(locale, "orders_type_prepaid")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => alert("CSV Exported")}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {getI18nText(locale, "action_export")}
          </Button>
        </div>
      </div>

      {/* 多维状态筛选栏 */}
      <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/70 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder={getI18nText(locale, "orders_search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs"
            />
          </div>

          {/* 订单类型筛选 */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-700 focus:outline-none cursor-pointer shadow-2xs shrink-0"
          >
            <option value="ALL">{getI18nText(locale, "status_all")}</option>
            <option value="COD">{getI18nText(locale, "orders_type_cod")}</option>
            <option value="ABANDONED_CHECKOUT">{getI18nText(locale, "orders_type_prepaid")}</option>
          </select>
        </div>

        {/* 状态过滤 GSAP 胶囊滑块 */}
        <div className="flex items-center">
          <Tabs
            variant="capsule"
            activeId={statusFilter}
            onChange={setStatusFilter}
            items={[
              { id: "ALL", label: getI18nText(locale, "status_all") },
              { id: "PENDING", label: getI18nText(locale, "orders_tab_pending") },
              { id: "RECOVERED", label: getI18nText(locale, "orders_tab_recovered") },
              { id: "COD_VERIFIED", label: getI18nText(locale, "orders_tab_cod_verified") },
              { id: "COD_REJECTED", label: getI18nText(locale, "orders_tab_rejected") },
            ]}
          />
        </div>
      </div>

      {/* 订单表格 */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{getI18nText(locale, "orders_col_number")}</TableHead>
              <TableHead>{getI18nText(locale, "orders_col_customer")}</TableHead>
              <TableHead>{getI18nText(locale, "orders_col_amount")}</TableHead>
              <TableHead>{getI18nText(locale, "orders_col_type")}</TableHead>
              <TableHead>{getI18nText(locale, "orders_col_status")}</TableHead>
              <TableHead>{getI18nText(locale, "orders_col_time")}</TableHead>
              <TableHead className="text-right">{getI18nText(locale, "orders_col_action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-zinc-400 font-mono">
                  {getI18nText(locale, "overview_empty_title")}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((ord) => (
                <TableRow
                  key={ord.id}
                  className="cursor-pointer hover:bg-zinc-50/80 transition-colors"
                  onClick={() => setSelectedOrder(ord)}
                >
                  <TableCell className="font-bold text-zinc-900 font-mono">
                    #{ord.orderNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-sans font-medium text-zinc-900">{ord.customerName}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">{ord.customerPhone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-zinc-900 font-mono">{ord.amountLocal}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{ord.amountUsd}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={ord.type === "COD" ? "outline" : "neutral"}>
                        {ord.type === "COD" ? getI18nText(locale, "orders_type_cod") : getI18nText(locale, "orders_type_prepaid")}
                      </Badge>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {ord.language}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(ord.status)}</TableCell>
                  <TableCell className="text-zinc-500 text-[11px] font-mono">{ord.createdAt}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(ord)}>
                      {getI18nText(locale, "orders_col_action")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 订单详情与生命周期步进器抽屉 */}
      <Drawer
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`${getI18nText(locale, "orders_drawer_title")} #${selectedOrder?.orderNumber}`}
        subtitle={`${selectedOrder?.customerName} (${selectedOrder?.customerPhone})`}
        width="lg"
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs font-mono">
            {/* 金额与当前状态 */}
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">
                  {getI18nText(locale, "orders_col_amount")}
                </span>
                <span className="text-base font-bold text-zinc-900">
                  {selectedOrder.amountLocal} ({selectedOrder.amountUsd})
                </span>
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            {/* 全生命周期工作流步进器 (Stepper) */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                {getI18nText(locale, "workflows_title")}
              </h4>

              <div className="border border-zinc-200 rounded-xl p-4 bg-white space-y-4">
                {selectedOrder.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative">
                    <div className="mt-0.5">
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={clsx(
                            "font-semibold",
                            step.completed ? "text-zinc-900" : "text-zinc-500"
                          )}
                        >
                          {step.title}
                        </span>
                        <span className="text-[10px] text-zinc-400">{step.timestamp}</span>
                      </div>
                      {step.note && (
                        <p className="text-zinc-500 text-[11px] leading-relaxed">{step.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 弃购挽回订单操作专区 */}
            {selectedOrder.type === "ABANDONED_CHECKOUT" && selectedOrder.status === "PENDING" && (
              <div className="p-4 border border-indigo-200 rounded-xl bg-indigo-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    {getI18nText(locale, "workflows_rule_cart_recovery")}
                  </span>
                  <Badge variant="outline">15m Rule Active</Badge>
                </div>
                <p className="text-zinc-600 text-[11px] leading-relaxed">
                  WhatsApp automation active.
                </p>
                <div className="flex gap-2.5 pt-1">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleRecover(selectedOrder.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    {getI18nText(locale, "orders_drawer_mark_paid")}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={resending}
                    onClick={handleResendNotification}
                  >
                    {resending ? (
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                    )}
                    {resending
                      ? getI18nText(locale, "orders_drawer_resending")
                      : resendSuccess
                      ? getI18nText(locale, "orders_drawer_resend_ok")
                      : getI18nText(locale, "orders_drawer_resend")}
                  </Button>
                </div>
              </div>
            )}

            {/* COD 订单改址核验专区 */}
            {selectedOrder.type === "COD" && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-900" />
                    <span>{getI18nText(locale, "orders_drawer_landmark")}</span>
                  </h4>
                  {selectedOrder.riskScore !== undefined && (
                    <Badge variant={selectedOrder.riskScore > 50 ? "danger" : "success"}>
                      Risk Score: {selectedOrder.riskScore}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 border border-zinc-200 rounded-lg bg-zinc-50">
                    <span className="text-[10px] text-zinc-500 uppercase block mb-1">
                      Original Checkout Address
                    </span>
                    <p className="text-zinc-900 leading-relaxed">
                      {selectedOrder.originalAddress || "Jl. Sudirman No. 12, Jakarta"}
                    </p>
                  </div>

                  <div className="p-3.5 border border-emerald-500/50 rounded-lg bg-emerald-50/30">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block mb-1">
                      WhatsApp Verified Landmark
                    </span>
                    <p className="text-zinc-900 leading-relaxed font-semibold">
                      {selectedOrder.modifiedAddress || "Indomaret depan lapangan"}
                    </p>
                  </div>
                </div>

                {/* 操作动作 */}
                {selectedOrder.status === "PENDING" && (
                  <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50 space-y-3">
                    <div className="text-[11px] text-zinc-600">
                      {getI18nText(locale, "workflows_rule_cod_verify")}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApprove(selectedOrder.id)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        {getI18nText(locale, "orders_drawer_approve")}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleReject(selectedOrder.id)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        {getI18nText(locale, "orders_drawer_reject")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-zinc-200">
              <Button variant="outline" className="w-full" onClick={() => setSelectedOrder(null)}>
                {getI18nText(locale, "action_close")}
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
