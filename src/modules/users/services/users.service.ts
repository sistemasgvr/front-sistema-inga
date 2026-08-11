import type {
  ListUsersParams,
  ListUsersResult,
  User,
  UserFormValues,
} from "../types/user.types";

/**
 * Mock users service — Fase 3.
 * Replace with real API calls when backend /users is ready.
 */

const ROLE_PERMISSIONS: Record<User["rol"], string[]> = {
  admin: ["usuarios.leer", "usuarios.crear", "usuarios.editar", "usuarios.activar"],
  operador: ["usuarios.leer", "usuarios.editar"],
  consulta: ["usuarios.leer"],
};

let users: User[] = [
  {
    id: 1,
    nombre_usuario: "Administrador Inga",
    correo: "admin@inga.com",
    rol: "admin",
    permisos: ROLE_PERMISSIONS.admin,
    estado: "activo",
  },
  {
    id: 2,
    nombre_usuario: "María López",
    correo: "maria.lopez@inga.com",
    rol: "operador",
    permisos: ROLE_PERMISSIONS.operador,
    estado: "activo",
  },
  {
    id: 3,
    nombre_usuario: "Carlos Ruiz",
    correo: "carlos.ruiz@inga.com",
    rol: "consulta",
    permisos: ROLE_PERMISSIONS.consulta,
    estado: "activo",
  },
  {
    id: 4,
    nombre_usuario: "Ana Torres",
    correo: "ana.torres@inga.com",
    rol: "operador",
    permisos: ROLE_PERMISSIONS.operador,
    estado: "inactivo",
  },
  {
    id: 5,
    nombre_usuario: "Luis Gómez",
    correo: "luis.gomez@inga.com",
    rol: "consulta",
    permisos: ROLE_PERMISSIONS.consulta,
    estado: "activo",
  },
  {
    id: 6,
    nombre_usuario: "Elena Vargas",
    correo: "elena.vargas@inga.com",
    rol: "operador",
    permisos: ROLE_PERMISSIONS.operador,
    estado: "activo",
  },
  {
    id: 7,
    nombre_usuario: "Pedro Salas",
    correo: "pedro.salas@inga.com",
    rol: "consulta",
    permisos: ROLE_PERMISSIONS.consulta,
    estado: "inactivo",
  },
  {
    id: 8,
    nombre_usuario: "Diana Méndez",
    correo: "diana.mendez@inga.com",
    rol: "admin",
    permisos: ROLE_PERMISSIONS.admin,
    estado: "activo",
  },
];

let nextId = users.length + 1;

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listUsers(
  params: ListUsersParams,
): Promise<ListUsersResult> {
  await delay();

  const query = params.buscar?.trim().toLowerCase() ?? "";
  const filtered = users.filter((user) => {
    if (!query) return true;
    return (
      user.nombre_usuario.toLowerCase().includes(query) ||
      user.correo.toLowerCase().includes(query) ||
      user.rol.toLowerCase().includes(query)
    );
  });

  const start = (params.pagina - 1) * params.limite;
  const registros = filtered.slice(start, start + params.limite);

  return { registros, total: filtered.length };
}

export async function createUser(values: UserFormValues): Promise<User> {
  await delay();

  const exists = users.some(
    (user) => user.correo.toLowerCase() === values.correo.trim().toLowerCase(),
  );
  if (exists) {
    throw new Error("Ya existe un usuario con ese correo.");
  }

  const user: User = {
    id: nextId++,
    nombre_usuario: values.nombre_usuario.trim(),
    correo: values.correo.trim().toLowerCase(),
    rol: values.rol,
    permisos: ROLE_PERMISSIONS[values.rol],
    estado: values.estado,
  };

  users = [user, ...users];
  return user;
}

export async function updateUser(
  id: number,
  values: UserFormValues,
): Promise<User> {
  await delay();

  const index = users.findIndex((user) => user.id === id);
  if (index === -1) {
    throw new Error("Usuario no encontrado.");
  }

  const correoTaken = users.some(
    (user) =>
      user.id !== id &&
      user.correo.toLowerCase() === values.correo.trim().toLowerCase(),
  );
  if (correoTaken) {
    throw new Error("Ya existe un usuario con ese correo.");
  }

  const updated: User = {
    ...users[index],
    nombre_usuario: values.nombre_usuario.trim(),
    correo: values.correo.trim().toLowerCase(),
    rol: values.rol,
    permisos: ROLE_PERMISSIONS[values.rol],
    estado: values.estado,
  };

  users = users.map((user) => (user.id === id ? updated : user));
  return updated;
}

export async function toggleUserStatus(id: number): Promise<User> {
  await delay();

  const user = users.find((item) => item.id === id);
  if (!user) {
    throw new Error("Usuario no encontrado.");
  }

  const updated: User = {
    ...user,
    estado: user.estado === "activo" ? "inactivo" : "activo",
  };

  users = users.map((item) => (item.id === id ? updated : item));
  return updated;
}

export const USER_ROLE_OPTIONS = [
  { value: "admin", label: "Administrador" },
  { value: "operador", label: "Operador" },
  { value: "consulta", label: "Consulta" },
] as const;

export const USER_STATUS_OPTIONS = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
] as const;
