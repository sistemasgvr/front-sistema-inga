import {
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
} from "@/shared/api/api-client";
import type {
  ListAlmacenesParams,
  ListAlmacenesResult,
  AlmacenItem,
  AlmacenFormValues,
  AlmacenesResumen,
} from "../types/almacenes.types";

export async function listAlmacenes(
  params: ListAlmacenesParams,
): Promise<ListAlmacenesResult> {
  const response = await apiGetPaginated<AlmacenItem>("/almacenes", {
    params: {
      pagina: params.pagina,
      limite: params.limite,
      buscar: params.buscar || undefined,
      estado: params.estado || "activos",
      id_sucursal: params.id_sucursal,
    },
  });

  const rawResponse = response as unknown as {
    data?: AlmacenItem[] | { data?: AlmacenItem[]; meta?: any; registros?: AlmacenItem[] };
    meta?: { total: number; resumen?: AlmacenesResumen };
    registros?: AlmacenItem[];
    total?: number;
    resumen?: AlmacenesResumen;
  };

  let registros: AlmacenItem[] = [];
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

export async function createAlmacen(values: AlmacenFormValues): Promise<AlmacenItem> {
  const response = await apiPost<any>("/almacenes", {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
  return response?.registro || response?.data || response;
}

export async function updateAlmacen(
  id: number,
  values: AlmacenFormValues,
): Promise<AlmacenItem> {
  const response = await apiPatch<any>(`/almacenes/${id}`, {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
  return response?.registro || response?.data || response;
}

export async function toggleAlmacenStatus(almacen: AlmacenItem): Promise<any> {
  const almacenId = Number(almacen.id);
  if (almacen.estado === 1) {
    return apiDelete<any>(`/almacenes/${almacenId}`);
  } else {
    return apiPatch<any>(`/almacenes/${almacenId}/activar`);
  }
}