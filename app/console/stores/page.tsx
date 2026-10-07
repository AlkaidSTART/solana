"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import {
  Store,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
  Plus,
  Radio,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Send,
} from "lucide-react";
import { clsx } from "clsx";

interface TemplateItem {
  id: string;
  name: string;
  category: "MARKETING" | "UTILITY";
  language: "id_ID" | "th_TH" | "en_US";
  status: "APPROVED" | "PENDING";
  content: string;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: "tmpl_01",
    name: "abandoned_cart_recovery_id",
    category: "MARKETING",
    language: "id_ID",
    status: "APPROVED",
    content:
      "Halo {{1}}, pesanan Anda di {{2}} untuk {{3}} masih tersimpan nih! Klik link berikut untuk selesaikan pembayaran sebelum stok habis: {{4}}",
  },
  {
    id: "tmpl_02",
    name: "cod_address_verify_id",
    category: "UTILITY",
    language: "id_ID",
    status: "APPROVED",
    content:
      "Halo {{1}}! Pesanan COD #{{2}} siap kami kirimkan ke {{3}}. Mohon konfirmasi apakah alamat sudah sesuai dan ada orang di lokasi?",
  },
  {
    id: "tmpl_03",
    name: "abandoned_cart_recovery_th",
    category: "MARKETING",
    language: "th_TH",
    status: "APPROVED",
    content:
      "สวัสดีครับ {{1}} สินค้า {{2}} ในตะกร้ายังรอคุณอยู่นะครับ กดลิงก์เพื่อชำระเงินก่อนสินค้าหมด: {{3}}",
  },
  {
    id: "tmpl_04",
    name: "cod_address_verify_en",
    category: "UTILITY",
    language: "en_US",
    status: "APPROVED",
    content:
      "Hi {{1}}! Your COD order #{{2}} is ready for dispatch to {{3}}. Please confirm if your delivery address is accurate.",
  },
];

