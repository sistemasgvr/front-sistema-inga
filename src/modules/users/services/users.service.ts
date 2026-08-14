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
  const response = await apiGetPaginated<User>("/auth/usuarios", {
    params: {
      pagina: params.pagina,
      limite: params.limite,
      buscar: params.buscar || undefined,
      estado: params.estado || "todos",
    },
  });

  const rawResponse = response as unknown as {
    data?: User[] | { data?: User[]; meta?: any };
    meta?: {
      total: number;
      resumen?: UsersResumen;
    };
    resumen?: UsersResumen;
  };

  let registros: User[] = [];
  if (Array.isArray(rawResponse.data)) {
    registros = rawResponse.data;
  } else if (rawResponse.data && Array.isArray((rawResponse.data as any).data)) {
    registros = (rawResponse.data as any).data;
  }

  const total = rawResponse.meta?.total ?? (rawResponse.data as any)?.meta?.total ?? 0;
  const resumen = rawResponse.meta?.resumen ?? rawResponse.resumen ?? (rawResponse.data as any)?.meta?.resumen;

  return {
    registros,
    total,
    resumen,
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
    idSucursalDefault: values.idSucursalDefault
      ? Number(values.idSucursalDefault)
      : null,
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
    idSucursalDefault: values.idSucursalDefault
      ? Number(values.idSucursalDefault)
      : null,
  };

  if (values.password && values.password.trim() !== "") {
    payload.password = values.password.trim();
  }

  if (values.pin && values.pin.trim() !== "") {
    payload.pin = values.pin.trim();
  }

  return apiPatch<User>(`/auth/usuarios/${Number(id)}`, payload);
}

export async function toggleUserStatus(user: User): Promise<User> {
  const userId = Number(user.id);

  if (user.estado === 1) {
    return apiDelete<User>(`/auth/usuarios/${userId}`);
  } else {
    return apiPatch<User>(`/auth/usuarios/${userId}/activar`);
  }
}

