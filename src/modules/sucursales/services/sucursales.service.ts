import {
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
} from "@/shared/api/api-client";
import type {
  ListSucursalesParams,
  ListSucursalesResult,
  Sucursal,
  SucursalFormValues,
  SucursalesResumen,
} from "../types/sucursal.types";

export async function listSucursales(
  params: ListSucursalesParams,
): Promise<ListSucursalesResult> {
  const response = await apiGetPaginated<Sucursal>("/general/sucursales", {
    params: {
      pagina: params.pagina,
      limite: params.limite,
      buscar: params.buscar || undefined,
      estado: params.estado || "activos",
    },
  });

  const rawResponse = response as unknown as {
    data?: Sucursal[] | { data?: Sucursal[]; meta?: any };
    meta?: {
      total: number;
      resumen?: SucursalesResumen;
    };
    resumen?: SucursalesResumen;
  };

  let registros: Sucursal[] = [];
  if (Array.isArray(rawResponse.data)) {
    registros = rawResponse.data;
  } else if (
    rawResponse.data &&
    Array.isArray((rawResponse.data as any).data)
  ) {
    registros = (rawResponse.data as any).data;
  }

  const total =
    rawResponse.meta?.total ??
    (rawResponse.data && !Array.isArray(rawResponse.data)
      ? (rawResponse.data as any).meta?.total
      : 0) ??
    registros.length;

  const resumen =
    rawResponse.meta?.resumen ??
    rawResponse.resumen ??
    (rawResponse.data && !Array.isArray(rawResponse.data)
      ? (rawResponse.data as any).meta?.resumen
      : undefined);

  return {
    registros,
    total,
    resumen,
  };
}

export async function createSucursal(
  values: SucursalFormValues,
): Promise<Sucursal> {
  return apiPost<Sucursal>("/general/sucursales", {
    idEmpresa: values.idEmpresa ?? 1,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    direccion: values.direccion?.trim() || null,
    telefono: values.telefono?.trim() || null,
    idDistrito: values.idDistrito ?? null,
    esPrincipal: values.esPrincipal ?? false,
  });
}

export async function updateSucursal(
  id: number,
  values: SucursalFormValues,
): Promise<Sucursal> {
  return apiPatch<Sucursal>(`/general/sucursales/${id}`, {
    idEmpresa: values.idEmpresa ?? 1,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    direccion: values.direccion?.trim() || null,
    telefono: values.telefono?.trim() || null,
    idDistrito: values.idDistrito ?? null,
    esPrincipal: values.esPrincipal ?? false,
  });
}

export async function toggleSucursalStatus(
  sucursal: Sucursal,
): Promise<Sucursal> {
  if (sucursal.estado === 1) {
    return apiDelete<Sucursal>(`/general/sucursales/${sucursal.id}`);
  }
  return apiPatch<Sucursal>(`/general/sucursales/${sucursal.id}/activar`);
}
