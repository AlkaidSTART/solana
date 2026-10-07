"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import {
  RefreshCw,
  Plus,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";
import { useAppStore, type OrderLanguage } from "@/stores/use-app-store";
import { getI18nText } from "@/lib/i18n";

interface TemplateItem {
  id: string;
  name: string;
  category: "MARKETING" | "UTILITY";
  language: OrderLanguage;
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
      "Halo {{1}}! Keranjang belanja Anda di {{2}} masih tersimpan nih. Selesaikan pesanan {{3}} Anda sebelum kehabisan ya: {{4}}",
  },
  {
    id: "tmpl_02",
    name: "cod_address_verify_id",
    category: "UTILITY",
    language: "id_ID",
    status: "APPROVED",
    content:
      "Halo Kak {{1}}! Pesanan COD #{{2}} senilai {{3}} siap dikirim ke {{4}}. Mohon pastikan patokan alamat sudah benar ya kak.",
  },
  {
    id: "tmpl_03",
    name: "abandoned_cart_recovery_th",
    category: "MARKETING",
    language: "th_TH",
    status: "APPROVED",
    content:
      "สวัสดีครับคุณ {{1}}! สินค้าในตะกร้า {{2}} ของคุณยังอยู่นะครับ คลิกชำระเงินก่อนสินค้าหมดได้ที่นี่: {{3}}",
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
  {
    id: "tmpl_05",
    name: "abandoned_cart_recovery_sg",
    category: "MARKETING",
    language: "en_SG",
    status: "APPROVED",
    content:
      "Hi {{1}}! Notice your cart at {{2}} is waiting. Free courier discount applied lah, complete order {{3}} before stock runs out: {{4}}",
  },
  {
    id: "tmpl_06",
    name: "cod_address_verify_ms",
    category: "UTILITY",
    language: "ms_MY",
    status: "APPROVED",
    content:
      "Hai Sis {{1}}! Pesanan COD #{{2}} bernilai {{3}} sedia untuk dipos ke {{4}}. Sila pastikan alamat betul sebelum kami hantar ya.",
  },
  {
    id: "tmpl_07",
    name: "abandoned_cart_recovery_vi",
    category: "MARKETING",
    language: "vi_VN",
    status: "APPROVED",
    content:
      "Chào bạn {{1}}! Giỏ hàng tại {{2}} của bạn vẫn đang được giữ. Hoàn tất đơn hàng {{3}} để nhận ưu đãi freeship nha: {{4}}",
  },
  {
    id: "tmpl_08",
    name: "cod_address_verify_ph",
    category: "UTILITY",
    language: "fil_PH",
    status: "APPROVED",
    content:
      "Hi {{1}}! Ang inyong COD order #{{2}} na nagkakahalaga ng {{3}} ay handa nang i-ship sa {{4}}. Pakikumpirma po ang landmark ng inyong delivery address.",
  },
];

