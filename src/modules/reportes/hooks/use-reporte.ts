"use client";

import { useCallback, useEffect, useState } from "react";
import type { RangoFechas } from "@/shared/utils/fecha";
import { getReporte } from "../services/reportes.service";
import type { DatosReporte, TipoReporte } from "../types/reportes.types";
import { reporteDe } from "../utils/catalogo";
import { rangoHoy, rangoMesActual } from "../utils/periodo";

type Respuesta<T> = { clave: string; datos: T | null; error: string | null };

const mensaje = (error: unknown) =>
  error instanceof Error ? error.message : "No se pudo obtener el reporte.";

/**
 * Datos de un reporte para el rango elegido.
 *
 * Cada rango completo (y cada "Actualizar") es una petición nueva al backend,
 * aunque se vuelva a un rango ya visto; la respuesta anterior se cancela y
 * solo se muestra la que corresponde a la consulta vigente.
 */
export function useReporte<T extends TipoReporte>(tipo: T) {
  const catalogo = reporteDe(tipo);
  const [rango, setRango] = useState<RangoFechas>(() =>
    catalogo.rangoInicial === "hoy" ? rangoHoy() : rangoMesActual(),
  );
  const [revision, setRevision] = useState(0);
  const [respuesta, setRespuesta] = useState<Respuesta<DatosReporte[T]> | null>(null);

  const completo = Boolean(rango.desde && rango.hasta);
  const clave = `${tipo}|${rango.desde}|${rango.hasta}#${revision}`;

  useEffect(() => {
    if (!completo) return;
    const controller = new AbortController();
    getReporte(tipo, { fecha_desde: rango.desde, fecha_hasta: rango.hasta }, controller.signal)
      .then((datos) => {
        if (!controller.signal.aborted) setRespuesta({ clave, datos, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setRespuesta({ clave, datos: null, error: mensaje(error) });
      });
    return () => controller.abort();
  }, [tipo, rango.desde, rango.hasta, completo, clave]);

  const actual = respuesta?.clave === clave ? respuesta : null;

  const recargar = useCallback(() => setRevision((r) => r + 1), []);

  return {
    catalogo,
    rango,
    cambiarRango: setRango,
    completo,
    datos: actual?.datos ?? null,
    cargando: completo && !actual,
    error: actual?.error ?? null,
    recargar,
  };
}
