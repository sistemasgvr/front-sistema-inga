"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast/ToastContext";
import { enviarDiaSunat, obtenerResumenDia } from "../services/sunat.service";
import type { ResultadoEnvioDia, ResumenDia } from "../types/sunat.types";

const mensaje = (error: unknown, defecto: string) => (error instanceof Error && error.message) || defecto;

/** Comprobantes de un día y su envío masivo. Cada cambio de fecha consulta al backend. */
export function useResumenDia(fecha: string) {
  const { toast } = useToast();
  const [revision, setRevision] = useState(0);
  const [respuesta, setRespuesta] = useState<{ clave: string; datos: ResumenDia | null; error: string | null } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEnvioDia | null>(null);
  const clave = `${fecha}#${revision}`;

  useEffect(() => {
    const controller = new AbortController();
    obtenerResumenDia(fecha, controller.signal)
      .then((datos) => { if (!controller.signal.aborted) setRespuesta({ clave, datos, error: null }); })
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setRespuesta({ clave, datos: null, error: mensaje(e, "No se pudo cargar el resumen del día.") });
      });
    return () => controller.abort();
  }, [fecha, clave]);

  const recargar = useCallback(() => setRevision((r) => r + 1), []);

  // Al cambiar de día se oculta el resultado del envío anterior.
  useEffect(() => { queueMicrotask(() => setResultado(null)); }, [fecha]);

  async function enviarDia() {
    setEnviando(true);
    try {
      const r = await enviarDiaSunat(fecha);
      setResultado(r);
      const errores = r.facturas.errores.length + r.boletas.resumenes.filter((x) => x.error).length;
      toast(errores ? "warning" : "success", "Envío del día terminado",
        errores ? "Algunos comprobantes no se enviaron: revisa el detalle." : "Facturas enviadas y boletas en resumen diario.");
    } catch (e) {
      toast("error", "No se pudo enviar el día", mensaje(e, "Inténtalo de nuevo."));
    } finally {
      setEnviando(false);
      recargar();
    }
  }

  const actual = respuesta?.clave === clave ? respuesta : null;
  return {
    resumen: actual?.datos ?? null,
    error: actual?.error ?? null,
    cargando: !actual,
    recargar,
    enviando,
    resultado,
    enviarDia,
  };
}