export default function ConsoleStoresPage() {
  const [pingStatus, setPingStatus] = useState<"idle" | "testing" | "success">("idle");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [testDrawerOpen, setTestDrawerOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("+62 812-9812-4412");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // 绑定新店铺模态框
  const [bindStoreModalOpen, setBindStoreModalOpen] = useState(false);
  const [platform, setPlatform] = useState<"WooCommerce" | "Shopify">("WooCommerce");
  const [storeName, setStoreName] = useState("Batik_Indo_Store");
  const [storeUrl, setStoreUrl] = useState("https://batikindo.co.id");
  const [isBinding, setIsBinding] = useState(false);
  const [bindSuccess, setBindSuccess] = useState(false);

  const handlePingTest = () => {
    setPingStatus("testing");
    setTimeout(() => {
      setPingStatus("success");
    }, 450);
  };

  const handleSendTestMessage = () => {
    setTestSending(true);
    setTestResult(null);
    setTimeout(() => {
      setTestSending(false);
      setTestResult("消息成功通过 Meta Cloud API 下发！响应延迟 138ms · Message ID: wamid.HBgMOTEyMzgx");
    }, 700);
  };

  const handleBindStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBinding(true);
    setTimeout(() => {
      setIsBinding(false);
      setBindSuccess(true);
      setTimeout(() => {
        setBindSuccess(false);
        setBindStoreModalOpen(false);
      }, 1200);
    }, 800);
  };

  return (
    <div className="space-y-8">
      {/* 顶部标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-zinc-900">
              店铺与通道 · Store & Channels
            </h1>
            <Badge variant="outline">Demo/Mock</Badge>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            管理 WooCommerce / Shopify 电商授权、自有 WABA 商业号健康度与获批多语言模板
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setTestDrawerOpen(true)}>
            通道连通性测试
          </Button>
          <Button
            size="sm"
            onClick={() => setBindStoreModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            绑定新店铺
          </Button>
        </div>
      </div>

      {/* 模块 1: 电商店铺直连状态 */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-500">
          01 · ECOMMERCE STORES 直连授权
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 已连接: WooCommerce */}
          <Card className="hover:border-zinc-900 transition-colors rounded-xl shadow-2xs">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-mono text-xs font-bold">
                    WC
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-zinc-900">
                      TokoSepatu_ID (WooCommerce)
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-500">
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
              <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <div>
                  <span className="text-zinc-500 text-[10px] block">Webhook 签名</span>
                  <span className="text-zinc-900 font-semibold">whsec_88...19x (有效)</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">月同步订单</span>
                  <span className="text-zinc-900 font-semibold">2,840 笔/月</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">店铺币种</span>
                  <span className="text-zinc-900 font-semibold">IDR (印尼盾)</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">店铺时区</span>
                  <span className="text-zinc-900 font-semibold">Asia/Jakarta (WIB)</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-zinc-500">最近心跳: 1 分钟前</span>
                <Button size="sm" variant="outline">
                  管理 Webhook
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 已连接: Shopify */}
          <Card className="hover:border-zinc-900 transition-colors rounded-xl shadow-2xs">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-mono text-xs font-bold">
                    SH
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-zinc-900">
                      BKK_Fashion_TH (Shopify)
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-500">
                      bkk-fashion-thai.myshopify.com
                    </span>
                  </div>
                </div>
                <Badge variant="success" dot>
                  已连接
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <div>
                  <span className="text-zinc-500 text-[10px] block">Webhook 签名</span>
                  <span className="text-zinc-900 font-semibold">sh_sec_99...42k (有效)</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">月同步订单</span>
                  <span className="text-zinc-900 font-semibold">1,420 笔/月</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">店铺币种</span>
                  <span className="text-zinc-900 font-semibold">THB (泰铢)</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">店铺时区</span>
                  <span className="text-zinc-900 font-semibold">Asia/Bangkok (ICT)</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-zinc-500">最近心跳: 3 分钟前</span>
                <Button size="sm" variant="outline">
                  管理 Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 模块 2: WhatsApp 商业账号 (WABA) 状态卡片 */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-500">
          02 · WHATSAPP BUSINESS ACCOUNT (WABA 自有商业号)
        </h2>
        <Card className="rounded-xl shadow-2xs">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-600 ring-2 ring-emerald-500/20" />
                <h3 className="text-xs font-mono font-bold text-zinc-900">
                  官方认证商业号码: +62 812-3456-7890 (TokoSepatu Official)
                </h3>
              </div>
              <Badge variant="success">Meta 官方绿标认证</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-mono">
              <div>
                <span className="text-zinc-500 text-[10px] block">质量评级 (Quality)</span>
                <span className="text-emerald-700 font-bold">HIGH (最高等级)</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">发送配额 (Messaging Tier)</span>
                <span className="text-zinc-900 font-bold">Tier 2 (10,000 / 24h)</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Meta WABA ID</span>
                <span className="text-zinc-900 font-semibold">902819280192</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Phone Number ID</span>
                <span className="text-zinc-900 font-semibold">102938192039</span>
              </div>
            </div>

            {/* 连通性测试按钮与反馈 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs font-mono text-zinc-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
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
          <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-500">
            03 · APPROVED MULTI-LANGUAGE TEMPLATES (获批模板矩阵)
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">
            共 4 套获批模板 (印尼语 / 泰语 / 英语)
          </span>
        </div>

        <Card className="rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-zinc-200">
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono hover:bg-zinc-50/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900">{tmpl.name}</span>
                    <Badge variant={tmpl.category === "MARKETING" ? "neutral" : "outline"}>
                      {tmpl.category}
                    </Badge>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                      {tmpl.language}
                    </span>
                  </div>
                  <p className="text-zinc-500 font-sans text-xs line-clamp-1">
                    {tmpl.content}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Badge variant="success" dot>
                    获批生效 (Approved)
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTemplate(tmpl)}
                  >
                    预览与变量
                  </Button>
                </div>
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
              <span className="text-zinc-500 uppercase text-[10px] block mb-1">
                Meta 官方原始模板正文
              </span>
              <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 text-zinc-900 leading-relaxed font-sans">
                {selectedTemplate.content}
              </div>
            </div>

            <div>
              <span className="text-zinc-500 uppercase text-[10px] block mb-2 font-bold">
                动态插槽变量映射 (Slots)
              </span>
              <div className="space-y-2 border border-zinc-200 rounded-lg p-3.5 bg-white">
                <div className="flex justify-between">
                  <span className="text-zinc-500">&#123;&#123;1&#125;&#125;</span>
                  <span className="text-zinc-900 font-medium">买家称呼 (Customer Name)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">&#123;&#123;2&#125;&#125;</span>
                  <span className="text-zinc-900 font-medium">店铺名称 / 订单号 (Store / Order ID)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">&#123;&#123;3&#125;&#125;</span>
                  <span className="text-zinc-900 font-medium">商品缩写 / 配送地址 (Items / Address)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">&#123;&#123;4&#125;&#125;</span>
                  <span className="text-zinc-900 font-medium">直接支付链接 / 确认动作胶囊 (Action Link)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200">
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
            <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
              测试目标号码 (带国际区号，如 +62 812xxxx)
            </label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
              选择下发测试模板
            </label>
            <select className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono bg-white focus:outline-none cursor-pointer">
              <option>abandoned_cart_recovery_id (印尼语弃购挽回)</option>
              <option>cod_address_verify_id (印尼语COD核验)</option>
              <option>abandoned_cart_recovery_th (泰语弃购挽回)</option>
            </select>
          </div>

          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-[11px] text-zinc-500 leading-relaxed">
            * 自测将消耗 1 个测试配额，验证 WhatsApp Cloud API 与本地服务器的连通性。
          </div>

          {testResult && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{testResult}</span>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={testSending}
              onClick={handleSendTestMessage}
            >
              {testSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  正在发送...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  发送测试消息
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setTestDrawerOpen(false)}>
              关闭
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 绑定新店铺模态框 */}
      <Modal
        open={bindStoreModalOpen}
        onClose={() => setBindStoreModalOpen(false)}
        title="绑定新的出海电商店铺"
        subtitle="授权 SolaFlow 监听订单产生与改址 Webhook"
        width="md"
      >
        <form onSubmit={handleBindStoreSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
              电商平台类型
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlatform("WooCommerce")}
                className={`p-3 border rounded-lg text-center cursor-pointer transition-all ${
                  platform === "WooCommerce"
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
                }`}
              >
                WooCommerce (WordPress)
              </button>
              <button
                type="button"
                onClick={() => setPlatform("Shopify")}
                className={`p-3 border rounded-lg text-center cursor-pointer transition-all ${
                  platform === "Shopify"
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
                }`}
              >
                Shopify Store
              </button>
            </div>
          </div>

          <div>
            <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
              店铺名称
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-zinc-900"
              required
            />
          </div>

          <div>
            <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
              店铺独立域名 URL
            </label>
            <input
              type="url"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder="https://yourstore.co.id"
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-zinc-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
                Consumer Key
              </label>
              <input
                type="text"
                defaultValue="ck_981298491823901"
                className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div>
              <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
                Consumer Secret
              </label>
              <input
                type="password"
                defaultValue="cs_981298491823901"
                className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>

          {bindSuccess && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>店铺连接测试成功！已自动注册 Webhook 监听端点。</span>
            </div>
          )}

          <div className="pt-3 border-t border-zinc-200 flex gap-3">
            <Button
              type="submit"
              disabled={isBinding}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isBinding ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  正在验证 API 权限...
                </>
              ) : (
                "连接并授权店铺"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBindStoreModalOpen(false)}
            >
              取消
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
