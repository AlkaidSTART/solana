"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Trash2,
  CheckCircle2,
} from "lucide-react";

export default function ConsoleSettingsPage() {
  const [controlGroupEnabled, setControlGroupEnabled] = useState(true);
  const [windowDays, setWindowDays] = useState(14);
  const [confidenceRate, setConfidenceRate] = useState(95);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  return (
    <div className="space-y-8">
      {/* 顶部标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E4E7] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
              报表与设置 // Analytics & Settings
            </h1>
            <Badge variant="outline">Demo/Mock</Badge>
          </div>
          <p className="text-xs text-[#71717A] font-mono mt-0.5">
            配置 20% 对照组归因模型、店铺本土时区货币、团队 RBAC 权限与隐私合规
          </p>
        </div>

        <Button size="sm" onClick={handleSave}>
          保存全局设置
        </Button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-[#059669]/10 text-[#059669] border border-[#059669]/20 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>全局配置已成功保存并立即在整个工作台生效！</span>
        </div>
      )}

      {/* 模块 1: 归因口径与 20% 对照组实验配置 (严格对齐 PRD 2.3) */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          01 // ATTRIBUTION & 20% CONTROL GROUP MODEL (PRD 2.3 对齐)
        </h2>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>真实催付效果归因与 20% 对照组科学分流</CardTitle>
              <Badge variant={controlGroupEnabled ? "success" : "neutral"} dot>
                {controlGroupEnabled ? "分流实验已激活" : "已关闭对照组"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 text-xs font-mono">
            <p className="text-[#27272A] leading-relaxed font-sans">
              为杜绝将自然支付订单冒功为 AI 催付效果，系统自动将 20% 的待支付与 COD 订单划入沉默对照组，不发送 WhatsApp 提醒，以此精准计算净增量 (Net Lift)。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#FAFAFA] border border-[#E4E4E7]">
              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1">
                  20% 对照组分流开关
                </label>
                <button
                  type="button"
                  onClick={() => setControlGroupEnabled(!controlGroupEnabled)}
                  className="px-3 py-1.5 bg-white border border-[#E4E4E7] text-[#09090B] font-bold cursor-pointer hover:border-[#09090B]"
                >
                  {controlGroupEnabled ? "启用对照组 (推荐)" : "停用对照组 (不测算Lift)"}
                </button>
              </div>

              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1">
                  滚动统计分析窗口 (天)
                </label>
                <select
                  value={windowDays}
                  onChange={(e) => setWindowDays(Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-[#E4E4E7] text-[#09090B] cursor-pointer"
                >
                  <option value={7}>7 天短期窗口</option>
                  <option value={14}>14 天标准滚动窗口 (推荐)</option>
                  <option value={30}>30 天月度全量窗口</option>
                </select>
              </div>

              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1">
                  统计学显著性置信度
                </label>
                <select
                  value={confidenceRate}
                  onChange={(e) => setConfidenceRate(Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-[#E4E4E7] text-[#09090B] cursor-pointer"
                >
                  <option value={90}>90% 置信区间</option>
                  <option value={95}>95% 标准置信门槛 (p &lt; 0.05)</option>
                  <option value={99}>99% 严格置信门槛</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 模块 2: 店铺时区与货币锚定 */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          02 // TIMEZONE & CURRENCY LOCALIZATION (本土时区货币)
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1 font-bold">
                  电商店铺锚定时区 (严格禁止客户端推断)
                </label>
                <select
                  defaultValue="Asia/Jakarta"
                  className="w-full p-2 bg-white border border-[#E4E4E7] text-[#09090B] cursor-pointer"
                >
                  <option value="Asia/Jakarta">Asia/Jakarta (印尼西部时间 WIB, UTC+7)</option>
                  <option value="Asia/Bangkok">Asia/Bangkok (泰国时间 ICT, UTC+7)</option>
                  <option value="Asia/Singapore">Asia/Singapore (新加坡时间 SGT, UTC+8)</option>
                </select>
              </div>

              <div>
                <label className="text-[#71717A] text-[10px] uppercase block mb-1 font-bold">
                  本土主结算币种
                </label>
                <select
                  defaultValue="IDR"
                  className="w-full p-2 bg-white border border-[#E4E4E7] text-[#09090B] cursor-pointer"
                >
                  <option value="IDR">IDR (Rp 印尼盾)</option>
                  <option value="THB">THB (฿ 泰铢)</option>
                  <option value="USD">USD ($ 美元)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 模块 3: 团队 RBAC 权限矩阵 */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          03 // TEAM ACCESS & RBAC MATRIX (团队权限控制)
        </h2>
        <Card>
          <div className="divide-y divide-[#EEEEEE] text-xs font-mono">
            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#FAFAFA] text-[#71717A] font-semibold">
              <span>角色定义</span>
              <span>订单审核权限</span>
              <span>工作流与模板编辑</span>
              <span>财务充值与结算</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="font-bold text-[#09090B]">管理员 (Owner/Admin)</span>
              <span>✅ 完全读写</span>
              <span>✅ 完全读写</span>
              <span>✅ 完全读写</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="font-bold text-[#09090B]">出海运营 (Operator)</span>
              <span>✅ 审核发货</span>
              <span>✅ 编辑发布</span>
              <span>❌ 无权操作</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <span className="font-bold text-[#09090B]">客服坐席 (CS Agent)</span>
              <span>👁️ 只读查看</span>
              <span>❌ 无权操作</span>
              <span>❌ 无权操作</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 模块 4: 数据合规与 GDPR / Meta BAA */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          04 // COMPLIANCE & PRIVACY (合规与数据清除)
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4 text-xs font-mono">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-[#09090B]">全量商户隐私数据导出</div>
                <div className="text-[#71717A]">导出包含脱敏客户名单、WhatsApp 交互凭证与充值流水的加密 ZIP 归档</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => alert("导出任务已提交，将在 2 分钟内发送至您的注册邮箱")}>
                <Download className="w-3.5 h-3.5 mr-1" />
                导出数据
              </Button>
            </div>

            <div className="pt-4 border-t border-[#EEEEEE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-[#E11D48]">被遗忘权与店铺解绑 (Right to be Forgotten)</div>
                <div className="text-[#71717A]">彻底清除系统内部缓存的买家手机号与聊天记录，断开电商店铺 Webhook 直连</div>
              </div>
              <Button size="sm" variant="danger" onClick={() => alert("操作受保护：请输入商户主密钥以执行彻底抹除")}>
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                申请清除数据
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
