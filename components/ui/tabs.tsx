"use client";

import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { gsap } from "gsap";

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
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  className,
  variant = "underline",
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const indicatorRef = React.useRef<HTMLDivElement>(null);
  const hasMounted = React.useRef(false);

  // GSAP 平滑滑块动画
  React.useEffect(() => {
    if (!containerRef.current || !indicatorRef.current) return;

    const activeButton = containerRef.current.querySelector<HTMLButtonElement>(
      `[data-tab-id="${activeId}"]`
    );

    if (activeButton) {
      const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = activeButton;

      if (!hasMounted.current) {
        // 首屏初次加载即时对齐，防止视效跳跃
        gsap.set(indicatorRef.current, {
          x: offsetLeft,
          y: offsetTop,
          width: offsetWidth,
          height: variant === "underline" ? 2 : offsetHeight,
          opacity: 1,
        });
        hasMounted.current = true;
      } else {
        // 切换时 GSAP 丝滑缓动
        gsap.to(indicatorRef.current, {
          x: offsetLeft,
          y: offsetTop,
          width: offsetWidth,
          height: variant === "underline" ? 2 : offsetHeight,
          opacity: 1,
          duration: 0.32,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    }
  }, [activeId, variant, items]);

  if (variant === "capsule") {
    return (
      <div
        ref={containerRef}
        className={twMerge(
          "relative inline-flex p-1 bg-zinc-100/90 border border-zinc-200 rounded-lg select-none",
          className
        )}
      >
        {/* GSAP 驱动的浮动胶囊背景滑块 */}
        <div
          ref={indicatorRef}
          className="absolute left-0 top-0 bg-zinc-900 rounded-md shadow-xs pointer-events-none opacity-0 z-0"
        />

        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={clsx(
                "relative z-10 px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors duration-200 cursor-pointer rounded-md flex items-center gap-1.5",
                isActive
                  ? "text-white font-medium"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={clsx(
                    "px-1.5 py-0.2 text-[10px] rounded",
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
      ref={containerRef}
      className={twMerge(
        "relative flex items-center gap-6 border-b border-zinc-200 select-none",
        className
      )}
    >
      {/* GSAP 驱动的下划线滑动指示器 */}
      <div
        ref={indicatorRef}
        className="absolute left-0 bottom-0 h-[2px] bg-emerald-600 pointer-events-none opacity-0 z-10"
      />

      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              "relative pb-3 text-xs font-mono uppercase tracking-wider transition-colors duration-200 cursor-pointer flex items-center gap-1.5",
              isActive
                ? "text-zinc-900 font-semibold"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-zinc-600">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
