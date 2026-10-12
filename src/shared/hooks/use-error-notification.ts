"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/toast/ToastContext";

/** Notifica cada intento fallido, incluso cuando el mensaje coincide con el anterior. */
export function useErrorNotification(title = "No se pudo guardar") {
  const { toast } = useToast();
  return useCallback((message: string) => toast("error", title, message), [toast, title]);
}
