"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  consultarComprobanteSunat,
  darDeBajaSunat,
  descargarArchivoSunat,
  enviarComprobanteSunat,
  type ArchivoComprobante,
} from "../services/sunat.service";
import type { ComprobanteSunat } from "../types/sunat.types";
import { ESTADO_SUNAT } from "../utils/sunat";

const mensaje = (error: unknown, defecto: string) => (error instanceof Error && error.message) || defecto;

const NOMBRE_ARCHIVO: Record<ArchivoComprobante, string> = { xml: "XML", cdr: "CDR", "pdf-a4": "PDF A4" };

/**
 * Acciones SUNAT sobre un comprobante, compartidas por Ventas y la pantalla SUNAT.
 * `procesando` identifica el botón ocupado («enviar-12», «xml-12»...) y `onCambio`
 * se llama cuando cambió el estado para refrescar la pantalla que lo muestra.
 */
export function useAccionesSunat(onCambio?: () => void) {
  const { toast } = useToast();
  const [procesando, setProcesando] = useState<string | null>(null);

  const avisarEstado = useCallback((c: ComprobanteSunat, titulo: string) => {
    const info = ESTADO_SUNAT[c.estadoSunat];
    const variante = c.estadoSunat === 2 ? "success" : c.estadoSunat === 3 ? "error" : "info";
    toast(variante, `${titulo}: ${info.label}`, c.mensaje ?? info.ayuda);
  }, [toast]);

  const enviar = useCallback(async (id: number) => {
    setProcesando(`enviar-${id}`);
    try {
      avisarEstado(await enviarComprobanteSunat(id), "Enviado a SUNAT");
      onCambio?.();
      return true;
    } catch (e) {
      toast("error", "No se pudo enviar a SUNAT", mensaje(e, "Quedó pendiente; inténtalo de nuevo."));
      onCambio?.();
      return false;
    } finally { setProcesando(null); }
  }, [avisarEstado, onCambio, toast]);

  const consultar = useCallback(async (id: number) => {
    setProcesando(`consultar-${id}`);
    try {
      avisarEstado(await consultarComprobanteSunat(id), "Consulta SUNAT");
      onCambio?.();
    } catch (e) {
      toast("error", "No se pudo consultar", mensaje(e, "Inténtalo de nuevo."));
    } finally { setProcesando(null); }
  }, [avisarEstado, onCambio, toast]);

  const darDeBaja = useCallback(async (id: number, motivo: string) => {
    setProcesando(`baja-${id}`);
    try {
      await darDeBajaSunat(id, motivo);
      toast("success", "Baja enviada a SUNAT", "SUNAT la procesa en unos minutos; el estado se actualizará solo.");
      onCambio?.();
      return true;
    } catch (e) {
      toast("error", "No se pudo dar de baja", mensaje(e, "Inténtalo de nuevo."));
      return false;
    } finally { setProcesando(null); }
  }, [onCambio, toast]);

  const descargar = useCallback(async (id: number, archivo: ArchivoComprobante, numero: string) => {
    setProcesando(`${archivo}-${id}`);
    try {
      await descargarArchivoSunat(id, archivo, numero);
    } catch (e) {
      toast("error", `No se pudo descargar el ${NOMBRE_ARCHIVO[archivo]}`, mensaje(e, "Inténtalo de nuevo."));
    } finally { setProcesando(null); }
  }, [toast]);

  return { procesando, enviar, consultar, darDeBaja, descargar };
}
