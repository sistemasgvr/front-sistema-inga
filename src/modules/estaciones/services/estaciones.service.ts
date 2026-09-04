import {
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
} from "@/shared/api/api-client";
import type { ToggleStatusResult } from "@/shared/api/api-client";
import type {
  ListEstacionesParams,
  ListEstacionesResult,
  EstacionItem,
  EstacionFormValues,
  EstacionesResumen,
} from "../types/estaciones.types";

export async function listEstaciones(
  params: ListEstacionesParams,
): Promise<ListEstacionesResult> {
  const { data, meta } = await apiGetPaginated<EstacionItem, EstacionesResumen>(
    "/estaciones",
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        buscar: params.buscar || undefined,
        estado: params.estado || "activos",
        id_sucursal: params.id_sucursal,
      },
    },
  );

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

export async function createEstacion(values: EstacionFormValues): Promise<EstacionItem> {
  const response = await apiPost<EstacionItem>("/estaciones", {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    impresora_nombre: values.impresora_nombre?.trim() || null,
    impresora_ip: values.impresora_ip?.trim() || null,
  });
  return response;
}

export async function updateEstacion(
  id: number,
  values: EstacionFormValues,
): Promise<EstacionItem> {
  const response = await apiPatch<EstacionItem>(`/estaciones/${id}`, {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    impresora_nombre: values.impresora_nombre?.trim() || null,
    impresora_ip: values.impresora_ip?.trim() || null,
  });
  return response;
}

export async function toggleEstacionStatus(estacion: EstacionItem): Promise<ToggleStatusResult> {
  const estacionId = Number(estacion.id);
  if (estacion.estado === 1) {
    return apiDelete<ToggleStatusResult>(`/estaciones/${estacionId}`);
  } else {
    return apiPatch<ToggleStatusResult>(`/estaciones/${estacionId}/activar`);
  }
}