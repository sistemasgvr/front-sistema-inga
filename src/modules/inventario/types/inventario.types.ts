export type StockItem = {
  id: number;
  id_almacen: number;
  almacen_nombre?: string;
  id_producto: number;
  producto_codigo?: string;
  producto_nombre?: string;
  simbolo_unidad?: string;
  stock_actual: number;
  stock_minimo: number;
  stock_reservado: number;
  costo_promedio: number;
  alerta_activa?: boolean;
};

export type StockStatusFilter = "todos" | "alertas" | "normales";

export type StockResumen = {
  total: number;
  alertas: number;
  normales: number;
};

export type ListStockParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: StockStatusFilter;
  id_almacen?: number;
};

export type RegistrarMovimientoValues = {
  codigo: string;
  id_tipo_movimiento: number;
  id_motivo_movimiento: number;
  id_almacen: number;
  id_producto: number;
  id_unidad_medida: number;
  cantidad: number;
  signo: 1 | -1;
  costo_unitario?: number;
  observacion?: string;
  confirmar?: boolean;
};