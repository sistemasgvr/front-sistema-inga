export type EstacionStatus = 1 | 0;

export type EstacionItem = {
  id: number;
  id_sucursal: number;
  codigo: string;
  nombre: string;
  tipo_estacion: number;
  impresora_nombre?: string | null;
  impresora_ip?: string | null;
  usa_kds: boolean;
  estado: EstacionStatus;
  fecha_creacion?: string;
  fecha_modificacion?: string;
};

export type EstacionFormValues = {
  id_sucursal: number;
  codigo: string;
  nombre: string;
  tipo_estacion: number;
  impresora_nombre?: string;
  impresora_ip?: string;
  usa_kds: boolean;
};

export type EstacionStatusFilter = "todos" | "activos" | "inactivos";

export type EstacionesResumen = {
  total: number;
  activos: number;
  inactivos: number;
};

export type ListEstacionesParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: EstacionStatusFilter;
  id_sucursal?: number;
};

export type ListEstacionesResult = {
  registros: EstacionItem[];
  total: number;
  resumen?: EstacionesResumen;
};