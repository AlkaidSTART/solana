"use client";

import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, useReducedMotion } from "motion/react";
import { transitions } from "@/lib/animations/motion-transitions";

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "underline" | "capsule";
  layoutId?: string;
}

/**
 * SolaFlow AI — 高性能无晃动 Tabs 组件
 * 采用 Motion.dev 标志性 layoutId 弹簧投影滑块技术，消除 DOM 测量跳跃与重排抖动
 */
export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  className,
  variant = "underline",
  layoutId,
}) => {
  const uniqueId = React.useId();
  const shouldReduceMotion = useReducedMotion();
  const activeLayoutId = layoutId || `tabs-indicator-${uniqueId}`;

  const tabTransition = shouldReduceMotion
    ? { duration: 0 }
    : transitions.springTab;

  if (variant === "capsule") {
    return (
      <div
        className={twMerge(
          "relative inline-flex p-1 bg-zinc-100/90 border border-zinc-200 rounded-lg select-none",
          className
        )}
      >
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={clsx(
                "relative z-10 px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer rounded-md flex items-center gap-1.5 transition-colors duration-150",
                isActive
                  ? "text-white font-medium"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId={`${activeLayoutId}-capsule`}
                  transition={tabTransition}
                  className="absolute inset-0 bg-zinc-900 rounded-md shadow-xs -z-10"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={clsx(
                    "relative z-10 px-1.5 py-0.2 text-[10px] rounded font-mono",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-zinc-200/80 text-zinc-700"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        "relative flex items-center gap-6 border-b border-zinc-200 select-none",
        className
      )}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              "relative pb-3 text-xs font-mono uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-colors duration-150",
              isActive
                ? "text-zinc-900 font-semibold"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 font-mono">
                {tab.badge}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId={`${activeLayoutId}-underline`}
                transition={tabTransition}
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
