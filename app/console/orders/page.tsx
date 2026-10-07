"use client";

import React, { useState } from "react";
import { useAppStore, OrderItem } from "@/stores/use-app-store";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { clsx } from "clsx";

export default function ConsoleOrdersPage() {
  const { orders, approveCodOrder, rejectCodOrder } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery);

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && o.status === statusFilter;
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

  return (
    <div className="space-y-6">
      {/* 顶部标题与导出 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E4E7] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
              订单中心 // Orders Center
            </h1>
            <Badge variant="outline">Demo/Mock</Badge>
          </div>
          <p className="text-xs text-[#71717A] font-mono mt-0.5">
            监控弃购待支付挽回进度、COD 发货前地标确认与订单全生命周期步进流
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => alert("已导出隐私脱敏订单对账数据 (orders_export_desensitized.csv)")}
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          导出脱敏数据 (CSV)
        </Button>
      </div>

      {/* 多维筛选栏 (发丝边框) */}
      <div className="p-4 border border-[#E4E4E7] bg-[#FAFAFA] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#71717A]" />
            <input
              type="text"
              placeholder="搜索订单号 / 买家姓名 / 手机号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E4E4E7] text-xs font-mono text-[#09090B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#09090B]"
            />
          </div>
        </div>

        {/* 状态过滤胶囊 */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-[#71717A] mr-1 text-[11px] uppercase">状态:</span>
          {[
            { id: "ALL", label: "全部" },
            { id: "PENDING", label: "待处理" },
            { id: "RECOVERED", label: "已挽回" },
            { id: "COD_VERIFIED", label: "COD 已核验" },
            { id: "COD_REJECTED", label: "已拦截" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={clsx(
                "px-2.5 py-1 uppercase transition-colors cursor-pointer border",
                statusFilter === tab.id
                  ? "bg-[#09090B] text-white border-[#09090B]"
                  : "bg-white text-[#71717A] border-[#E4E4E7] hover:text-[#09090B]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 订单发丝线表格 */}
      <div className="border border-[#E4E4E7] bg-white">
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
                <TableCell colSpan={7} className="text-center py-8 text-[#71717A] font-mono">
                  没有匹配的订单记录
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((ord) => (
                <TableRow key={ord.id} className="cursor-pointer hover:bg-[#FAFAFA]" onClick={() => setSelectedOrder(ord)}>
                  <TableCell className="font-bold text-[#09090B]">
                    #{ord.orderNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-sans font-medium text-[#09090B]">{ord.customerName}</div>
                    <div className="text-[11px] text-[#71717A] font-mono">{ord.customerPhone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-[#09090B]">{ord.amountLocal}</div>
                    <div className="text-[10px] text-[#71717A]">{ord.amountUsd}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ord.type === "COD" ? "COD 货到付款" : "弃购挽回"}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(ord.status)}</TableCell>
                  <TableCell className="text-[#71717A] text-[11px]">{ord.createdAt}</TableCell>
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
            <div className="p-4 bg-[#FAFAFA] border border-[#E4E4E7] flex items-center justify-between">
              <div>
                <span className="text-[#71717A] text-[10px] uppercase block">订单总额</span>
                <span className="text-base font-bold text-[#09090B]">
                  {selectedOrder.amountLocal} ({selectedOrder.amountUsd})
                </span>
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            {/* 全生命周期工作流步进器 (Stepper) */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
                全生命周期工作流步进器 (Lifecycle Stepper)
              </h4>

              <div className="border border-[#E4E4E7] p-4 bg-white space-y-4">
                {selectedOrder.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative">
                    <div className="mt-0.5">
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                      ) : (
                        <Clock className="w-4 h-4 text-[#A1A1AA]" />
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={clsx(
                            "font-semibold",
                            step.completed ? "text-[#09090B]" : "text-[#71717A]"
                          )}
                        >
                          {step.title}
                        </span>
                        <span className="text-[10px] text-[#71717A]">{step.timestamp}</span>
                      </div>
                      {step.note && (
                        <p className="text-[#71717A] text-[11px]">{step.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COD 订单改址核验专区 */}
            {selectedOrder.type === "COD" && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#09090B]" />
                    <span>COD 地址与地标变更对比核验</span>
                  </h4>
                  {selectedOrder.riskScore && (
                    <Badge variant={selectedOrder.riskScore > 50 ? "danger" : "success"}>
                      风控拒签分: {selectedOrder.riskScore}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 border border-[#E4E4E7] bg-[#FAFAFA]">
                    <span className="text-[10px] text-[#71717A] uppercase block mb-1">
                      电商店铺原始下单地址
                    </span>
                    <p className="text-[#09090B] leading-relaxed">
                      {selectedOrder.originalAddress || "Jl. Sudirman No. 12, Jakarta"}
                    </p>
                  </div>

                  <div className="p-3 border border-[#09090B] bg-white">
                    <span className="text-[10px] text-[#059669] uppercase font-bold block mb-1">
                      买家在 WhatsApp 补充的有效真实地标
                    </span>
                    <p className="text-[#09090B] leading-relaxed font-semibold">
                      {selectedOrder.modifiedAddress || "未要求补充"}
                    </p>
                  </div>
                </div>

                {/* 操作动作 */}
                {selectedOrder.status === "PENDING" && (
                  <div className="p-4 border border-[#E4E4E7] bg-[#FAFAFA] space-y-3">
                    <div className="text-[11px] text-[#71717A]">
                      买家已通过 WhatsApp 确认该订单，请核验地标后决定是否安排打包发货：
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1"
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

            <div className="pt-4 border-t border-[#E4E4E7]">
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
