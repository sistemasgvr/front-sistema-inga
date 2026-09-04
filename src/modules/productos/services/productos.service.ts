import {
  apiGet,
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
  apiPut,
} from "@/shared/api/api-client";
import type { ToggleStatusResult } from "@/shared/api/api-client";
import type {
  ListProductosParams,
  ListProductosResult,
  ProductoItem,
  ProductoFormValues,
  ProductosResumen,
  UnidadesResponse,
  InsumoProcesadoItem,
} from "../types/productos.types";

export async function listProductos(
  params: ListProductosParams,
): Promise<ListProductosResult> {
  const { data, meta } = await apiGetPaginated<ProductoItem, ProductosResumen>(
    "/productos",
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        buscar: params.buscar || undefined,
        estado: params.estado || "activos",
        tipo_producto: params.tipo_producto || undefined,
        id_subcategoria: params.id_subcategoria || undefined,
        id_categoria: params.id_categoria || undefined,
      },
    },
  );

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

export async function getProductoById(id: number): Promise<ProductoItem> {
  const response = await apiGet<ProductoItem>(`/productos/${id}`);
  return response;
}

export async function createProducto(values: ProductoFormValues): Promise<ProductoItem> {
  const response = await apiPost<ProductoItem>("/productos", {
    ...values,
    codigo_interno: values.codigo_interno.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
  return response;
}

export async function updateProducto(
  id: number,
  values: ProductoFormValues,
): Promise<ProductoItem> {
  const response = await apiPatch<ProductoItem>(`/productos/${id}`, {
    ...values,
    codigo_interno: values.codigo_interno.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
  return response;
}

export async function toggleDisponibilidadProducto(id: number): Promise<ProductoItem> {
  const response = await apiPut<ProductoItem>(`/productos/${id}/disponibilidad`, {});
  return response;
}

export async function toggleProductoStatus(producto: ProductoItem): Promise<ToggleStatusResult> {
  const prodId = Number(producto.id);
  if (producto.estado === 1) {
    return apiDelete<ToggleStatusResult>(`/productos/${prodId}`);
  } else {
    return apiPatch<ToggleStatusResult>(`/productos/${prodId}/activar`);
  }
}

export async function getUnidadesMedida(): Promise<UnidadesResponse> {
  const response = await apiGet<UnidadesResponse>("/productos/unidades");
  return {
    unidades: response?.unidades ?? [],
    conversiones: response?.conversiones ?? [],
  };
}

export async function getInsumosProcesados(busqueda?: string): Promise<InsumoProcesadoItem[]> {
  const response = await apiGet<{ registros: InsumoProcesadoItem[] }>(
    "/productos/insumos-procesados",
    { params: { busqueda: busqueda || undefined } },
  );
  return response?.registros ?? [];
}