"use client";

import { useCallback, useRef, useState } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { useToast } from "@/components/ui/toast/ToastContext";
import { cerrarTurno, getTurnoVigente, guardarArqueo } from "../services/caja.service";
import { esDeDiaAnterior } from "../utils/formato";
import { esCajeroDelTurno, puedeCerrarTurno } from "../utils/permisos-cierre";
import { guardarTurnoContinuado, leerTurnoContinuado } from "../utils/turno-continuado";
import type { ArqueoLinea, TurnoItem } from "../types/caja.types";

/**
 * Antes de una operación que mueve dinero (cobrar un pedido), revisa si hay
 * una caja abierta de un día anterior y pregunta qué hacer. La alerta se
 * muestra a todos los usuarios, no solo al que abrió la caja; cerrarla desde
 * aquí solo lo puede el cajero del turno o un administrador (`puedeCerrar`).
 *
 * `confirmar()` consulta la caja vigente al backend en cada llamada y resuelve:
 *   - true  → no hay caja pendiente, o el usuario eligió seguir con ella.
 *   - false → el usuario cerró esa caja (o no se decidió); la operación no sigue.
 */
export function useTurnoPendiente() {
  const { toast } = useToast();
  const [turno, setTurno] = useState<TurnoItem | null>(null);
  const [puedeCerrar, setPuedeCerrar] = useState(false);
  const [esPropio, setEsPropio] = useState(false);
  const [isCierreOpen, setIsCierreOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const resolver = useRef<((continuar: boolean) => void) | null>(null);

  const terminar = useCallback((continuar: boolean) => {
    resolver.current?.(continuar);
    resolver.current = null;
    setTurno(null);
    setIsCierreOpen(false);
  }, []);

  const confirmar = useCallback(async (): Promise<boolean> => {
    const user = getStoredUser();
    if (!user) return true;

    let actual: TurnoItem | null;
    try {
      // La vigente prefiere el turno del usuario; si no tiene, la caja abierta
      // más reciente, para que la alerta llegue también a quien no la abrió.
      actual = await getTurnoVigente();
    } catch {
      // Si no se puede consultar, el backend sigue validando el cobro.
      return true;
    }

    if (!actual || !esDeDiaAnterior(actual.fecha_apertura) || leerTurnoContinuado() === actual.id) {
      return true;
    }

    // Una consulta anterior sin responder se da por cancelada.
    resolver.current?.(false);
    setPuedeCerrar(puedeCerrarTurno(actual, user));
    setEsPropio(esCajeroDelTurno(actual, user));
    setTurno(actual);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function continuar() {
    if (turno) guardarTurnoContinuado(turno.id);
    terminar(true);
  }

  async function cerrar(detalle: ArqueoLinea[], montoContado: number, observacion?: string) {
    if (!turno || !puedeCerrar) return;
    setIsSaving(true);
    try {
      // Mismo orden que en "Mi turno": el arqueo queda aunque el cierre falle.
      await guardarArqueo(turno.id, detalle);
      await cerrarTurno(turno.id, montoContado, observacion);
      toast("success", "Caja cerrada", "Abre un turno nuevo en Caja para seguir cobrando.");
      terminar(false);
    } catch (error) {
      toast("error", "No se pudo cerrar la caja", error instanceof Error ? error.message : "Error inesperado.");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    turno,
    puedeCerrar,
    esPropio,
    isCierreOpen,
    isSaving,
    confirmar,
    continuar,
    cerrar,
    abrirCierre: () => {
      if (puedeCerrar) setIsCierreOpen(true);
    },
    // Cancelar el arqueo vuelve a la alerta: solo se sale con uno de sus botones.
    cancelarCierre: () => setIsCierreOpen(false),
  };
}
