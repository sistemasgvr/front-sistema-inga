import { apiGet, apiPost, apiDelete } from "@/shared/api/api-client";
import type { ToggleStatusResult } from "@/shared/api/api-client";
import type {
  RecetaItem,
  CreateRecetaPayload,
  GuardarInsumoPayload,
  RecetaInsumoItem,
  InsumoProcesadoBusquedaItem,
  FiltroInsumosReceta,
} from "../types/recetas.types";

/**
 * Busca insumos para el recetario.
 *
 * El recetario es multi-nivel, así que devuelve tanto insumos crudos como
 * platos que ya tienen receta propia. Todos exigen `controla_stock`, que es
 * lo que el motor necesita para apartarlos al comandar.
 */
export async function getInsumosProcesadosApi(
  filtros: FiltroInsumosReceta = {}
): Promise<InsumoProcesadoBusquedaItem[]> {
  const response = await apiGet<any>("/productos/insumos-procesados", {
    params: {
      busqueda: filtros.busqueda || undefined,
      id_tipo_producto: filtros.id_tipo_producto || undefined,
      id_categoria: filtros.id_categoria || undefined,
      id_subcategoria: filtros.id_subcategoria || undefined,
    },
  });
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.registros)) return response.registros;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

/**
 * Lista el historial de versiones de receta asociadas a un producto.
 */
export async function getHistorialRecetasProductoApi(
  idProducto: number
): Promise<RecetaItem[]> {
  const response = await apiGet<any>(`/productos/${idProducto}/recetas`);
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.registros)) return response.registros;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

/**
 * Obtiene el detalle completo de una receta por su ID incluyendo la lista de insumos.
 */
export async function getRecetaDetalleApi(idReceta: number): Promise<RecetaItem> {
  const response = await apiGet<any>(`/productos/recetas/${idReceta}`);
  return response?.data ?? response;
}

/**
 * Crea o versiona una nueva receta para el producto indicado.
 */
export async function crearRecetaApi(
  idProducto: number,
  payload: CreateRecetaPayload
): Promise<RecetaItem> {
  const response = await apiPost<any>(`/productos/${idProducto}/recetas`, payload);
  return response?.data ?? response;
}

/**
 * Agrega o actualiza una línea de insumo dentro de una versión de receta.
 */
export async function guardarInsumoRecetaApi(
  idReceta: number,
  payload: GuardarInsumoPayload
): Promise<RecetaInsumoItem> {
  const response = await apiPost<any>(
    `/productos/recetas/${idReceta}/insumos`,
    payload
  );
  return response?.data ?? response;
}

/**
 * Elimina un insumo específico de la receta.
 */
export async function eliminarInsumoRecetaApi(
  idInsumoReceta: number,
  idUsuarioAuditoria?: number
): Promise<ToggleStatusResult> {
  return await apiDelete<ToggleStatusResult>(
    `/productos/recetas/insumos/${idInsumoReceta}`,
    { data: { idUsuarioAuditoria } }
  );
}

/**
 * Da de baja una receta completa.
 */
export async function eliminarRecetaApi(
  idReceta: number,
  idUsuarioAuditoria?: number
): Promise<ToggleStatusResult> {
  return await apiDelete<ToggleStatusResult>(`/productos/recetas/${idReceta}`, {
    data: { idUsuarioAuditoria },
  });
}