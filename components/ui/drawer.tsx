"use client";

import * as React from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "md",
  className,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const widthStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* 纯净暗调半透明遮罩 */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={twMerge(
            clsx(
              "w-screen bg-white border-l border-[#E4E4E7] flex flex-col shadow-2xl transition-transform duration-200",
              widthStyles[width],
              className
            )
          )}
        >
          {/* Header */}
          <div className="p-5 border-b border-[#E4E4E7] flex items-center justify-between bg-white">
            <div>
              <h2 className="text-sm font-mono uppercase tracking-wider text-[#09090B] font-semibold">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[#71717A] mt-0.5 font-mono">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-transparent hover:border-[#E4E4E7] transition-colors focus-visible:outline-2 focus-visible:outline-[#09090B]"
              aria-label="关闭抽屉"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      </div>
    </div>
  );
};
