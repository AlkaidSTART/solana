"use client";

import React, { useState } from "react";
import { useAppStore, KnowledgeItem } from "@/stores/use-app-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Languages,
  Edit3,
  Globe,
} from "lucide-react";
import { clsx } from "clsx";

export default function ConsoleKnowledgePage() {
  const { knowledgeItems, updateKnowledgeItem } = useAppStore();
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [editSuccess, setEditSuccess] = useState(false);

  // 编辑临时状态
  const [zhText, setZhText] = useState("");
  const [idText, setIdText] = useState("");
  const [enText, setEnText] = useState("");
  const [thText, setThText] = useState("");

  const filteredItems = knowledgeItems.filter((item) => {
    if (statusFilter === "ALL") return true;
    return item.status === statusFilter;
  });

  const handleOpenDrawer = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setZhText(item.zh);
    setIdText(item.idGaul);
    setEnText(item.en);
    setThText(item.th);
    setEditSuccess(false);
  };

  const handleSave = () => {
    if (!selectedItem) return;
    updateKnowledgeItem(selectedItem.id, {
      zh: zhText,
      idGaul: idText,
      en: enText,
      th: thText,
      status: "PUBLISHED",
      lastUpdated: "刚刚",
    });
    setEditSuccess(true);
    setTimeout(() => {
      setSelectedItem(null);
      setEditSuccess(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E4E7] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
              多语言知识库 // Knowledge Base
            </h1>
            <Badge variant="outline">Demo/Mock</Badge>
          </div>
          <p className="text-xs text-[#71717A] font-mono mt-0.5">
            四列多语言对照编辑器（中/印尼/英/泰）• 跨语言冲突预警 • 东南亚俚语对齐
          </p>
        </div>

        <Button size="sm">
          <Plus className="w-3.5 h-3.5 mr-1" />
          新增知识问答
        </Button>
      </div>

      {/* 状态过滤胶囊 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setStatusFilter(t)}
              className={clsx(
                "px-3 py-1 uppercase transition-colors cursor-pointer border",
                statusFilter === t
                  ? "bg-[#09090B] text-white border-[#09090B]"
                  : "bg-white text-[#71717A] border-[#E4E4E7] hover:text-[#09090B]"
              )}
            >
              {t === "ALL" ? "全部知识条目" : t === "PUBLISHED" ? "已发布" : "草稿箱"}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-[#71717A]">
          共 {filteredItems.length} 条有效多语言配置
        </span>
      </div>

      {/* 四列对照卡片列表 */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:border-[#09090B] transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{item.category}</Badge>
                  <span className="text-xs font-mono text-[#71717A]">
                    更新于: {item.lastUpdated}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === "PUBLISHED" ? "success" : "warning"}>
                    {item.status}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => handleOpenDrawer(item)}>
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    四列对照编辑
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 四列多语言横向对照网格 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                {/* 列 1: 中文底稿 */}
                <div className="p-3 bg-[#FAFAFA] border border-[#E4E4E7] space-y-1">
                  <div className="text-[10px] text-[#71717A] uppercase font-bold">
                    🇨🇳 中文底稿 (卖家原意)
                  </div>
                  <p className="text-[#09090B] leading-relaxed font-sans">{item.zh}</p>
                </div>

                {/* 列 2: 印尼口语 */}
                <div className="p-3 bg-white border border-[#E4E4E7] space-y-1">
                  <div className="text-[10px] text-[#059669] uppercase font-bold">
                    🇮🇩 印尼口语 (Bahasa Gaul)
                  </div>
                  <p className="text-[#09090B] leading-relaxed font-sans">{item.idGaul}</p>
                </div>

                {/* 列 3: 国际英语 */}
                <div className="p-3 bg-[#FAFAFA] border border-[#E4E4E7] space-y-1">
                  <div className="text-[10px] text-[#71717A] uppercase font-bold">
                    🌐 国际英语 (English)
                  </div>
                  <p className="text-[#09090B] leading-relaxed font-sans">{item.en}</p>
                </div>

                {/* 列 4: 泰语 */}
                <div className="p-3 bg-white border border-[#E4E4E7] space-y-1">
                  <div className="text-[10px] text-[#71717A] uppercase font-bold">
                    🇹🇭 泰语 (Thai)
                  </div>
                  <p className="text-[#09090B] leading-relaxed font-sans leading-[1.6]">
                    {item.th}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 四列对照编辑器抽屉 */}
      <Drawer
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="四列多语言对照编辑器"
        subtitle="修改后将自动同步至 WhatsApp 智能应答引擎与人工快捷短语库"
        width="xl"
      >
        {selectedItem && (
          <div className="space-y-6 text-xs font-mono">
            {editSuccess && (
              <div className="p-3 bg-[#059669]/10 text-[#059669] border border-[#059669]/20 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>知识条目已成功发布并同步上线！</span>
              </div>
            )}

            {/* 跨语言冲突预警提示 */}
            <div className="p-3 bg-[#FAFAFA] border border-[#E4E4E7] flex items-center gap-2 text-[#71717A]">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              <span>
                自动检查机制：系统已对各语言中出现的数字（天数、金额）进行交叉语义比对，确保承诺一致。
              </span>
            </div>

            {/* 4 个编辑文本框 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[#71717A] uppercase text-[10px] block mb-1 font-bold">
                  1. 中文基准底稿 (卖家业务原意)
                </label>
                <textarea
                  rows={4}
                  value={zhText}
                  onChange={(e) => setZhText(e.target.value)}
                  className="w-full p-2.5 border border-[#E4E4E7] font-sans text-xs focus:outline-none focus:border-[#09090B]"
                />
              </div>

              <div>
                <label className="text-[#059669] uppercase text-[10px] block mb-1 font-bold">
                  2. 印尼本土口语 (Bahasa Gaul / 电商网购俚语)
                </label>
                <textarea
                  rows={4}
                  value={idText}
                  onChange={(e) => setIdText(e.target.value)}
                  className="w-full p-2.5 border border-[#E4E4E7] font-sans text-xs focus:outline-none focus:border-[#09090B]"
                />
              </div>

              <div>
                <label className="text-[#71717A] uppercase text-[10px] block mb-1 font-bold">
                  3. 国际英语 (English)
                </label>
                <textarea
                  rows={4}
                  value={enText}
                  onChange={(e) => setEnText(e.target.value)}
                  className="w-full p-2.5 border border-[#E4E4E7] font-sans text-xs focus:outline-none focus:border-[#09090B]"
                />
              </div>

              <div>
                <label className="text-[#71717A] uppercase text-[10px] block mb-1 font-bold">
                  4. 泰语本地化 (Thai / 行高保持 1.6 以上)
                </label>
                <textarea
                  rows={4}
                  value={thText}
                  onChange={(e) => setThText(e.target.value)}
                  className="w-full p-2.5 border border-[#E4E4E7] font-sans text-xs leading-[1.6] focus:outline-none focus:border-[#09090B]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4E4E7] flex gap-3">
              <Button onClick={handleSave} className="flex-1">
                保存并发布上线
              </Button>
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                取消
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
