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

// 1. Listar roles paginados con filtro por estado
export async function listRoles(
  params: ListRolesParams,
): Promise<ListRolesResult> {
  const response = await apiGetPaginated<RoleItem>("/auth/roles", {
    params: {
      pagina: params.pagina,
      limite: params.limite,
      buscar: params.buscar || undefined,
      estado: params.estado || "activos",
    },
  });

  const rawResponse = response as unknown as {
    data?: RoleItem[] | { data?: RoleItem[]; meta?: any };
    meta?: {
      total: number;
      resumen?: RolesResumen;
    };
    resumen?: RolesResumen;
  };

  let registros: RoleItem[] = [];
  if (Array.isArray(rawResponse.data)) {
    registros = rawResponse.data;
  } else if (rawResponse.data && Array.isArray((rawResponse.data as any).data)) {
    registros = (rawResponse.data as any).data;
  }

  const total =
    rawResponse.meta?.total ?? (rawResponse.data as any)?.meta?.total ?? 0;
  const resumen =
    rawResponse.meta?.resumen ??
    rawResponse.resumen ??
    (rawResponse.data as any)?.meta?.resumen;

  return {
    registros,
    total,
    resumen,
  };
}

// 2. Crear rol
export async function createRole(values: RoleFormValues): Promise<RoleItem> {
  return apiPost<RoleItem>("/auth/roles", {
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
}

// 3. Editar rol
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

// 4. Activar / Desactivar rol
export async function toggleRoleStatus(role: RoleItem): Promise<RoleItem> {
  const roleId = Number(role.id);
  if (role.estado === 1) {
    return apiDelete<RoleItem>(`/auth/roles/${roleId}`);
  } else {
    return apiPatch<RoleItem>(`/auth/roles/${roleId}/activar`);
  }
}

// 5. Obtener catálogo completo de permisos
export async function getPermissionsCatalog(): Promise<PermisoItem[]> {
  const response = await apiGet<{ data?: PermisoItem[] } | PermisoItem[]>(
    "/auth/permisos",
    { params: { limite: 200 } },
  );

  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  return [];
}

// 6. Obtener IDs de permisos de un rol específico
export async function getRolePermissions(idRol: number): Promise<number[]> {
  const response = await apiGet<{ idsPermisos?: number[] } | number[]>(
    `/auth/roles/${idRol}/permisos`,
  );

  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.idsPermisos)) return response.idsPermisos;
  return [];
}

// 7. Guardar/Asignar matriz de permisos a un rol
export async function syncRolePermissions(
  idRol: number,
  idsPermisos: number[],
): Promise<void> {
  await apiPost(`/auth/roles/${idRol}/permisos`, {
    idsPermisos,
  });
}