"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  message: string;
}

interface ToastContextType {
  toast: (variant: ToastVariant, title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const recent = useRef(new Map<string, number>());

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach(clearTimeout);
      activeTimers.clear();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((variant: ToastVariant, title: string, message: string) => {
    // Un error puede llegar al hook de la pantalla y al formulario que lo captura.
    // Agrupar solo emisiones simultáneas; un nuevo intento debe volver a avisar.
    const now = Date.now();
    const key = JSON.stringify([variant, message]);
    for (const [entry, time] of recent.current) {
      if (now - time >= 1000) recent.current.delete(entry);
    }
    if (recent.current.has(key)) return;
    recent.current.set(key, now);
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, variant, title, message }]);
  }, []);

  useEffect(() => {
    // Los avisos en espera empiezan a expirar solo cuando llegan a mostrarse.
    for (const item of toasts.slice(0, 3)) {
      if (!timers.current.has(item.id)) {
        timers.current.set(item.id, setTimeout(() => {
          removeToast(item.id);
        }, item.variant === "error" ? 8000 : 5000));
      }
    }
  }, [toasts, removeToast]);

  const variantStyles = {
    success: {
      border: "border-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/80",
      text: "text-emerald-800 dark:text-emerald-200",
      icon: "mdi:check-circle-outline",
      iconColor: "text-emerald-500",
    },
    error: {
      border: "border-rose-500",
      bg: "bg-rose-50 dark:bg-rose-950/80",
      text: "text-rose-800 dark:text-rose-200",
      icon: "mdi:alert-circle-outline",
      iconColor: "text-rose-500",
    },
    warning: {
      border: "border-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/80",
      text: "text-amber-800 dark:text-amber-200",
      icon: "mdi:alert-outline",
      iconColor: "text-amber-500",
    },
    info: {
      border: "border-sky-500",
      bg: "bg-sky-50 dark:bg-sky-950/80",
      text: "text-sky-800 dark:text-sky-200",
      icon: "mdi:information-outline",
      iconColor: "text-sky-500",
    },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {toasts.length > 0 && createPortal(<div
        aria-label="Notificaciones del sistema"
        className="pointer-events-none fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[1000000] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm flex-col gap-3 overflow-y-auto sm:right-6 sm:bottom-6"
      >
        {toasts.slice(0, 3).map((t) => {
          const style = variantStyles[t.variant];
          return (
            <div
              key={t.id}
              role={t.variant === "error" ? "alert" : "status"}
              aria-atomic="true"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${style.border} ${style.bg} ${style.text}`}
            >
              <span className={`mt-0.5 shrink-0 ${style.iconColor}`}>
                <Icon name={style.icon} size={22} />
              </span>
              <div className="min-w-0 flex-1 break-words">
                <h5 className="text-sm font-bold leading-tight">{t.title}</h5>
                <p className="text-xs mt-1 opacity-90 leading-relaxed">{t.message}</p>
              </div>
              <button
                type="button"
                aria-label={`Cerrar notificación: ${t.title}`}
                onClick={() => removeToast(t.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:text-white"
              >
                <Icon name="mdi:close" size={18} />
              </button>
            </div>
          );
        })}
      </div>, document.body)}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe ser usado dentro de un ToastProvider");
  }
  return context;
};
