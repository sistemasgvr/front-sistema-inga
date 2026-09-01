import {
  apiGet,
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
  apiPut,
} from "@/shared/api/api-client";
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
  const response = await apiGetPaginated<ProductoItem>("/productos", {
    params: {
      pagina: params.pagina,
      limite: params.limite,
      buscar: params.buscar || undefined,
      estado: params.estado || "activos",
      tipo_producto: params.tipo_producto || undefined,
      id_subcategoria: params.id_subcategoria || undefined,
      id_categoria: params.id_categoria || undefined,
    },
  });

  const rawResponse = response as unknown as {
    data?: ProductoItem[] | { data?: ProductoItem[]; meta?: any; registros?: ProductoItem[] };
    meta?: {
      total: number;
      resumen?: ProductosResumen;
    };
    registros?: ProductoItem[];
    total?: number;
    resumen?: ProductosResumen;
  };

  let registros: ProductoItem[] = [];
  if (Array.isArray(rawResponse.registros)) {
    registros = rawResponse.registros;
  } else if (Array.isArray(rawResponse.data)) {
    registros = rawResponse.data;
  } else if (rawResponse.data && Array.isArray((rawResponse.data as any).registros)) {
    registros = (rawResponse.data as any).registros;
  } else if (rawResponse.data && Array.isArray((rawResponse.data as any).data)) {
    registros = (rawResponse.data as any).data;
  }

  const total =
    rawResponse.total ??
    rawResponse.meta?.total ?? 
    (rawResponse.data as any)?.total ??
    (rawResponse.data as any)?.meta?.total ?? 
    registros.length;

  const resumen =
    rawResponse.resumen ??
    rawResponse.meta?.resumen ??
    (rawResponse.data as any)?.resumen ??
    (rawResponse.data as any)?.meta?.resumen;

  return {
    registros,
    total,
    resumen,
  };
}

export async function getProductoById(id: number): Promise<ProductoItem> {
  const response = await apiGet<any>(`/productos/${id}`);
  return response?.registro || response?.data || response;
}

export async function createProducto(values: ProductoFormValues): Promise<ProductoItem> {
  const response = await apiPost<any>("/productos", {
    ...values,
    codigo_interno: values.codigo_interno.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
  return response?.registro || response?.data || response;
}

export async function updateProducto(
  id: number,
  values: ProductoFormValues,
): Promise<ProductoItem> {
  const response = await apiPatch<any>(`/productos/${id}`, {
    ...values,
    codigo_interno: values.codigo_interno.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
  return response?.registro || response?.data || response;
}

export async function toggleDisponibilidadProducto(id: number): Promise<ProductoItem> {
  const response = await apiPut<any>(`/productos/${id}/disponibilidad`, {});
  return response?.registro || response?.data || response;
}

export async function toggleProductoStatus(producto: ProductoItem): Promise<any> {
  const prodId = Number(producto.id);
  if (producto.estado === 1) {
    return apiDelete<any>(`/productos/${prodId}`);
  } else {
    return apiPatch<any>(`/productos/${prodId}/activar`);
  }
}

export async function getUnidadesMedida(): Promise<UnidadesResponse> {
  const response = await apiGet<any>("/productos/unidades");
  const data = response?.data || response;
  return {
    unidades: data?.unidades || [],
    conversiones: data?.conversiones || [],
  };
}

export async function getInsumosProcesados(busqueda?: string): Promise<InsumoProcesadoItem[]> {
  const response = await apiGet<any>("/productos/insumos-procesados", {
    params: { busqueda: busqueda || undefined },
  });
  const data = response?.data || response;
  return Array.isArray(data) ? data : data?.registros || [];
}