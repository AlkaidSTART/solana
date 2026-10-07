import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    text: string;
    positive?: boolean;
    warning?: boolean;
  };
  indicator?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  trend,
  indicator,
  className,
}) => {
  return (
    <div
      className={twMerge(
        "p-5 bg-white border border-[#E4E4E7] flex flex-col justify-between hover:border-[#18181B] transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between text-[#71717A] text-[11px] font-mono uppercase tracking-wider mb-3">
        <span>{label}</span>
        {indicator}
      </div>

      <div className="mb-2">
        <div className="text-2xl sm:text-3xl font-mono font-medium tracking-tight text-[#09090B]">
          {value}
        </div>
        {subValue && (
          <div className="text-xs text-[#71717A] font-mono mt-0.5">
            {subValue}
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-[#EEEEEE] text-[11px] font-mono">
          <span
            className={clsx(
              trend.positive && "text-[#059669]",
              trend.warning && "text-[#D97706]",
              !trend.positive && !trend.warning && "text-[#71717A]"
            )}
          >
            {trend.text}
          </span>
        </div>
      )}
    </div>
  );
};
