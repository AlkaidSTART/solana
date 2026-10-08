"use client";

import React, { useState } from "react";
import { useAppStore, KnowledgeItem } from "@/stores/use-app-store";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Tabs } from "@/components/ui/tabs";
import {
  Plus,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Search,
} from "lucide-react";
import { clsx } from "clsx";
import { getI18nText } from "@/lib/i18n";

export default function ConsoleKnowledgePage() {
  const { knowledgeItems, updateKnowledgeItem, addKnowledgeItem, locale } = useAppStore();
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // 编辑临时状态（中/印尼/英/泰 + 新加坡/大马/越南/菲律宾）
  const [zhText, setZhText] = useState("");
  const [idText, setIdText] = useState("");
  const [enText, setEnText] = useState("");
  const [thText, setThText] = useState("");
  const [enSgText, setEnSgText] = useState("");
  const [msText, setMsText] = useState("");
  const [viText, setViText] = useState("");
  const [filText, setFilText] = useState("");

  // 新增知识问答抽屉
  const [newDrawerOpen, setNewDrawerOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<"FAQ" | "PRODUCT" | "LOGISTICS">("FAQ");
  const [newZh, setNewZh] = useState("");
  const [newId, setNewId] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newTh, setNewTh] = useState("");
  const [newEnSg, setNewEnSg] = useState("");
  const [newMs, setNewMs] = useState("");
  const [newVi, setNewVi] = useState("");
  const [newFil, setNewFil] = useState("");

  const filteredItems = knowledgeItems.filter((item) => {
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesSearch =
      item.zh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.idGaul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.enSg && item.enSg.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.ms && item.ms.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleOpenDrawer = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setZhText(item.zh);
    setIdText(item.idGaul);
    setEnText(item.en);
    setThText(item.th);
    setEnSgText(item.enSg || "");
    setMsText(item.ms || "");
    setViText(item.vi || "");
    setFilText(item.fil || "");
    setEditSuccess(false);
  };

  const handleAiTranslate = () => {
    setIsTranslating(true);
    setTimeout(() => {
      setIsTranslating(false);
      setIdText("Bisa kak, pengiriman ke seluruh kota Jabodetabek & Jawa Barat 1-2 hari sampai!");
      setEnText("Yes, delivery across Jabodetabek and West Java takes 1-2 business days.");
      setThText("ได้ครับคุณลูกค้า จัดส่งทั่วกรุงเทพและปริมณฑลใช้เวลา 1-2 วันครับ");
      setEnSgText("Can lah! Islandwide doorstep courier across Singapore takes 1-2 days only.");
      setMsText("Boleh sis, penghantaran Semenanjung guna Pos Laju 1-2 hari bekerja sampai!");
      setViText("Dạ được nha shop, giao hàng hoả tốc nội thành 1-2 ngày là nhận được ạ!");
      setFilText("Opo, 1-2 araw lang po ang delivery sa inyo via J&T Express!");
    }, 600);
  };

  const handleNewAiTranslate = () => {
    if (!newZh.trim()) return;
    setIsTranslating(true);
    setTimeout(() => {
      setIsTranslating(false);
      const snippet = newZh.slice(0, 10);
      setNewId(`Siap kak, untuk ${snippet}... kami bantu cek garansi ya.`);
      setNewEn(`Yes dear, regarding ${snippet}... our team will verify for you.`);
      setNewTh(`ครับผม สำหรับ ${snippet}... ทีมงานดูแลให้ครับ`);
      setNewEnSg(`Can help you check ${snippet} right away lah, don't worry!`);
      setNewMs(`Boleh sangat sis, untuk ${snippet}... kami semak untuk anda ya.`);
      setNewVi(`Dạ vâng, về ${snippet}... shop sẽ kiểm tra hỗ trợ bạn ngay ạ.`);
      setNewFil(`Opo, tungkol po sa ${snippet}... iche-check po namin agad para sa inyo.`);
    }, 600);
  };

  const handleSave = () => {
    if (!selectedItem) return;
    updateKnowledgeItem(selectedItem.id, {
      zh: zhText,
      idGaul: idText,
      en: enText,
      th: thText,
      enSg: enSgText,
      ms: msText,
      vi: viText,
      fil: filText,
      status: "PUBLISHED",
      lastUpdated: "Just now",
    });
    setEditSuccess(true);
    setTimeout(() => {
      setSelectedItem(null);
      setEditSuccess(false);
    }, 600);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZh.trim()) return;

    const newItem: KnowledgeItem = {
      id: `kb_${Date.now()}`,
      category: newCategory,
      zh: newZh,
      idGaul: newId || "Halo kak, siap kami layani secepatnya ya!",
      en: newEn || "Hello, we are happy to assist you immediately!",
      th: newTh || "สวัสดีครับ พร้อมให้บริการคุณลูกค้าทันทีครับ",
      enSg: newEnSg || "Hello! Ready to assist you right away lah!",
      ms: newMs || "Hai sis, sedia membantu dengan segera!",
      vi: newVi || "Chào bạn, shop sẵn sàng hỗ trợ bạn ngay ạ!",
      fil: newFil || "Kumusta po, handa po kaming tumulong sa inyo agad!",
      status: "PUBLISHED",
      lastUpdated: "Just now",
    };

    addKnowledgeItem(newItem);
    setNewDrawerOpen(false);
    setNewZh("");
    setNewId("");
    setNewEn("");
    setNewTh("");
    setNewEnSg("");
    setNewMs("");
    setNewVi("");
    setNewFil("");
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-zinc-900">
              {getI18nText(locale, "kb_title")}
            </h1>
            <Badge variant="outline">{getI18nText(locale, "demo_badge")}</Badge>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            {getI18nText(locale, "kb_subhead")}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setNewDrawerOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          {getI18nText(locale, "kb_btn_add")}
        </Button>
      </div>

      {/* 筛选与搜索 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-zinc-50/70 border border-zinc-200 rounded-xl shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder={getI18nText(locale, "kb_search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-4">
          <Tabs
            variant="capsule"
            activeId={statusFilter}
            onChange={setStatusFilter}
            items={[
              { id: "ALL", label: getI18nText(locale, "kb_tab_all") },
              { id: "PUBLISHED", label: getI18nText(locale, "kb_tab_published") },
              { id: "DRAFT", label: getI18nText(locale, "kb_tab_draft") },
            ]}
          />
          <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
            ({filteredItems.length})
          </span>
        </div>
      </div>

      {/* 多语言对照卡片列表 */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:border-zinc-900 transition-colors rounded-xl shadow-2xs">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{item.category}</Badge>
                  <span className="text-xs font-mono text-zinc-400">
                    {item.lastUpdated}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === "PUBLISHED" ? "success" : "warning"}>
                    {item.status}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => handleOpenDrawer(item)}>
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    {getI18nText(locale, "kb_drawer_title")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 第一行：中 / 印尼 / 英 / 泰 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 text-xs font-mono">
                {/* 列 1: 中文底稿 */}
                <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                  <div className="text-[10px] text-amber-700 uppercase font-bold flex items-center gap-1.5">
                    <span className="px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-[9px]">ZH</span>
                    <span>{getI18nText(locale, "kb_col_zh")}</span>
                  </div>
                  <p className="text-zinc-900 leading-relaxed font-sans">{item.zh}</p>
                </div>

                {/* 列 2: 印尼口语 */}
                <div className="p-3.5 bg-emerald-50/30 rounded-lg border border-emerald-200/80 space-y-1">
                  <div className="text-[10px] text-emerald-700 uppercase font-bold flex items-center gap-1.5">
                    <span className="px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px]">ID</span>
                    <span>{getI18nText(locale, "kb_col_id")}</span>
                  </div>
                  <p className="text-zinc-900 leading-relaxed font-sans">{item.idGaul}</p>
                </div>

                {/* 列 3: 国际英语 */}
                <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                  <div className="text-[10px] text-blue-700 uppercase font-bold flex items-center gap-1.5">
                    <span className="px-1 py-0.2 rounded bg-blue-500/10 border border-blue-500/20 text-[9px]">EN</span>
                    <span>{getI18nText(locale, "kb_col_en")}</span>
                  </div>
                  <p className="text-zinc-900 leading-relaxed font-sans">{item.en}</p>
                </div>

                {/* 列 4: 泰语 */}
                <div className="p-3.5 bg-purple-50/20 rounded-lg border border-purple-200/80 space-y-1">
                  <div className="text-[10px] text-purple-700 uppercase font-bold flex items-center gap-1.5">
                    <span className="px-1 py-0.2 rounded bg-purple-500/10 border border-purple-500/20 text-[9px]">TH</span>
                    <span>{getI18nText(locale, "kb_col_th")}</span>
                  </div>
                  <p className="text-zinc-900 leading-relaxed font-sans leading-[1.6]">
                    {item.th}
                  </p>
                </div>
              </div>

              {/* 第二行：东南亚扩展语言（新加坡 Singlish / 马来西亚 / 越南 / 菲律宾） */}
              {(item.enSg || item.ms || item.vi || item.fil) && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 text-xs font-mono pt-3 border-t border-zinc-200/70">
                  {/* 列 SG: 新加坡 Singlish */}
                  <div className="p-3 bg-amber-50/20 rounded-lg border border-amber-200/70 space-y-1">
                    <div className="text-[10px] text-amber-800 uppercase font-bold flex items-center gap-1.5">
                      <span className="px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-[9px]">SG</span>
                      <span>{getI18nText(locale, "kb_col_sg")}</span>
                    </div>
                    <p className="text-zinc-900 leading-relaxed font-sans">{item.enSg || "—"}</p>
                  </div>

                  {/* 列 MY: 马来西亚 */}
                  <div className="p-3 bg-cyan-50/20 rounded-lg border border-cyan-200/70 space-y-1">
                    <div className="text-[10px] text-cyan-800 uppercase font-bold flex items-center gap-1.5">
                      <span className="px-1 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px]">MY</span>
                      <span>{getI18nText(locale, "kb_col_ms")}</span>
                    </div>
                    <p className="text-zinc-900 leading-relaxed font-sans">{item.ms || "—"}</p>
                  </div>

                  {/* 列 VN: 越南 */}
                  <div className="p-3 bg-blue-50/20 rounded-lg border border-blue-200/70 space-y-1">
                    <div className="text-[10px] text-blue-800 uppercase font-bold flex items-center gap-1.5">
                      <span className="px-1 py-0.2 rounded bg-blue-500/10 border border-blue-500/20 text-[9px]">VN</span>
                      <span>{getI18nText(locale, "kb_col_vi")}</span>
                    </div>
                    <p className="text-zinc-900 leading-relaxed font-sans">{item.vi || "—"}</p>
                  </div>

                  {/* 列 PH: 菲律宾 */}
                  <div className="p-3 bg-rose-50/20 rounded-lg border border-rose-200/70 space-y-1">
                    <div className="text-[10px] text-rose-800 uppercase font-bold flex items-center gap-1.5">
                      <span className="px-1 py-0.2 rounded bg-rose-500/10 border border-rose-500/20 text-[9px]">PH</span>
                      <span>{getI18nText(locale, "kb_col_ph")}</span>
                    </div>
                    <p className="text-zinc-900 leading-relaxed font-sans">{item.fil || "—"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 多语言对照编辑器抽屉 */}
      <Drawer
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={getI18nText(locale, "kb_drawer_title")}
        subtitle={`${selectedItem?.category} • WhatsApp NLP`}
        width="xl"
      >
        {selectedItem && (
          <div className="space-y-6 text-xs font-mono">
            {editSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{getI18nText(locale, "settings_saved_success")}</span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-zinc-600">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-[11px]">{getI18nText(locale, "kb_conflict_desc")}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={isTranslating}
                onClick={handleAiTranslate}
              >
                {isTranslating ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                )}
                {getI18nText(locale, "kb_btn_ai_translate")}
              </Button>
            </div>

            {/* 4 个基础编辑文本框 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-amber-700 uppercase text-[10px] block mb-1 font-bold">
                  {getI18nText(locale, "kb_col_zh")}
                </label>
                <textarea
                  rows={3}
                  value={zhText}
                  onChange={(e) => setZhText(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-emerald-700 uppercase text-[10px] block mb-1 font-bold">
                  {getI18nText(locale, "kb_col_id")}
                </label>
                <textarea
                  rows={3}
                  value={idText}
                  onChange={(e) => setIdText(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-blue-700 uppercase text-[10px] block mb-1 font-bold">
                  {getI18nText(locale, "kb_col_en")}
                </label>
                <textarea
                  rows={3}
                  value={enText}
                  onChange={(e) => setEnText(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-purple-700 uppercase text-[10px] block mb-1 font-bold">
                  {getI18nText(locale, "kb_col_th")}
                </label>
                <textarea
                  rows={3}
                  value={thText}
                  onChange={(e) => setThText(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 rounded-lg font-sans text-xs leading-[1.6] focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            {/* 东南亚本土扩展语言配置 */}
            <div className="pt-3 border-t border-zinc-200 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-amber-800 uppercase text-[10px] block mb-1 font-bold">
                    {getI18nText(locale, "kb_col_sg")}
                  </label>
                  <textarea
                    rows={3}
                    value={enSgText}
                    onChange={(e) => setEnSgText(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="text-cyan-800 uppercase text-[10px] block mb-1 font-bold">
                    {getI18nText(locale, "kb_col_ms")}
                  </label>
                  <textarea
                    rows={3}
                    value={msText}
                    onChange={(e) => setMsText(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="text-blue-800 uppercase text-[10px] block mb-1 font-bold">
                    {getI18nText(locale, "kb_col_vi")}
                  </label>
                  <textarea
                    rows={3}
                    value={viText}
                    onChange={(e) => setViText(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="text-rose-800 uppercase text-[10px] block mb-1 font-bold">
                    {getI18nText(locale, "kb_col_ph")}
                  </label>
                  <textarea
                    rows={3}
                    value={filText}
                    onChange={(e) => setFilText(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex gap-3">
              <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                {getI18nText(locale, "action_save")}
              </Button>
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                {getI18nText(locale, "action_cancel")}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* 新增知识问答抽屉 */}
      <Drawer
        open={newDrawerOpen}
        onClose={() => setNewDrawerOpen(false)}
        title={getI18nText(locale, "kb_drawer_new_title")}
        subtitle="AI NLP"
        width="xl"
      >
        <form onSubmit={handleCreateNew} className="space-y-5 text-xs font-mono">
          <div>
            <label className="text-zinc-500 uppercase text-[10px] block mb-1 font-bold">
              Category
            </label>
            <div className="flex gap-2">
              {(["FAQ", "PRODUCT", "LOGISTICS"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewCategory(cat)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg border text-xs font-mono transition-all",
                    newCategory === cat
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-amber-700 uppercase text-[10px] font-bold">
                {getI18nText(locale, "kb_col_zh")}
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!newZh.trim() || isTranslating}
                onClick={handleNewAiTranslate}
              >
                {isTranslating ? (
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1 text-indigo-600" />
                )}
                {getI18nText(locale, "kb_btn_ai_translate")}
              </Button>
            </div>
            <textarea
              rows={3}
              value={newZh}
              onChange={(e) => setNewZh(e.target.value)}
              className="w-full p-2.5 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-emerald-700 uppercase text-[10px] block mb-1 font-bold">
                {getI18nText(locale, "kb_col_id")}
              </label>
              <textarea
                rows={2}
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="w-full p-2 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="text-blue-700 uppercase text-[10px] block mb-1 font-bold">
                {getI18nText(locale, "kb_col_en")}
              </label>
              <textarea
                rows={2}
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                className="w-full p-2 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="text-purple-700 uppercase text-[10px] block mb-1 font-bold">
                {getI18nText(locale, "kb_col_th")}
              </label>
              <textarea
                rows={2}
                value={newTh}
                onChange={(e) => setNewTh(e.target.value)}
                className="w-full p-2 border border-zinc-200 rounded-lg font-sans text-xs leading-[1.6] focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-200/60">
            <div>
              <label className="text-amber-800 uppercase text-[10px] block mb-1 font-bold">
                {getI18nText(locale, "kb_col_sg")}
              </label>
              <textarea
                rows={2}
                value={newEnSg}
                onChange={(e) => setNewEnSg(e.target.value)}
                className="w-full p-2 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="text-cyan-800 uppercase text-[10px] block mb-1 font-bold">
                {getI18nText(locale, "kb_col_ms")}
              </label>
              <textarea
                rows={2}
                value={newMs}
                onChange={(e) => setNewMs(e.target.value)}
                className="w-full p-2 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="text-blue-800 uppercase text-[10px] block mb-1 font-bold">
                {getI18nText(locale, "kb_col_vi")}
              </label>
              <textarea
                rows={2}
                value={newVi}
                onChange={(e) => setNewVi(e.target.value)}
                className="w-full p-2 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="text-rose-800 uppercase text-[10px] block mb-1 font-bold">
                {getI18nText(locale, "kb_col_ph")}
              </label>
              <textarea
                rows={2}
                value={newFil}
                onChange={(e) => setNewFil(e.target.value)}
                className="w-full p-2 border border-zinc-200 rounded-lg font-sans text-xs focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 flex gap-3">
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {getI18nText(locale, "action_confirm")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewDrawerOpen(false)}
            >
              {getI18nText(locale, "action_cancel")}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
