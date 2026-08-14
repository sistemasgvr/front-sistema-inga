export type RoleStatus = 1 | 0;

export type RoleItem = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estado: RoleStatus;
  total_usuarios?: number;
  total_permisos?: number;
};

export type PermisoItem = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  modulo: string;
  estado: number;
};

export type RoleFormValues = {
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado?: RoleStatus;
};

export type RoleStatusFilter = "todos" | "activos" | "inactivos";

export type RolesResumen = {
  total: number;
  activos: number;
  inactivos: number;
};

export type ListRolesParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: RoleStatusFilter;
};

export type ListRolesResult = {
  registros: RoleItem[];
  total: number;
  resumen?: RolesResumen;
};

export type RolesFeedback = {
  variant: "success" | "error" | "info";
  title: string;
  message: string;
} | null;