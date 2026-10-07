"use client";

import React, { useState } from "react";
import { useAppStore, Conversation } from "@/stores/use-app-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Search,
  UserCheck,
  Bot,
  Send,
  Clock,
  BookOpen,
  Languages,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { clsx } from "clsx";

export default function ConsoleInboxPage() {
  const {
    conversations,
    activeConversationId,
    toggleHumanTakeover,
    sendChatMessage,
  } = useAppStore();

  const [activeId, setActiveId] = useState<string>(
    activeConversationId || conversations[0]?.id || ""
  );
  const [filterType, setFilterType] = useState<"ALL" | "TAKEOVER" | "BOT">("ALL");
  const [inputText, setInputText] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(true);

  const activeChat =
    conversations.find((c) => c.id === activeId) || conversations[0];

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E4E4E7] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono uppercase tracking-wider font-bold text-[#09090B]">
              会话与人工队列 // Inbox & Handover
            </h1>
            <Badge variant="outline">Demo/Mock</Badge>
          </div>
          <p className="text-xs text-[#71717A] font-mono mt-0.5">
            三栏高密度工作台 • 24h Meta 服务窗口保护 • 双向实时翻译 • 印尼俚语词典
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <Badge variant="success" dot>
            客服在线 (Agent Online)
          </Badge>
        </div>
      </div>

      {/* 三栏主工作区 (发丝线外框) */}
      <div className="border border-[#E4E4E7] bg-white grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* 栏 1: 会话列表 (3 栏宽) */}
        <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[#E4E4E7] flex flex-col justify-between bg-[#FAFAFA]/40">
          <div>
            {/* 列表头部与过滤 */}
            <div className="p-3 border-b border-[#E4E4E7] space-y-2">
              <div className="flex items-center gap-1">
                {(["ALL", "TAKEOVER", "BOT"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={clsx(
                      "flex-1 py-1 text-[10px] font-mono uppercase transition-colors cursor-pointer border",
                      filterType === t
                        ? "bg-[#09090B] text-white border-[#09090B]"
                        : "bg-white text-[#71717A] border-[#E4E4E7] hover:text-[#09090B]"
                    )}
                  >
                    {t === "ALL" ? "全部" : t === "TAKEOVER" ? "待接管" : "AI托管"}
                  </button>
                ))}
              </div>
            </div>

            {/* 会话列表流 */}
            <div className="divide-y divide-[#EEEEEE] overflow-y-auto max-h-[560px]">
              {filteredConversations.map((chat) => {
                const isSelected = chat.id === activeChat?.id;
                return (
                  <div
                    key={chat.id}
                    onClick={() => setActiveId(chat.id)}
                    className={clsx(
                      "p-3.5 cursor-pointer transition-colors space-y-1 select-none",
                      isSelected
                        ? "bg-white border-l-2 border-l-[#09090B]"
                        : "hover:bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#09090B] truncate">
                        {chat.customerName}
                      </span>
                      <span className="text-[10px] text-[#71717A]">
                        {chat.lastTimestamp}
                      </span>
                    </div>

                    <p className="text-xs text-[#71717A] truncate font-sans">
                      {chat.lastMessage}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                      <span className="text-[#71717A] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
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
        <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-[#E4E4E7] flex flex-col justify-between bg-white">
          {/* 聊天室顶栏 */}
          <div className="p-3.5 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#09090B]">
                  {activeChat?.customerName}
                </span>
                <span className="text-[11px] font-mono text-[#71717A]">
                  {activeChat?.customerPhone}
                </span>
                <Badge variant="outline">{activeChat?.language}</Badge>
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
                  <Bot className="w-3.5 h-3.5 mr-1" />
                  移交回 AI 自动托管
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 mr-1" />
                  接管当前会话
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
                  <div className="text-[10px] font-mono text-[#71717A] flex items-center gap-1.5">
                    <span>{isBuyer ? activeChat.customerName : "客服坐席 / AI"}</span>
                    <span>• {m.timestamp}</span>
                  </div>

                  <div
                    className={clsx(
                      "p-3 text-xs leading-relaxed border",
                      isBuyer
                        ? "bg-[#FAFAFA] text-[#09090B] border-[#E4E4E7]"
                        : "bg-[#09090B] text-white border-[#09090B]"
                    )}
                  >
                    {m.text}

                    {/* 双向翻译对照 (买家印尼语 -> 中文) */}
                    {m.translationZh && (
                      <div
                        className={clsx(
                          "mt-2 pt-2 border-t text-[11px] font-mono",
                          isBuyer
                            ? "border-[#E4E4E7] text-[#71717A]"
                            : "border-white/20 text-zinc-300"
                        )}
                      >
                        <span className="opacity-70 mr-1">转译:</span>
                        {m.translationZh}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 消息输入框与操作条 */}
          <div className="p-3 border-t border-[#E4E4E7] bg-[#FAFAFA] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A]">
              <div className="flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" />
                <span>输入中文自动实时翻译为印尼语/泰语发送</span>
              </div>
              <button
                onClick={() => setAutoTranslate(!autoTranslate)}
                className="hover:text-[#09090B] cursor-pointer"
              >
                {autoTranslate ? "[自动双向翻译: 开]" : "[自动翻译: 关]"}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={
                  activeChat?.isHumanTakeover
                    ? "输入回复内容（按 Enter 发送）..."
                    : "当前为 AI 自动托管，点击右上角【接管会话】后可手动回复"
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={!activeChat?.isHumanTakeover}
                className="flex-1 p-2 bg-white border border-[#E4E4E7] text-xs font-mono focus:outline-none focus:border-[#09090B] disabled:bg-[#F4F4F5]"
              />
              <Button
                size="sm"
                disabled={!activeChat?.isHumanTakeover || !inputText.trim()}
                onClick={handleSend}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 栏 3: 买家画像与印尼俚语词典 (3 栏宽) */}
        <div className="lg:col-span-3 p-4 space-y-5 bg-[#FAFAFA]/50 text-xs font-mono">
          {/* 买家简要档案 */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              买家与订单画像
            </h3>
            <div className="p-3 bg-white border border-[#E4E4E7] space-y-1.5">
              <div>
                <span className="text-[#71717A] text-[10px] block">客户姓名</span>
                <span className="text-[#09090B] font-bold">{activeChat?.customerName}</span>
              </div>
              <div>
                <span className="text-[#71717A] text-[10px] block">联系电话</span>
                <span className="text-[#09090B]">{activeChat?.customerPhone}</span>
              </div>
              <div>
                <span className="text-[#71717A] text-[10px] block">关联订单</span>
                <span className="text-[#059669] font-bold">
                  {activeChat?.orderId ? `#ID-9821 (COD Rp 389.000)` : "暂无进行中订单"}
                </span>
              </div>
            </div>
          </div>

          {/* 印尼俚语词典 Tooltip (Bahasa Gaul Lexicon) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              <BookOpen className="w-3.5 h-3.5 text-[#09090B]" />
              <span>印尼本土俚语词典 (BAHASA GAUL)</span>
            </div>

            <div className="p-3 bg-white border border-[#E4E4E7] space-y-2 text-[11px]">
              <div>
                <span className="font-bold text-[#09090B] bg-[#F4F4F5] px-1 py-0.2 mr-1">min</span>
                <span className="text-[#71717A]">Admin 缩写，代指客服/掌柜</span>
              </div>
              <div>
                <span className="font-bold text-[#09090B] bg-[#F4F4F5] px-1 py-0.2 mr-1">ongkir</span>
                <span className="text-[#71717A]">Ongkos Kirim 缩写，代指快递运费</span>
              </div>
              <div>
                <span className="font-bold text-[#09090B] bg-[#F4F4F5] px-1 py-0.2 mr-1">ga nyasar</span>
                <span className="text-[#71717A]">免得跑偏/迷路，指示地标准确</span>
              </div>
              <div>
                <span className="font-bold text-[#09090B] bg-[#F4F4F5] px-1 py-0.2 mr-1">kemahalan</span>
                <span className="text-[#71717A]">价格太贵了，可触发优惠挽留</span>
              </div>
              <div>
                <span className="font-bold text-[#09090B] bg-[#F4F4F5] px-1 py-0.2 mr-1">bisa COD ga</span>
                <span className="text-[#71717A]">能否货到付款，高意向询盘</span>
              </div>
            </div>
          </div>

          {/* 快捷回复短语库 */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              一键快捷短语
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
                  className="w-full text-left p-2 bg-white border border-[#E4E4E7] text-[10px] text-[#27272A] hover:border-[#09090B] cursor-pointer disabled:opacity-40"
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
