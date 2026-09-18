"use client";

import { useCallback, useEffect, useState } from "react";
import { getResumenTurno, listTurnos } from "../services/caja.service";
import type {
  ListTurnosParams,
  ResumenTurno,
  TurnoItem,
  TurnosResumen,
} from "../types/caja.types";

const PAGE_SIZE = 10;

/**
 * Historial de turnos para el administrador.
 *
 * Además del listado maneja el detalle: al elegir un turno cargo su resumen
 * completo (movimientos y arqueo) bajo demanda, en vez de traerlo para todos
 * los turnos de la página. Casi siempre solo se revisa uno.
 */
export function useTurnos() {
  const [registros, setRegistros] = useState<TurnoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [filtros, setFiltros] = useState<Omit<ListTurnosParams, "pagina" | "limite">>({});

  const [resumen, setResumen] = useState<TurnosResumen>({
    abiertos: 0,
    cerrados: 0,
    con_descuadre: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [detalle, setDetalle] = useState<ResumenTurno | null>(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);

  const loadTurnos = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listTurnos({
        pagina,
        limite: pageSize,
        ...filtros,
      });
      setRegistros(result.registros);
      setTotal(result.total);
      if (result.resumen) setResumen(result.resumen);
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al cargar",
        message:
          error instanceof Error ? error.message : "No se pudieron obtener los turnos.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagina, pageSize, filtros]);

  useEffect(() => {
    void loadTurnos();
  }, [loadTurnos]);

  function aplicarFiltro(nuevos: Partial<typeof filtros>) {
    setFiltros((p) => ({ ...p, ...nuevos }));
    setPagina(1);
  }

  async function verDetalle(turno: TurnoItem) {
    setIsDetalleOpen(true);
    setIsLoadingDetalle(true);
    setDetalle(null);
    try {
      setDetalle(await getResumenTurno(turno.id));
    } catch (error) {
      setIsDetalleOpen(false);
      setFeedback({
        variant: "error",
        title: "Error",
        message:
          error instanceof Error ? error.message : "No se pudo cargar el detalle.",
      });
    } finally {
      setIsLoadingDetalle(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    registros,
    total,
    pagina,
    setPagina,
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPagina(1);
    },
    totalPages,
    filtros,
    aplicarFiltro,
    resumen,
    isLoading,
    feedback,
    clearFeedback: () => setFeedback(null),
    detalle,
    isDetalleOpen,
    isLoadingDetalle,
    verDetalle,
    cerrarDetalle: () => {
      setIsDetalleOpen(false);
      setDetalle(null);
    },
  };
}
