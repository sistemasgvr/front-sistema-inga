export type SubCategoriaStatus = 1 | 0;

export type SubCategoriaItem = {
  id: number;
  id_categoria: number;
  nombre_categoria?: string;
  codigo: string;
  nombre: string;
  orden: number;
  estado: SubCategoriaStatus;
  total_productos?: number;
  fecha_creacion?: string;
  fecha_modificacion?: string;
};

export type SubCategoriaFormValues = {
  id_categoria: number;
  codigo: string;
  nombre: string;
  orden: number;
};

export type SubCategoriaStatusFilter = "todos" | "activos" | "inactivos";

export type SubCategoriasResumen = {
  total: number;
  activos: number;
  inactivos: number;
};

export type ListSubCategoriasParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: SubCategoriaStatusFilter;
  id_categoria?: number;
};

export type ListSubCategoriasResult = {
  registros: SubCategoriaItem[];
  total: number;
  resumen?: SubCategoriasResumen;
};