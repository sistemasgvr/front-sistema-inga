"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTrabajadorDisponible, listTrabajadoresDisponibles } from "../services/users.service";
import type { TrabajadorUsuarioOption } from "../types/user.types";

export function useTrabajadorUsuario(enabled: boolean) {
  const [options, setOptions] = useState<TrabajadorUsuarioOption[]>([]);
  const [selected, setSelected] = useState<TrabajadorUsuarioOption | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const optionsRequest = useRef(0);
  const detailRequest = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++optionsRequest.current;
    setLoadingOptions(true);
    setError(null);
    try {
      const result = await listTrabajadoresDisponibles();
      if (request === optionsRequest.current) setOptions(result);
    } catch (error) {
      if (request === optionsRequest.current) {
        setOptions([]);
        setError(error instanceof Error ? error.message : "No se pudieron cargar los trabajadores.");
      }
    } finally {
      if (request === optionsRequest.current) setLoadingOptions(false);
    }
  }, []);

  const select = useCallback(async (id: number | null) => {
    const request = ++detailRequest.current;
    setSelected(null);
    setError(null);
    setLoadingDetail(Boolean(id));
    if (!id) return;
    try {
      const result = await getTrabajadorDisponible(id);
      if (request === detailRequest.current) setSelected(result);
    } catch (error) {
      if (request === detailRequest.current) setError(error instanceof Error ? error.message : "No se pudo consultar al trabajador.");
    } finally {
      if (request === detailRequest.current) setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    setSelected(null);
    setOptions([]);
    setError(null);
    if (enabled) void refresh();
    return () => { optionsRequest.current++; detailRequest.current++; };
  }, [enabled, refresh]);

  return { options, selected, loadingOptions, loadingDetail, error, refresh, select };
}
