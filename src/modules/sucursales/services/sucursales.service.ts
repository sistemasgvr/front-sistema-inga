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
} from "../types/sucursal.types";

export async function listSucursales(
  params?: ListSucursalesParams,
): Promise<ListSucursalesResult> {
  const response = await apiGetPaginated<any>("/general/sucursales", {
    params: {
      pagina: params?.pagina ?? 1,
      limite: params?.limite ?? 100,
      buscar: params?.buscar || undefined,
      estado: params?.estado || "activos",
    },
  });

  const raw = response as any;

  const registros: Sucursal[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];

  const total = raw?.meta?.total ?? raw?.data?.meta?.total ?? registros.length;
  const resumen = raw?.meta?.resumen ?? raw?.data?.meta?.resumen;

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