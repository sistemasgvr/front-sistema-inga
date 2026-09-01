export type ProductoStatus = 1 | 0;

export type ProductoItem = {
  id: number;
  id_subcategoria: number;
  nombre_subcategoria?: string;
  id_categoria?: number;
  nombre_categoria?: string;
  id_unidad_medida: number;
  simbolo_unidad?: string;
  id_estacion?: number | null;
  nombre_estacion?: string | null;
  id_almacen_stock?: number | null;
  codigo_interno: string;
  nombre: string;
  descripcion?: string | null;
  tipo_producto: number;
  precio_venta: number;
  costo_receta_calculado?: number;
  afecto_igv: boolean;
  controla_stock: boolean;
  disponible_venta: boolean;
  tiempo_prep_min?: number | null;
  imagen_url?: string | null;
  estado: ProductoStatus;
  fecha_creacion?: string;
};

export type UnidadMedidaItem = {
  id: number;
  codigo: string;
  codigo_sunat?: string;
  nombre: string;
  simbolo: string;
  es_fraccionable: boolean;
};

export type UnidadConversionItem = {
  id: number;
  id_unidad_origen: number;
  simbolo_origen: string;
  id_unidad_destino: number;
  simbolo_destino: string;
  factor: number;
};

export type UnidadesResponse = {
  unidades: UnidadMedidaItem[];
  conversiones: UnidadConversionItem[];
};

export type ProductoFormValues = {
  id_subcategoria: number;
  id_unidad_medida: number;
  id_estacion?: number | null;
  id_almacen_stock?: number | null;
  codigo_interno: string;
  nombre: string;
  descripcion?: string;
  tipo_producto: number;
  precio_venta: number;
  afecto_igv: boolean;
  controla_stock: boolean;
  disponible_venta: boolean;
  tiempo_prep_min?: number;
  imagen_url?: string;
};

export type ProductoStatusFilter = "todos" | "activos" | "inactivos";

export type ProductosResumen = {
  total: number;
  activos: number;
  inactivos: number;
};

export type ListProductosParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: ProductoStatusFilter;
  tipo_producto?: number;
  id_subcategoria?: number;
  id_categoria?: number;
};

export type ListProductosResult = {
  registros: ProductoItem[];
  total: number;
  resumen?: ProductosResumen;
};

export type InsumoProcesadoItem = {
  id: number;
  codigo_interno: string;
  nombre: string;
  id_unidad_medida: number;
  simbolo_unidad: string;
  precio_venta: number;
};