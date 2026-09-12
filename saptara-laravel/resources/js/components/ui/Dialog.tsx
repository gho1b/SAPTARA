import * as React from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

export interface DialogProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, isOpen, onClose, title, description, children, className }: DialogProps) {
  const isVisible = open ?? isOpen ?? false;
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className={cn(
          "relative z-50 w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all animate-in zoom-in-95",
          className
        )}
      >
        <div className="flex items-start justify-between pb-3">
          <div>
            {title && <h3 className="font-bold text-lg text-slate-800 font-display">{title}</h3>}
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