export default function ConsoleStoresPage() {
  const [pingStatus, setPingStatus] = useState<"idle" | "testing" | "success">("idle");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [testDrawerOpen, setTestDrawerOpen] = useState(false);

  const handlePingTest = () => {
    setPingStatus("testing");
    setTimeout(() => {
      setPingStatus("success");
    }, 450);
  };

  return (
    <div className="space-y-8">
      {/* 顶部标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E4E7] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
              店铺与通道 // Store & Channels
            </h1>
            <Badge variant="outline">Demo/Mock</Badge>
          </div>
          <p className="text-xs text-[#71717A] font-mono mt-0.5">
            管理 WooCommerce / Shopify 电商授权、自有 WABA 商业号健康度与获批多语言模板
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setTestDrawerOpen(true)}>
            通道连通性测试
          </Button>
          <Button size="sm">
            <Plus className="w-3.5 h-3.5 mr-1" />
            绑定新店铺
          </Button>
        </div>
      </div>

      {/* 模块 1: 电商店铺直连状态 */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          01 // ECOMMERCE STORES 直连授权
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 已连接: WooCommerce */}
          <Card className="hover:border-[#09090B] transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#09090B] text-white flex items-center justify-center font-mono text-xs font-bold">
                    WC
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-[#09090B]">
                      TokoSepatu_ID (WooCommerce)
                    </h3>
                    <span className="text-[10px] font-mono text-[#71717A]">
                      https://tokosepatu.co.id
                    </span>
                  </div>
                </div>
                <Badge variant="success" dot>
                  已连接
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#FAFAFA] border border-[#E4E4E7]">
                <div>
                  <span className="text-[#71717A] text-[10px] block">Webhook 签名</span>
                  <span className="text-[#09090B]">whsec_88...19x (有效)</span>
                </div>
                <div>
                  <span className="text-[#71717A] text-[10px] block">月同步订单</span>
                  <span className="text-[#09090B]">2,840 笔/月</span>
                </div>
                <div>
                  <span className="text-[#71717A] text-[10px] block">店铺币种</span>
                  <span className="text-[#09090B]">IDR (印尼盾)</span>
                </div>
                <div>
                  <span className="text-[#71717A] text-[10px] block">店铺时区</span>
                  <span className="text-[#09090B]">Asia/Jakarta (WIB)</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-[#71717A]">最近心跳: 1 分钟前</span>
                <Button size="sm" variant="outline">
                  管理配置
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 可添加: Shopify */}
          <Card className="border-dashed bg-[#FAFAFA] flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#E4E4E7] text-[#09090B] flex items-center justify-center font-mono text-xs font-bold">
                    SH
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-[#09090B]">
                      Shopify 出海独立站直连
                    </h3>
                    <span className="text-[10px] font-mono text-[#71717A]">
                      BKK_Fashion_TH 或新站点
                    </span>
                  </div>
                </div>
                <Badge variant="outline">可选接入</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs font-mono">
              <p className="text-[#71717A] leading-relaxed">
                支持 Shopify 官方 Webhook 自动监听 <code>checkouts/create</code> 与 <code>orders/create</code> 事件，零代码一键授权。
              </p>
              <div className="pt-2">
                <Button size="sm" variant="outline" className="w-full">
                  授权连接 Shopify 店铺
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 模块 2: WhatsApp 商业账号 (WABA) 状态卡片 */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
          02 // WHATSAPP BUSINESS ACCOUNT (WABA 自有商业号)
        </h2>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-[#059669]" />
                <h3 className="text-xs font-mono font-bold text-[#09090B]">
                  官方认证商业号码: +62 812-3456-7890 (TokoSepatu Official)
                </h3>
              </div>
              <Badge variant="success">Meta 官方绿标认证</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#FAFAFA] border border-[#E4E4E7] text-xs font-mono">
              <div>
                <span className="text-[#71717A] text-[10px] block">质量评级 (Quality)</span>
                <span className="text-[#059669] font-bold">HIGH (最高等级)</span>
              </div>
              <div>
                <span className="text-[#71717A] text-[10px] block">发送配额 (Messaging Tier)</span>
                <span className="text-[#09090B] font-bold">Tier 2 (10,000 / 24h)</span>
              </div>
              <div>
                <span className="text-[#71717A] text-[10px] block">Meta WABA ID</span>
                <span className="text-[#09090B]">902819280192</span>
              </div>
              <div>
                <span className="text-[#71717A] text-[10px] block">Phone Number ID</span>
                <span className="text-[#09090B]">102938192039</span>
              </div>
            </div>

            {/* 连通性测试按钮与反馈 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs font-mono text-[#71717A] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#059669]" />
                <span>
                  {pingStatus === "success"
                    ? "Webhook 探测成功: HTTP 200 OK • 响应延迟 148ms"
                    : "Webhook 订阅正常监听中 (Token 有效期剩余 58 天)"}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={pingStatus === "testing"}
                onClick={handlePingTest}
              >
                {pingStatus === "testing" ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                    正在 Ping Meta API...
                  </>
                ) : (
                  "执行 Webhook 连通性自测 (Ping)"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 模块 3: 获批多语言模板矩阵 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#71717A]">
            03 // APPROVED MULTI-LANGUAGE TEMPLATES (获批模板矩阵)
          </h2>
          <span className="text-[11px] font-mono text-[#71717A]">
            共 4 套获批模板 (印尼语 / 泰语 / 英语)
          </span>
        </div>

        <Card>
          <div className="divide-y divide-[#EEEEEE]">
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-4 hover:bg-[#FAFAFA] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#09090B]">
                      {tmpl.name}
                    </span>
                    <Badge variant="outline">{tmpl.language}</Badge>
                    <Badge variant="neutral">{tmpl.category}</Badge>
                    <Badge variant="success">APPROVED</Badge>
                  </div>
                  <p className="text-xs text-[#71717A] font-mono line-clamp-1 max-w-2xl">
                    {tmpl.content}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedTemplate(tmpl)}
                >
                  预览变量
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 模板详情抽屉 */}
      <Drawer
        open={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate?.name || "模板详情"}
        subtitle={`语言: ${selectedTemplate?.language} • 状态: APPROVED`}
        width="md"
      >
        {selectedTemplate && (
          <div className="space-y-5 text-xs font-mono">
            <div>
              <span className="text-[#71717A] uppercase text-[10px] block mb-1">
                Meta 官方原始模板正文
              </span>
              <div className="p-3 bg-[#FAFAFA] border border-[#E4E4E7] text-[#09090B] leading-relaxed">
                {selectedTemplate.content}
              </div>
            </div>

            <div>
              <span className="text-[#71717A] uppercase text-[10px] block mb-2">
                动态插槽变量映射 (Slots)
              </span>
              <div className="space-y-1.5 border border-[#E4E4E7] p-3">
                <div className="flex justify-between">
                  <span className="text-[#71717A]">&#123;&#123;1&#125;&#125;</span>
                  <span className="text-[#09090B]">买家称呼 (Customer Name)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">&#123;&#123;2&#125;&#125;</span>
                  <span className="text-[#09090B]">店铺名称 / 订单号 (Store / Order ID)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">&#123;&#123;3&#125;&#125;</span>
                  <span className="text-[#09090B]">商品缩写 / 配送地址 (Items / Address)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">&#123;&#123;4&#125;&#125;</span>
                  <span className="text-[#09090B]">直接支付链接 / 确认动作胶囊 (Action Link)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4E4E7]">
              <Button onClick={() => setSelectedTemplate(null)} className="w-full">
                关闭预览
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* 连通性自测抽屉 */}
      <Drawer
        open={testDrawerOpen}
        onClose={() => setTestDrawerOpen(false)}
        title="通道连通性与自测工具"
        subtitle="向指定测试手机号发送真实/模拟 WhatsApp 消息"
        width="md"
      >
        <div className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-[#71717A] uppercase text-[10px] block mb-1">
              测试目标号码 (带国际区号，如 +62 812xxxx)
            </label>
            <input
              type="text"
              defaultValue="+62 812-9812-4412"
              className="w-full p-2 border border-[#E4E4E7] text-xs font-mono focus:outline-none focus:border-[#09090B]"
            />
          </div>

          <div>
            <label className="text-[#71717A] uppercase text-[10px] block mb-1">
              选择下发测试模板
            </label>
            <select className="w-full p-2 border border-[#E4E4E7] text-xs font-mono bg-white focus:outline-none">
              <option>abandoned_cart_recovery_id (印尼语弃购挽回)</option>
              <option>cod_address_verify_id (印尼语COD核验)</option>
              <option>abandoned_cart_recovery_th (泰语弃购挽回)</option>
            </select>
          </div>

          <div className="p-3 bg-[#FAFAFA] border border-[#E4E4E7] text-[11px] text-[#71717A]">
            * 自测将消耗 1 个测试配额，不会触发正式订单状态流转。
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              className="flex-1"
              onClick={() => {
                alert("测试消息已通过 WhatsApp Cloud API 模拟下发！");
                setTestDrawerOpen(false);
              }}
            >
              发送测试消息
            </Button>
            <Button variant="outline" onClick={() => setTestDrawerOpen(false)}>
              取消
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
