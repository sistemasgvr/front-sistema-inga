import {
  apiGet,
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
} from "@/shared/api/api-client";
import type {
  ListRolesParams,
  ListRolesResult,
  PermisoItem,
  RoleItem,
  RoleFormValues,
  RolesResumen,
} from "../types/roles.types";

export async function listRoles(
  params: ListRolesParams,
): Promise<ListRolesResult> {
  const { data, meta } = await apiGetPaginated<RoleItem, RolesResumen>(
    "/auth/roles",
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

export async function createRole(values: RoleFormValues): Promise<RoleItem> {
  return apiPost<RoleItem>("/auth/roles", {
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
}

export async function updateRole(
  id: number,
  values: RoleFormValues,
): Promise<RoleItem> {
  return apiPatch<RoleItem>(`/auth/roles/${id}`, {
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
}

export async function toggleRoleStatus(role: RoleItem): Promise<RoleItem> {
  const roleId = Number(role.id);
  if (role.estado === 1) {
    return apiDelete<RoleItem>(`/auth/roles/${roleId}`);
  } else {
    return apiPatch<RoleItem>(`/auth/roles/${roleId}/activar`);
  }
}

export async function getPermissionsCatalog(): Promise<PermisoItem[]> {
  const response = await apiGet<{ data?: PermisoItem[] } | PermisoItem[]>(
    "/auth/permisos",
    { params: { limite: 200 } },
  );

  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  return [];
}

export async function getRolePermissions(idRol: number): Promise<number[]> {
  const rol = await apiGet<{ permisos?: PermisoItem[] }>(
    `/auth/roles/${idRol}`,
  );
  return rol?.permisos?.map((permiso) => permiso.id) ?? [];
}

export async function syncRolePermissions(
  idRol: number,
  idsPermisos: number[],
): Promise<void> {
  await apiPatch(`/auth/roles/${idRol}/permisos`, {
    idsPermisos,
  });
}