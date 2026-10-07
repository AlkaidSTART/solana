import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={twMerge(
          clsx(
            "h-9 w-full bg-white px-3 py-1 text-xs font-mono text-[#09090B] placeholder:text-[#A1A1AA] border border-[#E4E4E7] transition-colors focus:border-[#09090B] focus:outline-none focus:ring-1 focus:ring-[#09090B] disabled:cursor-not-allowed disabled:bg-[#FAFAFA] disabled:text-[#A1A1AA]",
            error && "border-[#E11D48] focus:border-[#E11D48] focus:ring-[#E11D48]",
            className
          )
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
