"use client";

import React, { useState } from "react";
import { useAppStore } from "@/stores/use-app-store";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SolanaPayModal } from "@/components/billing/solana-pay-modal";
import {
  Download,
  ExternalLink,
  Plus,
  Sparkles,
} from "lucide-react";

export default function ConsoleBillingPage() {
  const { credits, ledgerHistory } = useAppStore();
  const [payModalOpen, setPayModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* 顶部标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E4E7] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
              财务充值中心 · Billing & Credits
            </h1>
            <Badge variant="outline">Demo/Mock</Badge>
          </div>
          <p className="text-xs text-[#71717A] font-mono mt-0.5">
            订阅配额、Credits 分类账本、逐笔流水与 Solana Pay 毫秒级原生充值
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => alert("月度对账单已成功生成并下载 (statement_2026_10.pdf)")}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            下载月度对账单
          </Button>

          <Button size="sm" onClick={() => setPayModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Solana Pay 充值
          </Button>
        </div>
      </div>

      {/* 资产与配额四大指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="可用 Credits 余额"
          value={credits.available.toLocaleString()}
          subValue="折合约 8,420 条自动化会话"
          trend={{ text: "实时双轨账本校验通过", positive: true }}
          indicator={<Badge variant="success">可用</Badge>}
        />
        <StatCard
          label="预留冻结 Credits"
          value={credits.reserved.toLocaleString()}
          subValue="当前正在排队中的 120 笔消息"
          trend={{ text: "已发送自动解冻", positive: true }}
          indicator={<Badge variant="neutral">冻结中</Badge>}
        />
        <StatCard
          label="当前订阅套餐"
          value="Growth 计划"
          subValue="10,000 会话/月 • 续费日: 10-28"
          trend={{ text: "已享受 10% 充值赠额", positive: true }}
          indicator={<Badge variant="outline">活跃中</Badge>}
        />
        <StatCard
          label="Solana L1 结算网络"
          value="Devnet v1.1"
          subValue="USDC SPL Token (418ms 终态)"
          trend={{ text: "Gas 单笔 $0.00025", positive: true }}
          indicator={<Sparkles className="w-3.5 h-3.5 text-[#059669]" />}
        />
      </div>

      {/* 充值档位快速唤起横幅 */}
      <Card className="bg-[#FAFAFA] border border-[#E4E4E7]">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-mono font-bold uppercase text-[#09090B]">
              快捷获取更多 Credits 配额 (Solana Pay USDC)
            </h3>
            <p className="text-xs font-mono text-[#71717A]">
              支持 25 USDC (2,500 点)、100 USDC (11,000 点，含 10% 赠送) 或 500 USDC (60,000 点，含 20% 赠送)
            </p>
          </div>
          <Button onClick={() => setPayModalOpen(true)}>
            立即唤起 Solana Pay 充值
          </Button>
        </CardContent>
      </Card>

      {/* 逐笔分类流水账本表格 (双轨审计) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
            CREDITS LEDGER HISTORY (逐笔流水分类账本)
          </h2>
          <span className="text-[11px] font-mono text-[#71717A]">
            不可篡改账本校验: 100% 吻合
          </span>
        </div>

        <div className="border border-[#E4E4E7] bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>流水号 / 时间</TableHead>
                <TableHead>交易类型与说明</TableHead>
                <TableHead>金额 (USDC)</TableHead>
                <TableHead>Credits 变动</TableHead>
                <TableHead>余额快照</TableHead>
                <TableHead className="text-right">链上凭据 (Solana Explorer)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerHistory.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="font-bold text-[#09090B]">{tx.id}</div>
                    <div className="text-[10px] text-[#71717A]">{tx.timestamp}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-[#09090B]">{tx.description}</div>
                    <Badge variant={tx.type === "TOPUP_USDC" ? "success" : "neutral"} className="mt-1">
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-[#09090B]">
                      {tx.amountUsdc || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        tx.creditsDelta > 0
                          ? "text-[#059669] font-bold"
                          : "text-[#E11D48] font-bold"
                      }
                    >
                      {tx.creditsDelta > 0 ? `+${tx.creditsDelta}` : tx.creditsDelta} 点
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-[#09090B]">
                      {tx.balanceAfter.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {tx.solanaTx ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#71717A] hover:text-[#09090B] cursor-pointer">
                        <span>{tx.solanaTx}</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-[#A1A1AA] text-[11px]">系统内部对账</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Solana Pay 充值模态框 */}
      <SolanaPayModal open={payModalOpen} onClose={() => setPayModalOpen(false)} />
    </div>
  );
}
