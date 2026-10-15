"use client";

import * as React from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { drawerVariants } from "@/lib/animations/motion-transitions";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * SolaFlow AI — 物理阻尼抽屉组件
 * 基于 Motion.dev AnimatePresence 与弹簧滑入滑出过渡，手感稳健扎实
 */
export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "md",
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const widthStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* 半透明遮罩 */}
          <motion.div
            variants={drawerVariants.backdrop}
            initial={shouldReduceMotion ? { opacity: 1 } : "hidden"}
            animate="visible"
            exit={shouldReduceMotion ? { opacity: 0 } : "exit"}
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
            <motion.div
              variants={drawerVariants.panel}
              initial={shouldReduceMotion ? { x: 0 } : "hidden"}
              animate="visible"
              exit={shouldReduceMotion ? { x: 0 } : "exit"}
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
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg border border-transparent hover:border-zinc-200 transition-colors focus-visible:outline-2 focus-visible:outline-zinc-900 cursor-pointer"
                  aria-label="关闭抽屉"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
