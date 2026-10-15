"use client";

import * as React from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { modalVariants } from "@/lib/animations/motion-transitions";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * SolaFlow AI — 物理阻尼模态框
 * 基于 Motion.dev AnimatePresence 与微缩放弹簧过渡，零残留与闪烁
 */
export const Modal: React.FC<ModalProps> = ({
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
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            {/* Backdrop */}
            <motion.div
              variants={modalVariants.backdrop}
              initial={shouldReduceMotion ? { opacity: 1 } : "hidden"}
              animate="visible"
              exit={shouldReduceMotion ? { opacity: 0 } : "exit"}
              className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs"
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Modal Panel */}
            <motion.div
              variants={modalVariants.panel}
              initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : "hidden"}
              animate="visible"
              exit={shouldReduceMotion ? { opacity: 0 } : "exit"}
              className={twMerge(
                clsx(
                  "relative w-full transform overflow-hidden bg-white text-left align-middle border border-zinc-200 rounded-xl shadow-2xl z-10",
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
                  aria-label="关闭对话框"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
