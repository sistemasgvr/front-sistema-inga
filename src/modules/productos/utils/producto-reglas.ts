import type { TipoProducto } from "@/modules/tipos-producto";
import type { ProductoFormValues } from "../types/productos.types";

export function aplicarReglasTipo(
  raw: ProductoFormValues,
  tipo: TipoProducto,
): ProductoFormValues {
  return {
    ...raw,
    tipo_producto: tipo.id,
    precio_venta: tipo.permite_venta
      ? Math.max(0, Number(raw.precio_venta) || 0)
      : 0,
    disponible_venta: tipo.permite_venta && raw.disponible_venta,
    id_estacion: tipo.requiere_estacion ? raw.id_estacion : null,
    tiempo_prep_min: tipo.requiere_receta ? raw.tiempo_prep_min : null,
    id_almacen_stock: raw.controla_stock ? raw.id_almacen_stock : null,
    stock_minimo: raw.controla_stock ? raw.stock_minimo : 0,
    stock_inicial:
      raw.controla_stock && tipo.permite_stock_inicial ? raw.stock_inicial : 0,
    costo_inicial:
      raw.controla_stock && tipo.permite_stock_inicial ? raw.costo_inicial : 0,
  };
}
