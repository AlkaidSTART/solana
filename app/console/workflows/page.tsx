"use client";

import React, { useState } from "react";
import { useAppStore, WorkflowRule } from "@/stores/use-app-store";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import {
  RotateCcw,
  CheckCircle2,
  Plus,
  Sliders,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";

export default function ConsoleWorkflowsPage() {
  const { workflows, toggleWorkflow, rollbackWorkflow } = useAppStore();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRule | null>(null);
  const [rollbackSuccess, setRollbackSuccess] = useState(false);

  // 新建规则模态框
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleCode, setNewRuleCode] = useState("WF_CUSTOM_TRIGGER");
  const [newRuleDelay, setNewRuleDelay] = useState("30 分钟");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleRollback = (wfId: string, version: string) => {
    rollbackWorkflow(wfId, version);
    setRollbackSuccess(true);
    setTimeout(() => {
      setRollbackSuccess(false);
      setSelectedWorkflow(null);
    }, 800);
  };

  const handleCreateRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSuccess(true);
    setTimeout(() => {
      setCreateSuccess(false);
      setCreateModalOpen(false);
      setNewRuleName("");
      setNewRuleDesc("");
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* 顶部标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-zinc-900">
              工作流引擎 · Workflows Engine
            </h1>
            <Badge variant="outline">Demo/Mock</Badge>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            配置 15 分钟待支付挽回、COD 发货前核查、+62/+66 国家区分流与静默时段排期
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          新建自定义规则
        </Button>
      </div>

      {/* 核心工作流列表 */}
      <div className="space-y-4">
        {workflows.map((wf) => (
          <Card key={wf.id} className="hover:border-zinc-900 transition-colors rounded-xl shadow-2xs">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold shadow-xs">
                    WF
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-mono font-bold text-zinc-900">
                        {wf.name}
                      </h3>
                      <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-mono text-[10px] border border-zinc-200">
                        {wf.version}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      代码: {wf.code}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* 启停开关 */}
                  <button
                    onClick={() => toggleWorkflow(wf.id)}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-mono uppercase rounded-lg border transition-all cursor-pointer flex items-center gap-1.5",
                      wf.enabled
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                        : "bg-zinc-50 text-zinc-400 border-zinc-200 hover:text-zinc-700"
                    )}
                  >
                    <span
                      className={clsx(
                        "w-2 h-2 rounded-full",
                        wf.enabled ? "bg-emerald-400" : "bg-zinc-400"
                      )}
                    />
                    <span>{wf.enabled ? "ACTIVE (已激活)" : "DISABLED (已停用)"}</span>
                  </button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedWorkflow(wf)}
                  >
                    <Sliders className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                    配置规则
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-mono">
              <p className="text-zinc-700 leading-relaxed font-sans">{wf.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-[11px]">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase">触发延时</span>
                  <span className="text-zinc-900 font-semibold">{wf.triggerDelay}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase">分流语言</span>
                  <span className="text-indigo-700 font-medium">{wf.languages.join(", ")}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase">静默时段排期</span>
                  <span className="text-zinc-900">{wf.quietHours}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase">频次上限限制</span>
                  <span className="text-zinc-900">{wf.maxFrequency}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 东南亚国家代码多语言分流路由表 (PRD 3.2 规范) */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-500">
          SOUTHEAST ASIA COUNTRY-CODE ROUTING MATRIX (国家区分流矩阵)
        </h2>
        <Card className="rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-zinc-200 text-xs font-mono">
            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 bg-zinc-50 text-zinc-500 font-bold">
              <span>国家 / 国际区号</span>
              <span>主推语言分流</span>
              <span>时区锚定</span>
              <span>俚语 / 语气词预置</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px]">ID</span>
                <span>印度尼西亚 (+62)</span>
              </span>
              <span>id_ID (印尼语)</span>
              <span>Asia/Jakarta (WIB, UTC+7)</span>
              <span className="text-emerald-700">Bahasa Gaul (min, ongkir, nyasar)</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-purple-500/10 border border-purple-500/20 text-purple-700 text-[10px]">TH</span>
                <span>泰国 (+66)</span>
              </span>
              <span>th_TH (泰语)</span>
              <span>Asia/Bangkok (ICT, UTC+7)</span>
              <span className="text-purple-700">Particles (krub/ka, pom)</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-700 text-[10px]">VN</span>
                <span>越南 (+84) / 国际</span>
              </span>
              <span>en_US (国际英语)</span>
              <span>Asia/Singapore (SGT, UTC+8)</span>
              <span className="text-blue-700">Standard E-commerce English</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 规则配置与版本回退抽屉 */}
      <Drawer
        open={!!selectedWorkflow}
        onClose={() => setSelectedWorkflow(null)}
        title={`规则参数配置 - ${selectedWorkflow?.name}`}
        subtitle={`代码: ${selectedWorkflow?.code} • 当前版本: ${selectedWorkflow?.version}`}
        width="md"
      >
        {selectedWorkflow && (
          <div className="space-y-6 text-xs font-mono">
            {rollbackSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>已成功回退至稳定旧版本并重新载入引擎！</span>
              </div>
            )}

            {/* 参数表单 */}
            <div className="space-y-4">
              <div>
                <label className="text-zinc-500 text-[10px] uppercase block mb-1 font-bold">
                  规则触发延时 (Trigger Delay)
                </label>
                <input
                  type="text"
                  defaultValue={selectedWorkflow.triggerDelay}
                  className="w-full p-2.5 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-500 text-[10px] uppercase block mb-1 font-bold">
                  夜间免打扰静默时段 (Quiet Hours)
                </label>
                <input
                  type="text"
                  defaultValue={selectedWorkflow.quietHours}
                  className="w-full p-2.5 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-500 text-[10px] uppercase block mb-1 font-bold">
                  单订单触达频次安全上限
                </label>
                <input
                  type="text"
                  defaultValue={selectedWorkflow.maxFrequency}
                  className="w-full p-2.5 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            {/* 版本历史与安全回退 */}
            <div className="space-y-3 pt-4 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
                  版本历史与安全回退 (Version History)
                </h4>
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              </div>

              <div className="space-y-2">
                <div className="p-3.5 border border-zinc-900 rounded-lg bg-zinc-50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-zinc-900 flex items-center gap-2">
                      <span>{selectedWorkflow.version} (当前活跃版本)</span>
                      <Badge variant="success">ACTIVE</Badge>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      优化了印尼语 Gaul 俚语匹配与 15m 延时精度
                    </span>
                  </div>
                </div>

                <div className="p-3.5 border border-zinc-200 rounded-lg bg-white flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div>
                    <div className="font-bold text-zinc-700">v1.1 (稳定旧版)</div>
                    <span className="text-[10px] text-zinc-500">
                      包含基准 15 分钟触发与常规参数
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

            <div className="pt-4 border-t border-zinc-200 flex gap-3">
              <Button onClick={() => setSelectedWorkflow(null)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                保存参数并生效
              </Button>
              <Button variant="outline" onClick={() => setSelectedWorkflow(null)}>
                取消
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* 新建自定义规则模态框 */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="新建自定义自动化触发规则"
        subtitle="基于出海电商 Webhook 事件与条件过滤配置新工作流"
        width="md"
      >
        <form onSubmit={handleCreateRuleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
              规则显示名称
            </label>
            <input
              type="text"
              placeholder="例如：COD 签收后关怀与好评引导"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-zinc-900"
              required
            />
          </div>

          <div>
            <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
              规则唯一代码 (Rule Code)
            </label>
            <input
              type="text"
              value={newRuleCode}
              onChange={(e) => setNewRuleCode(e.target.value)}
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-zinc-900"
              required
            />
          </div>

          <div>
            <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
              触发延时
            </label>
            <input
              type="text"
              value={newRuleDelay}
              onChange={(e) => setNewRuleDelay(e.target.value)}
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-zinc-900"
              required
            />
          </div>

          <div>
            <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
              业务规则描述
            </label>
            <textarea
              rows={3}
              placeholder="描述该规则的业务场景与预期下发的 WhatsApp 模板..."
              value={newRuleDesc}
              onChange={(e) => setNewRuleDesc(e.target.value)}
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-zinc-900"
            />
          </div>

          {createSuccess && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>新工作流规则已成功部署至热重载队列！</span>
            </div>
          )}

          <div className="pt-3 border-t border-zinc-200 flex gap-3">
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              创建并立即激活
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              取消
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
