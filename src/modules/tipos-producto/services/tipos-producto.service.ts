import { apiGet, apiPatch, apiPost } from "@/shared/api/api-client";
import type {
  ImpactoTipoProducto,
  PermisosTipoProducto,
  TipoProducto,
  TipoProductoFormValues,
} from "../types/tipos-producto.types";

export function listTiposProducto(signal?: AbortSignal) {
  return apiGet<TipoProducto[]>("/tipos-producto", { signal });
}
export function getImpactoTipoProducto(id: number) {
  return apiGet<ImpactoTipoProducto>(`/tipos-producto/${id}/impacto`);
}
export function updatePermisosTipoProducto(id: number, permisos: PermisosTipoProducto) {
  return apiPatch<TipoProducto>(`/tipos-producto/${id}/permisos`, permisos);
}
export function createTipoProducto(values: TipoProductoFormValues) {
  return apiPost<TipoProducto>("/tipos-producto", {
    ...values,
    permite_stock_inicial: values.permite_stock_inicial && !values.requiere_receta,
    nombre: values.nombre.trim(),
  });
}
