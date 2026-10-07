"use client";

import React, { useState } from "react";
import { useAppStore, WorkflowRule } from "@/stores/use-app-store";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import {
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { clsx } from "clsx";

export default function ConsoleWorkflowsPage() {
  const { workflows, toggleWorkflow, rollbackWorkflow } = useAppStore();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRule | null>(null);
  const [rollbackSuccess, setRollbackSuccess] = useState(false);

  const handleRollback = (wfId: string, version: string) => {
    rollbackWorkflow(wfId, version);
    setRollbackSuccess(true);
    setTimeout(() => {
      setRollbackSuccess(false);
      setSelectedWorkflow(null);
    }, 800);
  };

  return (
    <div className="space-y-8">
      {/* 顶部标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E4E7] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
              工作流引擎 · Workflows Engine
            </h1>
            <Badge variant="outline">Demo/Mock</Badge>
          </div>
          <p className="text-xs text-[#71717A] font-mono mt-0.5">
            配置 15 分钟待支付挽回、COD 发货前核查、+62/+66 国家区分流与静默时段排期
          </p>
        </div>

        <Button size="sm">新建自定义规则</Button>
      </div>

      {/* 核心工作流列表 */}
      <div className="space-y-4">
        {workflows.map((wf) => (
          <Card key={wf.id} className="hover:border-[#09090B] transition-colors">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#09090B] text-white flex items-center justify-center font-mono text-xs font-bold">
                    WF
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-mono font-bold text-[#09090B]">
                        {wf.name}
                      </h3>
                      <Badge variant="outline">{wf.version}</Badge>
                    </div>
                    <span className="text-[10px] font-mono text-[#71717A]">
                      代码: {wf.code}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* 启停开关 */}
                  <button
                    onClick={() => toggleWorkflow(wf.id)}
                    className={clsx(
                      "px-3 py-1 text-xs font-mono uppercase border transition-colors cursor-pointer flex items-center gap-1.5",
                      wf.enabled
                        ? "bg-[#09090B] text-white border-[#09090B]"
                        : "bg-[#FAFAFA] text-[#71717A] border-[#E4E4E7]"
                    )}
                  >
                    <span
                      className={clsx(
                        "w-1.5 h-1.5 rounded-full",
                        wf.enabled ? "bg-[#059669]" : "bg-[#A1A1AA]"
                      )}
                    />
                    <span>{wf.enabled ? "ACTIVE (已激活)" : "DISABLED (已停用)"}</span>
                  </button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedWorkflow(wf)}
                  >
                    配置规则
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-mono">
              <p className="text-[#27272A] leading-relaxed font-sans">{wf.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-[#FAFAFA] border border-[#E4E4E7] text-[11px]">
                <div>
                  <span className="text-[#71717A] block text-[10px] uppercase">触发延时</span>
                  <span className="text-[#09090B] font-semibold">{wf.triggerDelay}</span>
                </div>
                <div>
                  <span className="text-[#71717A] block text-[10px] uppercase">分流语言</span>
                  <span className="text-[#09090B]">{wf.languages.join(", ")}</span>
                </div>
                <div>
                  <span className="text-[#71717A] block text-[10px] uppercase">静默时段排期</span>
                  <span className="text-[#09090B]">{wf.quietHours}</span>
                </div>
                <div>
                  <span className="text-[#71717A] block text-[10px] uppercase">频次上限限制</span>
                  <span className="text-[#09090B]">{wf.maxFrequency}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 东南亚国家代码多语言分流路由表 (PRD 3.2 规范) */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          SOUTHEAST ASIA COUNTRY-CODE ROUTING MATRIX (国家区分流矩阵)
        </h2>
        <Card>
          <div className="divide-y divide-[#EEEEEE] text-xs font-mono">
            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#FAFAFA] text-[#71717A] font-semibold">
              <span>国家 / 国际区号</span>
              <span>主推语言分流</span>
              <span>时区锚定</span>
              <span>俚语 / 语气词预置</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="font-bold text-[#09090B] flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px]">ID</span>
                <span>印度尼西亚 (+62)</span>
              </span>
              <span>id_ID (印尼语)</span>
              <span>Asia/Jakarta (WIB, UTC+7)</span>
              <span>Bahasa Gaul (min, ongkir, nyasar)</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="font-bold text-[#09090B] flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-purple-500/10 border border-purple-500/20 text-purple-700 text-[10px]">TH</span>
                <span>泰国 (+66)</span>
              </span>
              <span>th_TH (泰语)</span>
              <span>Asia/Bangkok (ICT, UTC+7)</span>
              <span>Particles (krub/ka, pom)</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="font-bold text-[#09090B] flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-700 text-[10px]">VN</span>
                <span>越南 (+84) / 国际</span>
              </span>
              <span>en_US (国际英语)</span>
              <span>Asia/Singapore (SGT, UTC+8)</span>
              <span>Standard E-commerce English</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 规则配置与版本回退抽屉 */}
      <Drawer
        open={!!selectedWorkflow}
        onClose={() => setSelectedWorkflow(null)}
        title={selectedWorkflow?.name || "工作流配置"}
        subtitle={`代码: ${selectedWorkflow?.code} • 当前版本: ${selectedWorkflow?.version}`}
        width="lg"
      >
        {selectedWorkflow && (
          <div className="space-y-6 text-xs font-mono">
            {rollbackSuccess && (
              <div className="p-3 bg-[#059669]/10 text-[#059669] border border-[#059669]/20 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>版本回退成功！规则引擎已即时重新加载至历史快照。</span>
              </div>
            )}

            {/* 基础参数 */}
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">
                规则触发与排期参数
              </h4>

              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1">
                  静默延迟触发窗口
                </label>
                <input
                  type="text"
                  defaultValue={selectedWorkflow.triggerDelay}
                  className="w-full p-2 border border-[#E4E4E7] focus:outline-none focus:border-[#09090B]"
                />
              </div>

              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1">
                  夜间免打扰静默时段 (Quiet Hours)
                </label>
                <input
                  type="text"
                  defaultValue={selectedWorkflow.quietHours}
                  className="w-full p-2 border border-[#E4E4E7] focus:outline-none focus:border-[#09090B]"
                />
              </div>

              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1">
                  单订单触达频次安全上限
                </label>
                <input
                  type="text"
                  defaultValue={selectedWorkflow.maxFrequency}
                  className="w-full p-2 border border-[#E4E4E7] focus:outline-none focus:border-[#09090B]"
                />
              </div>
            </div>

            {/* 版本历史与安全回退 */}
            <div className="space-y-3 pt-4 border-t border-[#E4E4E7]">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">
                  版本历史与安全回退 (Version History)
                </h4>
                <RotateCcw className="w-3.5 h-3.5 text-[#71717A]" />
              </div>

              <div className="space-y-2">
                <div className="p-3 border border-[#09090B] bg-[#FAFAFA] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#09090B] flex items-center gap-2">
                      <span>{selectedWorkflow.version} (当前活跃版本)</span>
                      <Badge variant="success">ACTIVE</Badge>
                    </div>
                    <span className="text-[10px] text-[#71717A]">
                      发布于 2026-10-06 14:00 • 优化了印尼语 Gaul 俚语匹配
                    </span>
                  </div>
                </div>

                <div className="p-3 border border-[#E4E4E7] bg-white flex items-center justify-between hover:bg-[#FAFAFA]">
                  <div>
                    <div className="font-bold text-[#27272A]">v1.1 (稳定旧版)</div>
                    <span className="text-[10px] text-[#71717A]">
                      发布于 2026-09-28 10:30 • 包含基准 15 分钟触发参数
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRollback(selectedWorkflow.id, "v1.1")}
                  >
                    回退至此版本
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4E4E7] flex gap-3">
              <Button onClick={() => setSelectedWorkflow(null)} className="flex-1">
                保存并生效
              </Button>
              <Button variant="outline" onClick={() => setSelectedWorkflow(null)}>
                取消
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
