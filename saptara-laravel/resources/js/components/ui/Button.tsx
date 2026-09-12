import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "gold" | "emerald";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl cursor-pointer active:scale-95";
    
    const variants = {
      primary: "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20 focus:ring-sky-400",
      secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400",
      outline: "border border-slate-200 hover:bg-slate-100 text-slate-700 focus:ring-slate-300",
      ghost: "hover:bg-slate-100 text-slate-600 focus:ring-slate-300",
      destructive: "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 focus:ring-rose-400",
      gold: "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-semibold shadow-md shadow-amber-500/25 focus:ring-amber-400",
      emerald: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 focus:ring-emerald-400",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 py-2 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5 font-semibold",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
