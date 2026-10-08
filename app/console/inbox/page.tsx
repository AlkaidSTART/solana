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
import {
  MOCK_SLANG_LEXICON,
  MOCK_QUICK_REPLIES,
  MOCK_DEMO_BUYER_ORDER,
} from "@/mock";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsApi } from "@/lib/api";

export default function ConsoleInboxPage() {
  const queryClient = useQueryClient();
  const {
    conversations,
    activeConversationId,
    toggleHumanTakeover,
    sendChatMessage,
    locale,
    currentStoreId,
  } = useAppStore();

  const [activeId, setActiveId] = useState<string>(
    activeConversationId || conversations[0]?.id || ""
  );
  const [filterType, setFilterType] = useState<string>("ALL");
  const [inputText, setInputText] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(true);

  // 从后端获取会话列表
  const { data: apiConversationsData } = useQuery({
    queryKey: ["conversations", currentStoreId],
    queryFn: () => conversationsApi.listConversations({ storeId: currentStoreId }),
    retry: false,
  });

  // 从后端获取当前激活会话消息历史
  const { data: apiMessagesData } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => conversationsApi.listMessages(activeId),
    enabled: !!activeId,
    retry: false,
  });

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

  // 发送消息 Mutation
  const sendMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      try {
        await conversationsApi.sendMessage(id, { text, language: activeChat?.language });
      } catch {
        // 沙盒降级
      }
    },
    onSuccess: (_, vars) => {
      sendChatMessage(vars.id, vars.text);
      void queryClient.invalidateQueries({ queryKey: ["messages", vars.id] });
    },
  });

  // 人工接管/交还机器 Mutation
  const takeoverMutation = useMutation({
    mutationFn: async ({ id, currentlyTakeover }: { id: string; currentlyTakeover: boolean }) => {
      try {
        if (currentlyTakeover) {
          await conversationsApi.resume(id);
        } else {
          await conversationsApi.handoff(id);
        }
      } catch {
        // 沙盒降级
      }
    },
    onSuccess: (_, vars) => {
      toggleHumanTakeover(vars.id);
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = () => {
    if (!inputText.trim() || !activeChat) return;
    const text = inputText.trim();
    setInputText("");
    sendMutation.mutate({ id: activeChat.id, text });
  };

  const handleQuickReply = (text: string) => {
    if (!activeChat) return;
    sendMutation.mutate({ id: activeChat.id, text });
  };

  const handleToggleTakeover = () => {
    if (!activeChat) return;
    takeoverMutation.mutate({ id: activeChat.id, currentlyTakeover: activeChat.isHumanTakeover });
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
          {apiConversationsData?.items && (
            <span className="text-[10px] text-zinc-400">
              API: {apiConversationsData.items.length} 会话
            </span>
          )}
          {apiMessagesData && (
            <span className="text-[10px] text-emerald-600 font-bold">
              ● 直连
            </span>
          )}
          <Badge variant="success">
            {getI18nText(locale, "inbox_badge_online")}
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
                        <span>{getI18nText(locale, "inbox_chat_window")}: {chat.windowExpiresIn}</span>
                      </span>

                      {chat.isHumanTakeover ? (
                        <Badge variant="warning">{getI18nText(locale, "inbox_badge_human")}</Badge>
                      ) : (
                        <Badge variant="outline">{getI18nText(locale, "inbox_badge_ai")}</Badge>
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
              disabled={takeoverMutation.isPending}
              onClick={handleToggleTakeover}
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
                    <span>{isBuyer ? activeChat.customerName : getI18nText(locale, "inbox_agent_label")}</span>
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
                        <span className="text-emerald-500 font-bold mr-1">{getI18nText(locale, "inbox_translation_label")}:</span>
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
                <span>{getI18nText(locale, "inbox_translate_hint")}</span>
              </div>
              <button
                onClick={() => setAutoTranslate(!autoTranslate)}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                {autoTranslate ? getI18nText(locale, "inbox_translate_toggle_on") : getI18nText(locale, "inbox_translate_toggle_off")}
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
              {getI18nText(locale, "inbox_profile_title")}
            </h3>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl space-y-2 shadow-2xs">
              <div>
                <span className="text-zinc-400 text-[10px] block">{getI18nText(locale, "inbox_profile_name")}</span>
                <span className="text-zinc-900 font-bold">{activeChat?.customerName}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px] block">{getI18nText(locale, "inbox_profile_phone")}</span>
                <span className="text-zinc-900">{activeChat?.customerPhone}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px] block">{getI18nText(locale, "inbox_profile_order")}</span>
                <span className="text-emerald-700 font-bold">
                  {activeChat?.orderId ? MOCK_DEMO_BUYER_ORDER.displayLabel : getI18nText(locale, "inbox_profile_no_order")}
                </span>
              </div>
            </div>
          </div>

          {/* 印尼俚语词典 Tooltip (Bahasa Gaul Lexicon) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>{getI18nText(locale, "inbox_slang_title")}</span>
            </div>

            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl space-y-2.5 text-[11px] shadow-2xs">
              {MOCK_SLANG_LEXICON.map((s, idx) => (
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
              {getI18nText(locale, "inbox_quick_replies")}
            </h3>
            <div className="space-y-1.5">
              {MOCK_QUICK_REPLIES.map((phrase, i) => (
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
