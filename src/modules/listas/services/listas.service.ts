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
  if (
    referencia === null ||
    !Number.isSafeInteger(referencia) ||
    referencia <= 0
  ) {
    return Promise.reject(
      new Error(
        "Configura el ID real de esta lista en lista-ids.ts. Debe ser un entero positivo.",
      ),
    );
  }
  return apiGet<ListaConOpciones>(`/general/listas/${referencia}/opciones`, {
    signal,
  });
}

export async function obtenerOpcionesLista(
  referencia: ListaReferencia,
  signal?: AbortSignal,
) {
  return (await obtenerLista(referencia, signal)).opciones;
}
