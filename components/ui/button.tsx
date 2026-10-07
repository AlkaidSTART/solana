import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-mono text-xs uppercase tracking-wider transition-colors duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#09090B] focus-visible:outline-offset-2";

    const variantStyles = {
      primary:
        "bg-[#09090B] text-white hover:bg-[#27272A] active:bg-[#18181B] border border-[#09090B]",
      secondary:
        "bg-[#F4F4F5] text-[#09090B] hover:bg-[#E4E4E7] border border-[#E4E4E7]",
      outline:
        "bg-white text-[#09090B] hover:bg-[#FAFAFA] border border-[#E4E4E7] hover:border-[#18181B]",
      ghost:
        "bg-transparent text-[#71717A] hover:text-[#09090B] hover:bg-[#FAFAFA] border border-transparent",
      danger:
        "bg-white text-[#E11D48] border border-[#E11D48]/30 hover:bg-[#E11D48]/5 active:bg-[#E11D48]/10",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-[11px]",
      md: "h-9 px-4 text-xs",
      lg: "h-11 px-6 text-sm",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={twMerge(
          clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
