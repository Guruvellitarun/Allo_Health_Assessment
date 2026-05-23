"use client";

import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export const Toaster = () => {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "w-80 rounded-lg border border-[var(--line)] bg-white p-4 shadow-lg",
            toast.variant === "success" && "border-[#1a7f5a]",
            toast.variant === "error" && "border-[#b42318]"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <p className="text-xs text-[var(--muted)]">{toast.description}</p>
              ) : null}
            </div>
            <button
              className="text-xs text-[var(--muted)]"
              onClick={() => dismissToast(toast.id)}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
