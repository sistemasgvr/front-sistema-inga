import {
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
} from "@/shared/api/api-client";
import type { ToggleStatusResult } from "@/shared/api/api-client";
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
  const { data, meta } = await apiGetPaginated<AlmacenItem, AlmacenesResumen>(
    "/almacenes",
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

export async function createAlmacen(values: AlmacenFormValues): Promise<AlmacenItem> {
  const response = await apiPost<AlmacenItem>("/almacenes", {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
  return response;
}

export async function updateAlmacen(
  id: number,
  values: AlmacenFormValues,
): Promise<AlmacenItem> {
  const response = await apiPatch<AlmacenItem>(`/almacenes/${id}`, {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
  return response;
}

export async function toggleAlmacenStatus(almacen: AlmacenItem): Promise<ToggleStatusResult> {
  const almacenId = Number(almacen.id);
  if (almacen.estado === 1) {
    return apiDelete<ToggleStatusResult>(`/almacenes/${almacenId}`);
  } else {
    return apiPatch<ToggleStatusResult>(`/almacenes/${almacenId}/activar`);
  }
}