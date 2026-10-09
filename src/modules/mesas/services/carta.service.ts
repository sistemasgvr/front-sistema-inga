import { apiGet, apiGetPaginated } from "@/shared/api/api-client";
import type { AdicionalCarta, FiltrosCarta, ProductoOption } from "../types/mesas.types";

async function listarTodas<T>(url: string, params: Record<string, string | number | undefined>, signal: AbortSignal) {
  const items: T[] = [];
  for (let pagina = 1; ; pagina++) {
    const { data, meta } = await apiGetPaginated<T>(url, { params: { ...params, estado: "activos", pagina, limite: 100 }, signal });
    items.push(...data);
    if (!data.length || items.length >= meta.total) return items;
  }
}

export async function buscarCarta(filtros: FiltrosCarta, signal: AbortSignal) {
  const items = await listarTodas<ProductoOption>("/productos", {
    buscar: filtros.buscar.trim() || undefined,
    tipo_producto: filtros.tipo_producto || undefined,
    id_categoria: filtros.id_categoria || undefined,
    id_subcategoria: filtros.id_subcategoria || undefined,
  }, signal);
  // Los insumos de almacén no forman parte de la carta para atención.
  return items.filter(p => p.disponible_venta && p.permite_venta);
}

type CategoriaCarta = { id: number; nombre: string };
export const listarCategoriasCarta = (signal: AbortSignal) => listarTodas<CategoriaCarta>("/productos/categorias", {}, signal);
export const listarSubcategoriasCarta = (idCategoria: string, signal: AbortSignal) => listarTodas<CategoriaCarta>("/productos/subcategorias", { id_categoria: idCategoria }, signal);

export async function listarAdicionalesCarta(idProducto: number, signal: AbortSignal) {
  const result = await apiGet<{ registros: AdicionalCarta[] }>(`/productos/${idProducto}/adicionales`, { signal });
  return result.registros.filter(a => Number(a.estado) === 1);
}
