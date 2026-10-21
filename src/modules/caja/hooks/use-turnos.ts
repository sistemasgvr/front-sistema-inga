"use client";

import { useFeedback } from "@/shared/hooks/use-feedback";

import { useCallback, useEffect, useState } from "react";
import { useEstadoPersistente } from "@/shared/hooks/use-estado-persistente";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import {
  cerrarTurno,
  getResumenTurno,
  guardarArqueo,
  listTurnos,
} from "../services/caja.service";
import type {
  ArqueoLinea,
  ListTurnosParams,
  ResumenTurno,
  TurnoItem,
  TurnosResumen,
} from "../types/caja.types";
import { puedeCerrarTurno } from "../utils/permisos-cierre";

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
  const [pagina, setPagina] = useEstadoPersistente("turnos.pagina", 1);
  const [pageSize, setPageSize] = useEstadoPersistente("turnos.pageSize", PAGE_SIZE);

  const [filtros, setFiltros] = useEstadoPersistente<Omit<ListTurnosParams, "pagina" | "limite">>("turnos.filtros", {});

  const [resumen, setResumen] = useState<TurnosResumen>({
    abiertos: 0,
    cerrados: 0,
    con_descuadre: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useFeedback<{
    variant: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [detalle, setDetalle] = useState<ResumenTurno | null>(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);

  // Cierre desde el detalle: así el administrador puede cerrar la caja de otro
  // cajero. Solo se ofrece a quien la abrió o a un administrador.
  const [isCierreOpen, setIsCierreOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // El detalle solo existe en el cliente, así que leer el usuario aquí no
  // afecta al render del servidor.
  const usuario = detalle ? getStoredUser() : null;
  const puedeCerrar = puedeCerrarTurno(detalle?.turno, usuario);

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
  }, [pagina, pageSize, filtros, setFeedback]);

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

  function abrirCierre() {
    if (!puedeCerrar) return;
    setIsDetalleOpen(false);
    setIsCierreOpen(true);
  }

  // Cancelar el arqueo vuelve al detalle del mismo turno.
  function cancelarCierre() {
    setIsCierreOpen(false);
    setIsDetalleOpen(true);
  }

  async function handleCerrarTurno(detalleArqueo: ArqueoLinea[], montoContado: number, observacion?: string) {
    const turno = detalle?.turno;
    if (!turno || !puedeCerrar) return;
    setIsSaving(true);
    try {
      // Mismo orden que en "Mi turno": el arqueo queda aunque el cierre falle.
      await guardarArqueo(turno.id, detalleArqueo);
      await cerrarTurno(turno.id, montoContado, observacion);
      setIsCierreOpen(false);
      setDetalle(null);
      setFeedback({
        variant: "success",
        title: "Turno cerrado",
        message: `Se cerró ${turno.nombre_caja} de ${turno.nombre_cajero}.`,
      });
      await loadTurnos();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo cerrar el turno",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
      throw error;
    } finally {
      setIsSaving(false);
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
    puedeCerrar,
    isCierreOpen,
    isSaving,
    abrirCierre,
    cancelarCierre,
    handleCerrarTurno,
  };
}
