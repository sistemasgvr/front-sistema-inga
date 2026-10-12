"use client";

import { useEffect, useRef } from "react";
import { useToast, type ToastVariant } from "./ToastContext";

interface ToastNotificationProps {
  variant: ToastVariant;
  title: string;
  message: string;
}

/** Adaptador para errores recibidos por props. No agrega elementos al formulario. */
export function ToastNotification({ variant, title, message }: ToastNotificationProps) {
  const { toast } = useToast();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const key = JSON.stringify([variant, title, message]);
    if (message && previous.current !== key) {
      toast(variant, title, message);
    }
    previous.current = key;
  }, [variant, title, message, toast]);

  return null;
}
