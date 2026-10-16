"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { getDashboard, rangoMesActual, type DashboardDatos, type Granularidad } from "@/modules/reportes";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import type { RangoFechas } from "@/shared/utils/fecha";

type Respuesta = { clave: string; datos: DashboardDatos | null; error: string | null };

/**
 * Indicadores del dashboard. Cada cambio de rango (y "Actualizar") vuelve a
 * pedir al backend; la granularidad solo reagrupa lo ya recibido.
 * Sin el permiso `dashboard.ver` no se hace ninguna petición.
 */
export function useDashboard() {
  const permitido = useMemo(() => {
    const user = getStoredUser();
    return Boolean(user?.es_super_admin || user?.permisos?.includes(PermisoBanderas.DASHBOARD_VER));
  }, []);
  const [rango, setRango] = useState<RangoFechas>(rangoMesActual);
  const [granularidad, setGranularidad] = useState<Granularidad>("dia");
  const [revision, setRevision] = useState(0);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);

  const completo = Boolean(rango.desde && rango.hasta);
  const clave = `${rango.desde}|${rango.hasta}#${revision}`;

  useEffect(() => {
    if (!permitido || !completo) return;
    const controller = new AbortController();
    getDashboard({ fecha_desde: rango.desde, fecha_hasta: rango.hasta }, controller.signal)
      .then((datos) => {
        if (!controller.signal.aborted) setRespuesta({ clave, datos, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setRespuesta({
            clave,
            datos: null,
            error: error instanceof Error ? error.message : "No se pudieron obtener los indicadores.",
          });
      });
    return () => controller.abort();
  }, [permitido, completo, rango.desde, rango.hasta, clave]);

  const actual = respuesta?.clave === clave ? respuesta : null;
  const recargar = useCallback(() => setRevision((r) => r + 1), []);

  return {
    permitido,
    rango,
    cambiarRango: setRango,
    granularidad,
    cambiarGranularidad: setGranularidad,
    completo,
    datos: actual?.datos ?? null,
    cargando: permitido && completo && !actual,
    error: actual?.error ?? null,
    recargar,
  };
}
