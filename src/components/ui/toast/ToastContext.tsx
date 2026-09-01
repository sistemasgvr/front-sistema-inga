"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
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

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((variant: ToastVariant, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, variant, title, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

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

      <div className="fixed top-5 right-5 z-[999999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const style = variantStyles[t.variant];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${style.border} ${style.bg} ${style.text}`}
            >
              <span className={`mt-0.5 shrink-0 ${style.iconColor}`}>
                <Icon name={style.icon} size={22} />
              </span>
              <div className="flex-1">
                <h5 className="text-sm font-bold leading-tight">{t.title}</h5>
                <p className="text-xs mt-1 opacity-90 leading-relaxed">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <Icon name="mdi:close" size={18} />
              </button>
            </div>
          );
        })}
      </div>
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