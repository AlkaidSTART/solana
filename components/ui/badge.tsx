import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "warning" | "danger" | "outline";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  dot = false,
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border";

  const variantStyles = {
    neutral: "bg-[#F4F4F5] text-[#27272A] border-[#E4E4E7]",
    outline: "bg-white text-[#71717A] border-[#E4E4E7]",
    success: "bg-white text-[#059669] border-[#059669]/30",
    warning: "bg-white text-[#D97706] border-[#D97706]/30",
    danger: "bg-white text-[#E11D48] border-[#E11D48]/30",
  };

  const dotColors = {
    neutral: "bg-[#71717A]",
    outline: "bg-[#A1A1AA]",
    success: "bg-[#059669]",
    warning: "bg-[#D97706]",
    danger: "bg-[#E11D48]",
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
      {...props}
    >
      {dot && (
        <span
          className={twMerge("h-1.5 w-1.5 rounded-full", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
