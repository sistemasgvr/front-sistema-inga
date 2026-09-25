export type RecetaStatus = 1 | 0;

export type RecetaInsumoItem = {
  id: number;
  id_receta: number;
  id_producto_insumo: number;
  nombre_insumo?: string;
  codigo_insumo?: string;
  cantidad: number;
  id_unidad_medida: number;
  simbolo_unidad?: string;
  nombre_unidad?: string;
  porcentaje_merma: number;
  es_opcional: boolean;
  grupo_sustitucion?: number | null;
  orden: number;
  estado: RecetaStatus;
  costo_unitario_estimado?: number;
  monto_subtotal?: number;
};

export type RecetaItem = {
  id: number;
  id_producto: number;
  nombre_producto?: string;
  version: number;
  nombre?: string | null;
  rendimiento_porciones: number;
  vigente: boolean;
  observacion?: string | null;
  estado: RecetaStatus;
  insumos?: RecetaInsumoItem[];
  costo_total_calculado?: number;
  fecha_creacion?: string;
  fecha_modificacion?: string;
};

export type CreateRecetaPayload = {
  nombre?: string;
  rendimiento_porciones: number;
  observacion?: string;
  idUsuarioAuditoria?: number;
};

export type GuardarInsumoPayload = {
  id_producto_insumo: number;
  cantidad: number;
  id_unidad_medida: number;
  porcentaje_merma?: number;
  es_opcional?: boolean;
  grupo_sustitucion?: number;
  orden?: number;
  idUsuarioAuditoria?: number;
};

export type InsumoProcesadoBusquedaItem = {
  id: number;
  codigo_interno: string;
  nombre: string;
  id_unidad_medida: number;
  simbolo_unidad: string;
  nombre_unidad: string;
  costo_promedio?: number;
};