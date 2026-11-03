import { apiGet } from "@/shared/api/api-client";
import type {
  Lista,
  ListaConOpciones,
  ListaReferencia,
} from "../types/listas.types";

export function listarListas(signal?: AbortSignal) {
  return apiGet<Lista[]>("/general/listas", { signal });
}

export function obtenerLista(
  referencia: ListaReferencia,
  signal?: AbortSignal,
) {
  if (!referencia?.trim()) {
    return Promise.reject(new Error("Indica el código de la lista (ver LISTAS)."));
  }
  return apiGet<ListaConOpciones>(
    `/general/listas/codigo/${encodeURIComponent(referencia)}/opciones`,
    { signal },
  );
}

export async function obtenerOpcionesLista(
  referencia: ListaReferencia,
  signal?: AbortSignal,
  tipoMovimiento?: number,
) {
  if (!referencia) return [];
  if (tipoMovimiento !== undefined) {
    return (await apiGet<ListaConOpciones>(`/general/listas/codigo/${encodeURIComponent(referencia)}/opciones`, {
      signal, params: { tipo_movimiento: tipoMovimiento },
    })).opciones;
  }
  return (await obtenerLista(referencia, signal)).opciones;
}
