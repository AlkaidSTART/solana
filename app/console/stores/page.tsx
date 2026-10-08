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
import { useAppStore } from "@/stores/use-app-store";
import { getI18nText } from "@/lib/i18n";
import { MOCK_TEMPLATES, type TemplateItem } from "@/mock";

export default function ConsoleStoresPage() {
  const { locale } = useAppStore();
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
              {getI18nText(locale, "stores_title")}
            </h1>
            <Badge variant="outline">{getI18nText(locale, "demo_badge")}</Badge>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            {getI18nText(locale, "stores_subhead")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setTestDrawerOpen(true)}>
            {getI18nText(locale, "overview_retry_conn")}
          </Button>
          <Button
            size="sm"
            onClick={() => setBindStoreModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {getI18nText(locale, "stores_btn_connect")}
          </Button>
        </div>
      </div>

      {/* 模块 1: 电商店铺直连状态 */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-500">
          {getI18nText(locale, "stores_mod_ecommerce")}
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
                <Badge variant="success">
                  {getI18nText(locale, "stores_connected_badge")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <div>
                  <span className="text-zinc-500 text-[10px] block">{getI18nText(locale, "stores_col_webhook_sec")}</span>
                  <span className="text-zinc-900 font-semibold">whsec_88...19x (有效)</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">{getI18nText(locale, "stores_col_monthly_orders")}</span>
                  <span className="text-zinc-900 font-semibold">2,840 笔/月</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">{getI18nText(locale, "stores_col_currency")}</span>
                  <span className="text-zinc-900 font-semibold">IDR (印尼盾)</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">{getI18nText(locale, "stores_col_timezone")}</span>
                  <span className="text-zinc-900 font-semibold">Asia/Jakarta (WIB)</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-zinc-500">{getI18nText(locale, "stores_last_heartbeat")}: 1m ago</span>
                <Button size="sm" variant="outline">
                  {getI18nText(locale, "stores_btn_manage_webhook")}
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
                <Badge variant="success">
                  {getI18nText(locale, "stores_connected_badge")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <div>
                  <span className="text-zinc-500 text-[10px] block">{getI18nText(locale, "stores_col_webhook_sec")}</span>
                  <span className="text-zinc-900 font-semibold">sh_sec_99...42k (有效)</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">{getI18nText(locale, "stores_col_monthly_orders")}</span>
                  <span className="text-zinc-900 font-semibold">1,420 笔/月</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">{getI18nText(locale, "stores_col_currency")}</span>
                  <span className="text-zinc-900 font-semibold">THB (泰铢)</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">{getI18nText(locale, "stores_col_timezone")}</span>
                  <span className="text-zinc-900 font-semibold">Asia/Bangkok (ICT)</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-zinc-500">{getI18nText(locale, "stores_last_heartbeat")}: 3m ago</span>
                <Button size="sm" variant="outline">
                  {getI18nText(locale, "stores_btn_manage_webhook")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 模块 2: WhatsApp 商业账号 (WABA) 状态卡片 */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-500">
          {getI18nText(locale, "stores_mod_waba")}
        </h2>
        <Card className="rounded-xl shadow-2xs">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-bold text-zinc-900">
                  官方认证商业号码: +62 812-3456-7890 (TokoSepatu Official)
                </h3>
              </div>
              <Badge variant="success">{getI18nText(locale, "stores_waba_verified")}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-mono">
              <div>
                <span className="text-zinc-500 text-[10px] block">{getI18nText(locale, "stores_waba_quality")}</span>
                <span className="text-emerald-700 font-bold">HIGH</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">{getI18nText(locale, "stores_waba_tier")}</span>
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
                    {getI18nText(locale, "stores_waba_ping_running")}
                  </>
                ) : (
                  getI18nText(locale, "stores_waba_ping_btn")
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
            {getI18nText(locale, "stores_waba_templates")}
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">
            4 Templates (ID / TH / EN / SG)
          </span>
        </div>

        <Card className="rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-zinc-200">
            {MOCK_TEMPLATES.map((tmpl) => (
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
                  <Badge variant="success">
                    {getI18nText(locale, "stores_template_approved")}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTemplate(tmpl)}
                  >
                    {getI18nText(locale, "stores_template_preview_btn")}
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
        title={selectedTemplate?.name || getI18nText(locale, "stores_template_preview_btn")}
        subtitle={`Language: ${selectedTemplate?.language} • Status: APPROVED`}
        width="md"
      >
        {selectedTemplate && (
          <div className="space-y-5 text-xs font-mono">
            <div>
              <span className="text-zinc-500 uppercase text-[10px] block mb-1">
                Meta Official Raw Template
              </span>
              <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 text-zinc-900 leading-relaxed font-sans">
                {selectedTemplate.content}
              </div>
            </div>

            <div>
              <span className="text-zinc-500 uppercase text-[10px] block mb-2 font-bold">
                Dynamic Slot Variables Mapping (Slots)
              </span>
              <div className="space-y-2 border border-zinc-200 rounded-lg p-3.5 bg-white">
                <div className="flex justify-between">
                  <span className="text-zinc-500">&#123;&#123;1&#125;&#125;</span>
                  <span className="text-zinc-900 font-medium">Customer Name</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">&#123;&#123;2&#125;&#125;</span>
                  <span className="text-zinc-900 font-medium">Store / Order ID</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">&#123;&#123;3&#125;&#125;</span>
                  <span className="text-zinc-900 font-medium">Items / Delivery Address</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">&#123;&#123;4&#125;&#125;</span>
                  <span className="text-zinc-900 font-medium">Payment Link / Action Capsule</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200">
              <Button onClick={() => setSelectedTemplate(null)} className="w-full">
                {getI18nText(locale, "action_close")}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* 连通性自测抽屉 */}
      <Drawer
        open={testDrawerOpen}
        onClose={() => setTestDrawerOpen(false)}
        title={getI18nText(locale, "stores_drawer_ping_title")}
        subtitle={getI18nText(locale, "stores_drawer_ping_sub")}
        width="md"
      >
        <div className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
              {getI18nText(locale, "stores_drawer_ping_phone")}
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
              {getI18nText(locale, "stores_drawer_ping_template")}
            </label>
            <select className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono bg-white focus:outline-none cursor-pointer">
              <option>abandoned_cart_recovery_id</option>
              <option>cod_address_verify_id</option>
              <option>abandoned_cart_recovery_th</option>
            </select>
          </div>

          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-[11px] text-zinc-500 leading-relaxed">
            {getI18nText(locale, "stores_drawer_ping_notice")}
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
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Send Test
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setTestDrawerOpen(false)}>
              {getI18nText(locale, "action_close")}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 绑定新店铺模态框 */}
      <Modal
        open={bindStoreModalOpen}
        onClose={() => setBindStoreModalOpen(false)}
        title={getI18nText(locale, "stores_modal_bind_title")}
        subtitle={getI18nText(locale, "stores_modal_bind_sub")}
        width="md"
      >
        <form onSubmit={handleBindStoreSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
              {getI18nText(locale, "stores_modal_bind_platform")}
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
              {getI18nText(locale, "stores_modal_bind_name")}
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
              {getI18nText(locale, "stores_modal_bind_url")}
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
              <span>{getI18nText(locale, "stores_modal_bind_success")}</span>
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
                  Verifying...
                </>
              ) : (
                getI18nText(locale, "stores_modal_bind_submit")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBindStoreModalOpen(false)}
            >
              {getI18nText(locale, "action_cancel")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
