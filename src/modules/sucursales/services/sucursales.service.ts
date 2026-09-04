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
  const { data, meta } = await apiGetPaginated<Sucursal, SucursalesResumen>(
    "/general/sucursales",
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        buscar: params.buscar || undefined,
        estado: params.estado || "activos",
      },
    },
  );

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
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
