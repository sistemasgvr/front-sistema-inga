import { apiGet } from "@/shared/api/api-client";
import type {
  DashboardDatos,
  DatosReporte,
  FiltroReporte,
  TipoReporte,
} from "../types/reportes.types";

const parametros = (filtro: FiltroReporte) => ({
  fecha_desde: filtro.fecha_desde,
  fecha_hasta: filtro.fecha_hasta,
  id_sucursal: filtro.id_sucursal || undefined,
});

export function getReporte<T extends TipoReporte>(
  tipo: T,
  filtro: FiltroReporte,
  signal?: AbortSignal,
): Promise<DatosReporte[T]> {
  return apiGet<DatosReporte[T]>(`/reportes/${tipo}`, {
    params: parametros(filtro),
    signal,
  });
}

export function getDashboard(filtro: FiltroReporte, signal?: AbortSignal) {
  return apiGet<DashboardDatos>("/reportes/dashboard", {
    params: parametros(filtro),
    signal,
  });
}
