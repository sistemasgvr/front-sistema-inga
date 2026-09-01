export type AlmacenStatus = 1 | 0;

export type AlmacenItem = {
  id: number;
  id_sucursal: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_almacen: number;
  es_principal: boolean;
  estado: AlmacenStatus;
  fecha_creacion?: string;
  fecha_modificacion?: string;
};

export type AlmacenFormValues = {
  id_sucursal: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_almacen: number;
  es_principal: boolean;
};

export type AlmacenStatusFilter = "todos" | "activos" | "inactivos";

export type AlmacenesResumen = {
  total: number;
  activos: number;
  inactivos: number;
};

export type ListAlmacenesParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: AlmacenStatusFilter;
  id_sucursal?: number;
};

export type ListAlmacenesResult = {
  registros: AlmacenItem[];
  total: number;
  resumen?: AlmacenesResumen;
};