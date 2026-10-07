"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/stores/use-app-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import {
  UserCheck,
  Bot,
  Send,
  Clock,
  BookOpen,
  Languages,
} from "lucide-react";
import { clsx } from "clsx";
import { gsap } from "gsap";
import { getI18nText } from "@/lib/i18n";

export default function ConsoleInboxPage() {
  const {
    conversations,
    activeConversationId,
    toggleHumanTakeover,
    sendChatMessage,
    locale,
  } = useAppStore();

  const [activeId, setActiveId] = useState<string>(
    activeConversationId || conversations[0]?.id || ""
  );
  const [filterType, setFilterType] = useState<string>("ALL");
  const [inputText, setInputText] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(true);

  const activeChat =
    conversations.find((c) => c.id === activeId) || conversations[0];

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // GSAP 聊天区域淡入过渡
  useEffect(() => {
    if (chatContainerRef.current) {
      gsap.fromTo(
        chatContainerRef.current,
        { opacity: 0.4, y: 8 },
        { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
      );
    }
  }, [activeId]);

  // 滚动至最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages.length]);

  const filteredConversations = conversations.filter((c) => {
    if (filterType === "TAKEOVER") return c.isHumanTakeover;
    if (filterType === "BOT") return !c.isHumanTakeover;
    return true;
  });

  const handleSend = () => {
    if (!inputText.trim() || !activeChat) return;
    sendChatMessage(activeChat.id, inputText.trim());
    setInputText("");
  };

  const handleQuickReply = (text: string) => {
    if (!activeChat) return;
    sendChatMessage(activeChat.id, text);
  };

  return (
    <div className="space-y-4">
      {/* 顶部标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-zinc-900">
              {getI18nText(locale, "inbox_title")}
            </h1>
            <Badge variant="outline">{getI18nText(locale, "demo_badge")}</Badge>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            {getI18nText(locale, "inbox_subhead")}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <Badge variant="success" dot>
            Agent Online
          </Badge>
        </div>
      </div>

      {/* 三栏主工作区 */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white grid grid-cols-1 lg:grid-cols-12 min-h-[660px] shadow-2xs">
        {/* 栏 1: 会话列表 (3 栏宽) */}
        <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col justify-between bg-zinc-50/50">
          <div>
            {/* 列表头部与过滤 */}
            <div className="p-3 border-b border-zinc-200">
              <Tabs
                variant="capsule"
                activeId={filterType}
                onChange={setFilterType}
                items={[
                  { id: "ALL", label: getI18nText(locale, "status_all") },
                  { id: "TAKEOVER", label: getI18nText(locale, "inbox_queue_human") },
                  { id: "BOT", label: getI18nText(locale, "inbox_queue_ai") },
                ]}
                className="w-full justify-between"
              />
            </div>

            {/* 会话列表流 */}
            <div className="divide-y divide-zinc-200/70 overflow-y-auto max-h-[560px]">
              {filteredConversations.map((chat) => {
                const isSelected = chat.id === activeChat?.id;
                return (
                  <div
                    key={chat.id}
                    onClick={() => setActiveId(chat.id)}
                    className={clsx(
                      "p-3.5 cursor-pointer transition-all space-y-1 select-none",
                      isSelected
                        ? "bg-white border-l-3 border-l-emerald-600 shadow-xs"
                        : "hover:bg-white/80"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-zinc-900 truncate">
                        {chat.customerName}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {chat.lastTimestamp}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 truncate font-sans">
                      {chat.lastMessage}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>窗口: {chat.windowExpiresIn}</span>
                      </span>

                      {chat.isHumanTakeover ? (
                        <Badge variant="warning">人工已接管</Badge>
                      ) : (
                        <Badge variant="outline">AI 托管</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 栏 2: 活跃会话聊天流 (6 栏宽) */}
        <div
          ref={chatContainerRef}
          className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col justify-between bg-white"
        >
          {/* 聊天室顶栏 */}
          <div className="p-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-900">
                  {activeChat?.customerName}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {activeChat?.customerPhone}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {activeChat?.language}
                </span>
              </div>
            </div>

            {/* 人工接管切换开关 */}
            <Button
              size="sm"
              variant={activeChat?.isHumanTakeover ? "danger" : "outline"}
              onClick={() => toggleHumanTakeover(activeChat.id)}
            >
              {activeChat?.isHumanTakeover ? (
                <>
                  <Bot className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  {getI18nText(locale, "inbox_btn_release")}
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  {getI18nText(locale, "inbox_btn_takeover")}
                </>
              )}
            </Button>
          </div>

          {/* 消息对话气泡列表 */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[460px]">
            {activeChat?.messages.map((m) => {
              const isBuyer = m.sender === "buyer";
              return (
                <div
                  key={m.id}
                  className={clsx(
                    "flex flex-col max-w-[85%] space-y-1",
                    isBuyer ? "mr-auto" : "ml-auto items-end"
                  )}
                >
                  <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                    <span>{isBuyer ? activeChat.customerName : "客服坐席 / AI 助手"}</span>
                    <span>• {m.timestamp}</span>
                  </div>

                  <div
                    className={clsx(
                      "p-3.5 text-xs leading-relaxed rounded-xl shadow-2xs",
                      isBuyer
                        ? "bg-zinc-100 text-zinc-900 border border-zinc-200/80"
                        : "bg-zinc-900 text-white"
                    )}
                  >
                    <p className="font-sans">{m.text}</p>

                    {/* 双向翻译对照 (买家印尼语 -> 中文) */}
                    {m.translationZh && (
                      <div
                        className={clsx(
                          "mt-2 pt-2 border-t text-[11px] font-mono",
                          isBuyer
                            ? "border-zinc-200 text-zinc-600"
                            : "border-zinc-700 text-zinc-300"
                        )}
                      >
                        <span className="text-emerald-500 font-bold mr-1">转译:</span>
                        {m.translationZh}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* 消息输入框与操作条 */}
          <div className="p-3 border-t border-zinc-200 bg-zinc-50/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-indigo-600" />
                <span>输入中文自动实时翻译为印尼语/泰语发送</span>
              </div>
              <button
                onClick={() => setAutoTranslate(!autoTranslate)}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                {autoTranslate ? "[自动双向翻译: 开]" : "[自动翻译: 关]"}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={
                  activeChat?.isHumanTakeover
                    ? getI18nText(locale, "inbox_input_placeholder")
                    : getI18nText(locale, "inbox_queue_ai")
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={!activeChat?.isHumanTakeover}
                className="flex-1 p-2.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400 shadow-2xs"
              />
              <Button
                size="sm"
                disabled={!activeChat?.isHumanTakeover || !inputText.trim()}
                onClick={handleSend}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 栏 3: 买家画像与印尼俚语词典 (3 栏宽) */}
        <div className="lg:col-span-3 p-4 space-y-5 bg-zinc-50/50 text-xs font-mono">
          {/* 买家简要档案 */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              买家与订单画像
            </h3>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl space-y-2 shadow-2xs">
              <div>
                <span className="text-zinc-400 text-[10px] block">客户姓名</span>
                <span className="text-zinc-900 font-bold">{activeChat?.customerName}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px] block">联系电话</span>
                <span className="text-zinc-900">{activeChat?.customerPhone}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px] block">关联订单</span>
                <span className="text-emerald-700 font-bold">
                  {activeChat?.orderId ? `#ID-9821 (COD Rp 389.000)` : "暂无进行中订单"}
                </span>
              </div>
            </div>
          </div>

          {/* 印尼俚语词典 Tooltip (Bahasa Gaul Lexicon) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>印尼本土俚语词典 (BAHASA GAUL)</span>
            </div>

            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl space-y-2.5 text-[11px] shadow-2xs">
              {[
                { token: "min", desc: "Admin 缩写，代指客服/掌柜" },
                { token: "ongkir", desc: "Ongkos Kirim 缩写，代指快递运费" },
                { token: "ga nyasar", desc: "免得跑偏/迷路，指示地标准确" },
                { token: "kemahalan", desc: "价格太贵了，可触发优惠挽留" },
                { token: "bisa COD ga", desc: "能否货到付款，高意向询盘" },
              ].map((s, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="font-bold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 text-[10px]">
                    {s.token}
                  </span>
                  <span className="text-zinc-500 text-[11px] pt-0.5">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 快捷回复短语库 */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              一键快捷短语 (点击填入)
            </h3>
            <div className="space-y-1.5">
              {[
                "Siap kak, paket akan segera kami kirim!",
                "Bisa COD kok kak, mohon siapkan uang pas ya.",
                "Ada diskon ongkir Rp 10.000 khusus hari ini kak!",
              ].map((phrase, i) => (
                <button
                  key={i}
                  disabled={!activeChat?.isHumanTakeover}
                  onClick={() => handleQuickReply(phrase)}
                  className="w-full text-left p-2.5 bg-white border border-zinc-200 rounded-lg text-[10px] text-zinc-700 hover:border-emerald-500 hover:text-zinc-900 cursor-pointer disabled:opacity-40 transition-colors shadow-2xs"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
