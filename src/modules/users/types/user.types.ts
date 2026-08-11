/** Aligned with future API shapes (id, correo, nombre_usuario, permisos). */

export type UserStatus = "activo" | "inactivo";

export type UserRole = "admin" | "operador" | "consulta";

export type User = {
  id: number;
  nombre_usuario: string;
  correo: string;
  rol: UserRole;
  permisos: string[];
  estado: UserStatus;
};

export type UserFormValues = {
  nombre_usuario: string;
  correo: string;
  rol: UserRole;
  estado: UserStatus;
};

export type ListUsersParams = {
  buscar?: string;
  pagina: number;
  limite: number;
};

export type ListUsersResult = {
  registros: User[];
  total: number;
};

export type UsersFeedback = {
  variant: "success" | "error" | "info";
  title: string;
  message: string;
} | null;
