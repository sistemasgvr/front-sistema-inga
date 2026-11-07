export interface TipoProducto {
  id: number;
  nombre: string;
  permite_venta: boolean;
  requiere_receta: boolean;
  requiere_estacion: boolean;
  permite_stock_inicial: boolean;
}
export type TipoProductoFormValues = Omit<TipoProducto, "id">;
export type PermisosTipoProducto = Omit<TipoProductoFormValues, "nombre">;
export interface ImpactoTipoProducto {
  total: number;
  sin_receta: number;
  sin_estacion: number;
  en_venta: number;
}
