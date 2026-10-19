"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { hoyIso, type RangoFechas } from "@/shared/utils/fecha";
import { getEstadoCuentaDetalle } from "../services/cxc.service";
import type { EstadoCuentaDetalleCxc } from "../types/cxc.types";
import { rangosRapidos } from "../utils/estado-cuenta";

type Respuesta = { clave: string; datos: EstadoCuentaDetalleCxc | null; error: string | null };

/**
 * Estado de cuenta detallado de un cliente para el rango elegido.
 *
 * Cada rango (y cada "Actualizar") es una petición nueva al backend, aunque se
 * vuelva a uno ya visto; la respuesta anterior se cancela. Un rango a medio
 * elegir (solo la fecha inicial) no consulta; sin fechas trae todo el historial.
 */
export function useEstadoCuentaDetalle(idPersona: number) {
  const hoy = useMemo(() => hoyIso(), []);
  const atajos = useMemo(() => rangosRapidos(hoy), [hoy]);
  const [rango, setRango] = useState<RangoFechas>(() => ({ desde: atajos[0].desde, hasta: atajos[0].hasta }));
  const [revision, setRevision] = useState(0);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);

  const completo = Boolean(rango.desde) === Boolean(rango.hasta);
  const valido = Number.isInteger(idPersona) && idPersona > 0;
  const clave = `${idPersona}|${rango.desde}|${rango.hasta}#${revision}`;

  useEffect(() => {
    if (!valido || !completo) return;
    const controller = new AbortController();
    getEstadoCuentaDetalle(idPersona, { desde: rango.desde, hasta: rango.hasta }, controller.signal)
      .then((datos) => {
        if (!controller.signal.aborted) setRespuesta({ clave, datos, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setRespuesta({
            clave,
            datos: null,
            error: error instanceof Error ? error.message : "No se pudo obtener el estado de cuenta.",
          });
      });
    return () => controller.abort();
  }, [idPersona, valido, completo, rango.desde, rango.hasta, clave]);

  const actual = respuesta?.clave === clave ? respuesta : null;
  const recargar = useCallback(() => setRevision((r) => r + 1), []);
  const atajoActivo = atajos.find((a) => a.desde === rango.desde && a.hasta === rango.hasta)?.clave ?? null;

  return {
    hoy,
    atajos,
    atajoActivo,
    rango,
    cambiarRango: setRango,
    completo,
    valido,
    datos: actual?.datos ?? null,
    cargando: valido && completo && !actual,
    error: valido ? (actual?.error ?? null) : "Cliente no válido.",
    recargar,
  };
}
