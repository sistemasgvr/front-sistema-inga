"use client";
import { useCallback, useEffect } from "react";
import { useLazyOptions } from "@/shared/hooks/use-lazy-options";
import { listTiposProducto } from "../services/tipos-producto.service";

export function useTiposProducto(open = true) {
  const catalogo = useLazyOptions(
    useCallback((signal: AbortSignal) => listTiposProducto(signal), []),
  );
  const { load } = catalogo;
  useEffect(() => {
    if (open) void load();
  }, [open, load]);
  return catalogo;
}
