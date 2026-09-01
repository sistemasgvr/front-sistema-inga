import type { UserStatus } from "@/modules/users/types/user.types";

export type SucursalStatus = 1 | 0;

export type Sucursal = {
  id: number;
  idEmpresa: number;
  codigo: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  idDistrito: number | null;
  esPrincipal: boolean;
  estado: SucursalStatus;
  totalUsuarios?: number;
  fechaCreacion?: string;
  fechaModificacion?: string;
};

export type SucursalFormValues = {
  idEmpresa: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  idDistrito?: number | null;
  esPrincipal?: boolean;
  estado?: SucursalStatus;
};

export type SucursalStatusFilter = "todos" | "activos" | "inactivos";

export type SucursalesResumen = {
  total: number;
  activos: number;
  inactivos: number;
};

export type ListSucursalesParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: SucursalStatusFilter;
};

export type ListSucursalesResult = {
  registros: Sucursal[];
  total: number;
  resumen?: SucursalesResumen;
};

export type SucursalesFeedback = {
  variant: "success" | "error" | "info";
  title: string;
  message: string;
} | null;