"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import {
  abrirTurno,
  cerrarTurno,
  getResumenTurno,
  getTurnoAbierto,
  guardarArqueo,
  listCajas,
  registrarMovimiento,
} from "../services/caja.service";
import type {
  ArqueoLinea,
  CajaItem,
  MovimientoFormValues,
  ResumenTurno,
  TurnoItem,
} from "../types/caja.types";

/**
 * Maneja la pantalla "Mi turno", que es la que usa el cajero todo el día.
 *
 * Tiene dos caras según el estado:
 *   - sin turno abierto → formulario de apertura
 *   - con turno abierto → panel con los totales, los movimientos y el cierre
 *
 * El cajero soy yo mismo: saco el id del usuario logueado en vez de pedirlo en
 * un selector. Nadie abre un turno a nombre de otro desde esta pantalla, y así
 * se evita el error de elegir mal a la persona.
 */
export function useMiTurno() {
  const [idCajero, setIdCajero] = useState<number | null>(null);
  const [nombreCajero, setNombreCajero] = useState("");

  const [turno, setTurno] = useState<TurnoItem | null>(null);
  const [resumen, setResumen] = useState<ResumenTurno | null>(null);
  const [cajasDisponibles, setCajasDisponibles] = useState<CajaItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);
  const [isCierreOpen, setIsCierreOpen] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setIdCajero(user.id);
      setNombreCajero(`${user.nombres} ${user.apellidos}`.trim());
    } else {
      setIsLoading(false);
    }
  }, []);

  /**
   * Carga el estado completo: turno abierto y, si lo hay, su resumen.
   * Si no hay turno, traigo las cajas para poder ofrecer la apertura.
   */
  const cargarEstado = useCallback(async () => {
    if (!idCajero) return;
    setIsLoading(true);
    try {
      const turnoActual = await getTurnoAbierto(idCajero);
      setTurno(turnoActual);

      if (turnoActual) {
        setResumen(await getResumenTurno(turnoActual.id));
      } else {
        setResumen(null);
        const cajas = await listCajas({ pagina: 1, limite: 100, estado: "activos" });
        // Solo ofrezco las cajas libres: mostrar una ocupada solo lleva a que
        // el usuario la elija y reciba un error.
        setCajasDisponibles(cajas.registros.filter((c) => !c.tiene_turno_abierto));
      }
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al cargar",
        message:
          error instanceof Error ? error.message : "No se pudo cargar el turno.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [idCajero]);

  useEffect(() => {
    void cargarEstado();
  }, [cargarEstado]);

  async function handleAbrirTurno(idCaja: number, montoApertura: number, observacion?: string) {
    if (!idCajero) return;
    setIsSaving(true);
    try {
      await abrirTurno({
        id_caja: idCaja,
        id_cajero: idCajero,
        monto_apertura: montoApertura,
        observacion,
      });
      setFeedback({
        variant: "success",
        title: "Turno abierto",
        message: "Ya puedes empezar a cobrar.",
      });
      await cargarEstado();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo abrir el turno",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRegistrarMovimiento(values: MovimientoFormValues) {
    if (!turno) return;
    setIsSaving(true);
    try {
      await registrarMovimiento(turno.id, values);
      setIsMovimientoOpen(false);
      setFeedback({
        variant: "success",
        title: "Movimiento registrado",
        message: `${values.motivo} — S/ ${values.monto.toFixed(2)}`,
      });
      await cargarEstado();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo registrar",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Guarda el arqueo y cierra el turno en un solo paso.
   *
   * Los hago juntos porque para el cajero es una sola acción: contar la plata y
   * cerrar. Guardo el arqueo primero para que quede el detalle del conteo aunque
   * el cierre falle por algo.
   */
  async function handleCerrarTurno(detalle: ArqueoLinea[], montoContado: number, observacion?: string) {
    if (!turno) return;
    setIsSaving(true);
    try {
      await guardarArqueo(turno.id, detalle);
      await cerrarTurno(turno.id, montoContado, observacion);
      setIsCierreOpen(false);
      setFeedback({
        variant: "success",
        title: "Turno cerrado",
        message: "El arqueo quedó registrado. Revisa el historial para ver el detalle.",
      });
      await cargarEstado();
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

  return {
    idCajero,
    nombreCajero,
    turno,
    resumen,
    cajasDisponibles,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    isMovimientoOpen,
    openMovimiento: () => setIsMovimientoOpen(true),
    closeMovimiento: () => setIsMovimientoOpen(false),
    isCierreOpen,
    openCierre: () => setIsCierreOpen(true),
    closeCierre: () => setIsCierreOpen(false),
    handleAbrirTurno,
    handleRegistrarMovimiento,
    handleCerrarTurno,
    recargar: cargarEstado,
  };
}
