import type { RoleItem } from "@/modules/roles/types/roles.types";

export type UserStatus = 1 | 0;

export type SucursalOption = {
  id: number;
  nombre: string;
};

export type User = {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  id_sucursal_default: number | null;
  es_super_admin?: boolean;
  permisos?: string[];
  estado: UserStatus;
  roles?: RoleItem[];
};

export type UserFormValues = {
  username: string;
  email: string;
  password?: string;
  pin?: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  idSucursalDefault?: number | null;
  rolesIds: number[];
  estado?: UserStatus;
};

export type UserStatusFilter = "todos" | "activos" | "inactivos";

export type UsersResumen = {
  total: number;
  activos: number;
  inactivos: number;
};

export type ListUsersParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: UserStatusFilter;
};

export type ListUsersResult = {
  registros: User[];
  total: number;
  resumen?: UsersResumen;
};

export type UsersFeedback = {
  variant: "success" | "error" | "info";
  title: string;
  message: string;
} | null;