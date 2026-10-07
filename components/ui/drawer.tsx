"use client";

import * as React from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { gsap } from "gsap";

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
  const panelRef = React.useRef<HTMLDivElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = React.useState(open);

  React.useEffect(() => {
    if (open) {
      setShouldRender(true);
    } else if (panelRef.current && backdropRef.current) {
      // 退出动画
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.25 });
      gsap.to(panelRef.current, {
        x: "100%",
        duration: 0.28,
        ease: "power3.in",
        onComplete: () => setShouldRender(false),
      });
    } else {
      setShouldRender(false);
    }
  }, [open]);

  // 入场动画
  React.useEffect(() => {
    if (shouldRender && open && panelRef.current && backdropRef.current) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(
        panelRef.current,
        { x: "100%" },
        { x: "0%", duration: 0.38, ease: "power3.out" }
      );
    }
  }, [shouldRender, open]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!shouldRender) return null;

  const widthStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* 半透明遮罩 */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div
          ref={panelRef}
          className={twMerge(
            clsx(
              "w-screen bg-white border-l border-zinc-200 flex flex-col shadow-2xl pointer-events-auto",
              widthStyles[width],
              className
            )
          )}
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-900 font-bold">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-zinc-500 mt-0.5 font-mono">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg border border-transparent hover:border-zinc-200 transition-colors focus-visible:outline-2 focus-visible:outline-zinc-900"
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
