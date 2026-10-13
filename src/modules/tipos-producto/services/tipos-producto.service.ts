import { apiGet, apiPost } from "@/shared/api/api-client";
import type {
  TipoProducto,
  TipoProductoFormValues,
} from "../types/tipos-producto.types";

export function listTiposProducto(signal?: AbortSignal) {
  return apiGet<TipoProducto[]>("/tipos-producto", { signal });
}
export function createTipoProducto(values: TipoProductoFormValues) {
  return apiPost<TipoProducto>("/tipos-producto", {
    ...values,
    permite_stock_inicial: values.permite_stock_inicial && !values.requiere_receta,
    nombre: values.nombre.trim(),
  });
}
