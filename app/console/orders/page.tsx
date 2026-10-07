"use client";

import React, { useState } from "react";
import { useAppStore, OrderItem } from "@/stores/use-app-store";
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
  const { orders, approveCodOrder, rejectCodOrder, markRecoveredOrder, addOrder } = useAppStore();
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
        return <Badge variant="success" dot>已挽回支付</Badge>;
      case "COD_VERIFIED":
        return <Badge variant="success" dot>COD 已核验</Badge>;
      case "PENDING":
        return <Badge variant="warning" dot>待核验/待付</Badge>;
      case "COD_REJECTED":
        return <Badge variant="danger" dot>高危已拦截</Badge>;
      case "CANCELLED":
        return <Badge variant="neutral">已取消</Badge>;
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
              订单中心 · Orders Center
            </h1>
            <Badge variant="outline">Demo/Mock</Badge>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            监控弃购待支付挽回进度、COD 发货前地标确认与订单全生命周期步进流
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
            + 模拟 COD 订单
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateMockOrder("ABANDONED_CHECKOUT")}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            + 模拟弃购订单
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => alert("已导出隐私脱敏订单对账数据 (orders_export_desensitized.csv)")}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            导出脱敏 CSV
          </Button>
        </div>
      </div>

      {/* 多维筛选栏 (发丝边框) */}
      <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/70 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="搜索订单号 / 买家姓名 / 手机号..."
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
            <option value="ALL">全部类型</option>
            <option value="COD">仅 COD 订单</option>
            <option value="ABANDONED_CHECKOUT">仅弃购挽回</option>
          </select>
        </div>

        {/* 状态过滤 GSAP 胶囊滑块 */}
        <div className="flex items-center">
          <Tabs
            variant="capsule"
            activeId={statusFilter}
            onChange={setStatusFilter}
            items={[
              { id: "ALL", label: "全部" },
              { id: "PENDING", label: "待处理" },
              { id: "RECOVERED", label: "已挽回" },
              { id: "COD_VERIFIED", label: "COD 已核验" },
              { id: "COD_REJECTED", label: "已拦截" },
            ]}
          />
        </div>
      </div>

      {/* 订单表格 */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订单编号</TableHead>
              <TableHead>买家信息</TableHead>
              <TableHead>金额 (本地 / USD)</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-zinc-400 font-mono">
                  没有匹配的订单记录。点击上方按钮可快速生成模拟测试订单。
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
                    <Badge variant={ord.type === "COD" ? "outline" : "neutral"}>
                      {ord.type === "COD" ? "COD 货到付款" : "弃购挽回"}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(ord.status)}</TableCell>
                  <TableCell className="text-zinc-500 text-[11px] font-mono">{ord.createdAt}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(ord)}>
                      详情
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
        title={`订单详情 #${selectedOrder?.orderNumber}`}
        subtitle={`买家: ${selectedOrder?.customerName} (${selectedOrder?.customerPhone})`}
        width="lg"
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs font-mono">
            {/* 金额与当前状态 */}
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">订单总额</span>
                <span className="text-base font-bold text-zinc-900">
                  {selectedOrder.amountLocal} ({selectedOrder.amountUsd})
                </span>
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            {/* 全生命周期工作流步进器 (Stepper) */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                全生命周期工作流步进器 (Lifecycle Stepper)
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
                    弃购挽回操作箱
                  </span>
                  <Badge variant="outline">15m Rule Active</Badge>
                </div>
                <p className="text-zinc-600 text-[11px] leading-relaxed">
                  系统已在买家离场 15 分钟时自动推送 WhatsApp 提醒。若线下或独立支付网关已收到款项，可手动标记为已挽回。
                </p>
                <div className="flex gap-2.5 pt-1">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleRecover(selectedOrder.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    标记买家已补付 (Recovered)
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
                    {resendSuccess ? "已推送提醒" : "补发催付"}
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
                    <span>COD 地址与地标变更对比核验</span>
                  </h4>
                  {selectedOrder.riskScore !== undefined && (
                    <Badge variant={selectedOrder.riskScore > 50 ? "danger" : "success"}>
                      风控拒签分: {selectedOrder.riskScore}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 border border-zinc-200 rounded-lg bg-zinc-50">
                    <span className="text-[10px] text-zinc-500 uppercase block mb-1">
                      电商店铺原始下单地址
                    </span>
                    <p className="text-zinc-900 leading-relaxed">
                      {selectedOrder.originalAddress || "Jl. Sudirman No. 12, Jakarta"}
                    </p>
                  </div>

                  <div className="p-3.5 border border-emerald-500/50 rounded-lg bg-emerald-50/30">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block mb-1">
                      买家在 WhatsApp 补充的有效真实地标
                    </span>
                    <p className="text-zinc-900 leading-relaxed font-semibold">
                      {selectedOrder.modifiedAddress || "未要求补充"}
                    </p>
                  </div>
                </div>

                {/* 操作动作 */}
                {selectedOrder.status === "PENDING" && (
                  <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50 space-y-3">
                    <div className="text-[11px] text-zinc-600">
                      买家已通过 WhatsApp 确认该订单，请核验地标后决定是否安排打包发货：
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApprove(selectedOrder.id)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        批准发货并同步店铺
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleReject(selectedOrder.id)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        驳回拦截该订单
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-zinc-200">
              <Button variant="outline" className="w-full" onClick={() => setSelectedOrder(null)}>
                关闭抽屉
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
