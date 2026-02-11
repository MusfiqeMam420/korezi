"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  leaving?: boolean; // ✅ for exit animation
};

type ToastContextType = {
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const removeHard = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const removeSoft = useCallback(
    (id: string) => {
      // trigger exit animation first
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));

      // remove after animation finishes
      window.setTimeout(() => removeHard(id), 220);
    },
    [removeHard]
  );

  const show = useCallback(
    (message: string, type: ToastType = "info", duration = 2500) => {
      const id = uid();
      const toast: Toast = { id, type, message, duration, leaving: false };

      setToasts((prev) => [...prev, toast]);

      // auto close with soft exit
      timers.current[id] = window.setTimeout(() => removeSoft(id), duration);
    },
    [removeSoft]
  );

  const api = useMemo<ToastContextType>(
    () => ({
      show,
      success: (m, d) => show(m, "success", d),
      error: (m, d) => show(m, "error", d),
      info: (m, d) => show(m, "info", d),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* ✅ Position: top-right (change to bottom-center if you want) */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[340px] max-w-[92vw]">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeSoft(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const styles =
    toast.type === "success"
      ? "border-green-200 text-green-800"
      : toast.type === "error"
      ? "border-red-200 text-red-800"
      : "border-gray-200 text-gray-800";

  const dot =
    toast.type === "success"
      ? "bg-green-500"
      : toast.type === "error"
      ? "bg-red-500"
      : "bg-gray-400";

  return (
    <div
      className={`rounded-2xl border shadow-lg px-4 py-3 flex items-start gap-3 toast-glass ${
        toast.leaving ? "toast-exit" : "toast-enter"
      } ${styles}`}
    >
      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />
      <div className="text-sm leading-relaxed flex-1">{toast.message}</div>

      <button
        onClick={onClose}
        className="text-xs px-2 py-1 rounded-lg border bg-white/60 hover:bg-white transition"
        type="button"
      >
        ✕
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
