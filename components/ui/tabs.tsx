import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
  if (variant === "capsule") {
    return (
      <div
        className={twMerge(
          "inline-flex p-1 bg-[#F4F4F5] border border-[#E4E4E7]",
          className
        )}
      >
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={clsx(
                "px-3 py-1 text-xs font-mono uppercase tracking-wider transition-all select-none cursor-pointer",
                isActive
                  ? "bg-[#09090B] text-white"
                  : "text-[#71717A] hover:text-[#09090B]"
              )}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={clsx(
                    "ml-1.5 px-1 py-0.2 text-[10px]",
                    isActive ? "bg-white/20 text-white" : "bg-black/10 text-black"
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
        "flex items-center gap-6 border-b border-[#E4E4E7]",
        className
      )}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              "relative pb-3 text-xs font-mono uppercase tracking-wider transition-colors select-none cursor-pointer flex items-center gap-1.5",
              isActive
                ? "text-[#09090B] font-medium"
                : "text-[#71717A] hover:text-[#09090B]"
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="text-[10px] px-1 py-0.2 bg-[#F4F4F5] border border-[#E4E4E7] text-[#71717A]">
                {tab.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#09090B]" />
            )}
          </button>
        );
      })}
    </div>
  );
};
