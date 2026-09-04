import {
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
} from "@/shared/api/api-client";
import type {
  ListUsersParams,
  ListUsersResult,
  User,
  UserFormValues,
  UsersResumen,
} from "../types/user.types";

export async function listUsers(
  params: ListUsersParams,
): Promise<ListUsersResult> {
  const { data, meta } = await apiGetPaginated<User, UsersResumen>(
    "/auth/usuarios",
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

export async function createUser(values: UserFormValues): Promise<User> {
  return apiPost<User>("/auth/usuarios", {
    username: values.username.trim().toLowerCase(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
    pin: values.pin?.trim() || undefined,
    nombres: values.nombres.trim(),
    apellidos: values.apellidos.trim(),
    telefono: values.telefono?.trim() || null,
    idSucursalDefault: values.idSucursalDefault ?? 1,
    rolesIds: values.rolesIds ?? [],
  });
}

export async function updateUser(
  id: number,
  values: UserFormValues,
): Promise<User> {
  const payload: Record<string, unknown> = {
    username: values.username.trim().toLowerCase(),
    email: values.email.trim().toLowerCase(),
    nombres: values.nombres.trim(),
    apellidos: values.apellidos.trim(),
    telefono: values.telefono?.trim() || null,
    idSucursalDefault: values.idSucursalDefault ?? 1,
    rolesIds: values.rolesIds ?? [],
  };

  if (values.password && values.password.trim() !== "") {
    payload.password = values.password.trim();
  }

  if (values.pin && values.pin.trim() !== "") {
    payload.pin = values.pin.trim();
  }

  return apiPatch<User>(`/auth/usuarios/${id}`, payload);
}

export async function toggleUserStatus(user: User): Promise<User> {
  if (user.estado === 1) {
    return apiDelete<User>(`/auth/usuarios/${user.id}`);
  }
  return apiPatch<User>(`/auth/usuarios/${user.id}/activar`);
}