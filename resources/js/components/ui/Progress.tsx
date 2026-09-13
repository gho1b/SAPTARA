import * as React from "react";
import { cn } from "../../lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorColor?: string;
  showPercentage?: boolean;
}

export function Progress({
  value = 0,
  className,
  indicatorColor = "bg-sky-500",
  showPercentage = false,
  ...props
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      <div
        className={cn("relative h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner", className)}
        {...props}
      >
        <div
          className={cn("h-full transition-all duration-500 rounded-full", indicatorColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showPercentage && (
        <span className="mt-1 block text-right text-xs font-semibold text-slate-500">{clamped}%</span>
      )}
    </div>
  );
}
