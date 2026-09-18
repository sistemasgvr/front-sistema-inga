"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { getTurnoAbierto } from "@/modules/caja/services/caja.service";
import type { TurnoItem } from "@/modules/caja/types/caja.types";
import {
  anularPago,
  getReportePeriodo,
  listPagos,
  registrarPago,
} from "../services/planilla.service";
import type {
  PagoFormValues,
  PagoItem,
  PagosResumen,
  ReportePeriodo,
} from "../types/planilla.types";

const PAGE_SIZE = 10;

/**
 * Pantalla de pagos de planilla.
 *
 * Maneja dos vistas del mismo período:
 *   - el reporte (quién cobró, quién falta, totales por medio)
 *   - el listado de pagos individuales
 *
 * Carga el turno de caja abierto del usuario porque un pago en efectivo debe
 * registrarse contra un turno: es la regla que conecta este módulo con el
 * cuadre diario (M08).
 */
export function usePagosPlanilla() {
  const hoy = new Date();

  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [quincena, setQuincena] = useState<number | null>(null);

  const [registros, setRegistros] = useState<PagoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [resumen, setResumen] = useState<PagosResumen>({
    monto_total: 0,
    efectivo: 0,
    yape: 0,
    tarjeta: 0,
    trabajadores_pagados: 0,
    cantidad_pagos: 0,
  });

  const [reporte, setReporte] = useState<ReportePeriodo | null>(null);

  /** Turno de caja abierto del usuario. `null` = no tiene ninguno. */
  const [turnoAbierto, setTurnoAbierto] = useState<TurnoItem | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [isPagoOpen, setIsPagoOpen] = useState(false);
  /** Trabajador preseleccionado al abrir el modal desde "Pagar" en pendientes. */
  const [trabajadorPreseleccionado, setTrabajadorPreseleccionado] = useState<
    number | null
  >(null);

  const [confirmPago, setConfirmPago] = useState<PagoItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAnulando, setIsAnulando] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [lista, rep] = await Promise.all([
        listPagos({
          pagina,
          limite: pageSize,
          anio,
          mes,
          quincena: quincena ?? undefined,
        }),
        getReportePeriodo(anio, mes, quincena ?? undefined),
      ]);

      setRegistros(lista.registros);
      setTotal(lista.total);
      if (lista.resumen) setResumen(lista.resumen);
      setReporte(rep);
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al cargar",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron obtener los pagos.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagina, pageSize, anio, mes, quincena]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    // Si falla no rompo la pantalla: el modal avisará que no hay turno abierto
    // y solo permitirá pagos por Yape o transferencia.
    getTurnoAbierto(user.id)
      .then(setTurnoAbierto)
      .catch(() => setTurnoAbierto(null));
  }, []);

  function cambiarPeriodo(nuevoAnio: number, nuevoMes: number) {
    setAnio(nuevoAnio);
    setMes(nuevoMes);
    setPagina(1);
  }

  function cambiarQuincena(nueva: number | null) {
    setQuincena(nueva);
    setPagina(1);
  }

  function abrirPago(idTrabajador?: number) {
    setTrabajadorPreseleccionado(idTrabajador ?? null);
    setIsPagoOpen(true);
  }

  function cerrarPago() {
    setIsPagoOpen(false);
    setTrabajadorPreseleccionado(null);
  }

  async function guardarPago(values: PagoFormValues) {
    setIsSaving(true);
    try {
      await registrarPago(values);
      cerrarPago();
      setFeedback({
        variant: "success",
        title: "Pago registrado",
        message: "El pago quedó guardado y se refleja en el cuadre del día.",
      });
      await load();
      // Refresco el turno: si el pago fue en efectivo, el efectivo esperado
      // del cajón acaba de cambiar.
      const user = getStoredUser();
      if (user) {
        getTurnoAbierto(user.id)
          .then(setTurnoAbierto)
          .catch(() => undefined);
      }
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo registrar el pago",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  function abrirConfirmAnular(pago: PagoItem) {
    setConfirmPago(pago);
    setIsConfirmOpen(true);
  }

  function cerrarConfirmAnular() {
    setIsConfirmOpen(false);
    setConfirmPago(null);
  }

  async function confirmarAnular() {
    if (!confirmPago) return;
    setIsAnulando(true);
    try {
      await anularPago(confirmPago.id);
      cerrarConfirmAnular();
      setFeedback({
        variant: "success",
        title: "Pago anulado",
        message: `Se anuló el pago de ${confirmPago.nombre_trabajador}. Ya puedes registrar el corregido.`,
      });
      await load();
    } catch (error) {
      // El rechazo típico: "el turno de caja ya está cerrado y arqueado".
      cerrarConfirmAnular();
      setFeedback({
        variant: "error",
        title: "No se pudo anular",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setIsAnulando(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    anio,
    mes,
    quincena,
    cambiarPeriodo,
    cambiarQuincena,
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
    resumen,
    reporte,
    turnoAbierto,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    isPagoOpen,
    trabajadorPreseleccionado,
    abrirPago,
    cerrarPago,
    guardarPago,
    confirmPago,
    isConfirmOpen,
    isAnulando,
    abrirConfirmAnular,
    cerrarConfirmAnular,
    confirmarAnular,
  };
}
