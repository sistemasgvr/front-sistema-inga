export type CategoriaStatus = 1 | 0;

export type CategoriaItem = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  es_carta: boolean;
  orden: number;
  estado: CategoriaStatus;
  total_subcategorias?: number;
  fecha_creacion?: string;
  fecha_modificacion?: string;
};

export type CategoriaFormValues = {
  codigo: string;
  nombre: string;
  descripcion?: string;
  es_carta: boolean;
  orden: number;
};

export type CategoriaStatusFilter = "todos" | "activos" | "inactivos";

export type CategoriasResumen = {
  total: number;
  activos: number;
  inactivos: number;
};

export type ListCategoriasParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: CategoriaStatusFilter;
  es_carta?: boolean;
};

export type ListCategoriasResult = {
  registros: CategoriaItem[];
  total: number;
  resumen?: CategoriasResumen;
};