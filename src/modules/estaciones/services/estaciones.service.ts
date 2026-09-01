import {
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
} from "@/shared/api/api-client";
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
  const response = await apiGetPaginated<EstacionItem>("/estaciones", {
    params: {
      pagina: params.pagina,
      limite: params.limite,
      buscar: params.buscar || undefined,
      estado: params.estado || "activos",
      id_sucursal: params.id_sucursal,
    },
  });

  const rawResponse = response as unknown as {
    data?: EstacionItem[] | { data?: EstacionItem[]; meta?: any; registros?: EstacionItem[] };
    meta?: { total: number; resumen?: EstacionesResumen };
    registros?: EstacionItem[];
    total?: number;
    resumen?: EstacionesResumen;
  };

  let registros: EstacionItem[] = [];
  if (Array.isArray(rawResponse.registros)) {
    registros = rawResponse.registros;
  } else if (Array.isArray(rawResponse.data)) {
    registros = rawResponse.data;
  } else if (rawResponse.data && Array.isArray((rawResponse.data as any).registros)) {
    registros = (rawResponse.data as any).registros;
  } else if (rawResponse.data && Array.isArray((rawResponse.data as any).data)) {
    registros = (rawResponse.data as any).data;
  }

  const total =
    rawResponse.total ??
    rawResponse.meta?.total ??
    (rawResponse.data as any)?.total ??
    (rawResponse.data as any)?.meta?.total ??
    registros.length;

  const resumen =
    rawResponse.resumen ??
    rawResponse.meta?.resumen ??
    (rawResponse.data as any)?.resumen ??
    (rawResponse.data as any)?.meta?.resumen;

  return { registros, total, resumen };
}

export async function createEstacion(values: EstacionFormValues): Promise<EstacionItem> {
  const response = await apiPost<any>("/estaciones", {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    impresora_nombre: values.impresora_nombre?.trim() || null,
    impresora_ip: values.impresora_ip?.trim() || null,
  });
  return response?.registro || response?.data || response;
}

export async function updateEstacion(
  id: number,
  values: EstacionFormValues,
): Promise<EstacionItem> {
  const response = await apiPatch<any>(`/estaciones/${id}`, {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    impresora_nombre: values.impresora_nombre?.trim() || null,
    impresora_ip: values.impresora_ip?.trim() || null,
  });
  return response?.registro || response?.data || response;
}

export async function toggleEstacionStatus(estacion: EstacionItem): Promise<any> {
  const estacionId = Number(estacion.id);
  if (estacion.estado === 1) {
    return apiDelete<any>(`/estaciones/${estacionId}`);
  } else {
    return apiPatch<any>(`/estaciones/${estacionId}/activar`);
  }
}