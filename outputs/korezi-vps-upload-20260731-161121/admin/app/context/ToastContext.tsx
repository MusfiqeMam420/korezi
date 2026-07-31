"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  leaving?: boolean;
};

type ToastContextType = {
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

const toastMeta = {
  success: {
    title: "Success",
    icon: "M8.6 12.9 5.7 10l-1.4 1.4 4.3 4.3 9-9L16.2 5.3z",
    className: "universal-toast-success",
  },
  error: {
    title: "Action needed",
    icon: "M11 6h2v8h-2V6Zm0 10h2v2h-2v-2Z",
    className: "universal-toast-error",
  },
  info: {
    title: "Notice",
    icon: "M11 10h2v8h-2v-8Zm0-4h2v2h-2V6Z",
    className: "universal-toast-info",
  },
};

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
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      window.setTimeout(() => removeHard(id), 260);
    },
    [removeHard]
  );

  const show = useCallback(
    (message: string, type: ToastType = "info", duration = 2800) => {
      const id = uid();
      setToasts((prev) => [...prev.slice(-3), { id, type, message, duration, leaving: false }]);
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
      <div className="universal-toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            index={index}
            onClose={() => removeSoft(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  index,
  onClose,
}: {
  toast: Toast;
  index: number;
  onClose: () => void;
}) {
  const meta = toastMeta[toast.type];

  return (
    <div
      className={[
        "universal-toast",
        meta.className,
        toast.leaving ? "universal-toast-leave" : "universal-toast-enter",
      ].join(" ")}
      style={{ ["--toast-duration" as string]: `${toast.duration}ms`, ["--toast-index" as string]: index }}
      role={toast.type === "error" ? "alert" : "status"}
    >
      <div className="universal-toast-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d={meta.icon} />
        </svg>
      </div>
      <div className="universal-toast-copy">
        <p>{meta.title}</p>
        <span>{toast.message}</span>
      </div>
      <button type="button" onClick={onClose} className="universal-toast-close" aria-label="Close notification">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.7 6.7 17.3 17.3M17.3 6.7 6.7 17.3" />
        </svg>
      </button>
      <span className="universal-toast-progress" />
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
