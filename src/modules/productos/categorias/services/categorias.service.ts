import {
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
} from "@/shared/api/api-client";
import type {
  ListCategoriasParams,
  ListCategoriasResult,
  CategoriaItem,
  CategoriaFormValues,
  CategoriasResumen,
} from "../types/categorias.types";

export async function listCategorias(
  params: ListCategoriasParams,
): Promise<ListCategoriasResult> {
  const response = await apiGetPaginated<CategoriaItem>("/productos/categorias", {
    params: {
      pagina: params.pagina,
      limite: params.limite,
      buscar: params.buscar || undefined,
      estado: params.estado || "activos",
      es_carta: params.es_carta,
    },
  });

  const rawResponse = response as unknown as {
    data?: CategoriaItem[] | { data?: CategoriaItem[]; meta?: any; registros?: CategoriaItem[] };
    meta?: {
      total: number;
      resumen?: CategoriasResumen;
    };
    registros?: CategoriaItem[];
    total?: number;
    resumen?: CategoriasResumen;
  };

  let registros: CategoriaItem[] = [];
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

export async function createCategoria(values: CategoriaFormValues): Promise<CategoriaItem> {
  const response = await apiPost<any>("/productos/categorias", {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
  return response?.registro || response?.data || response;
}

export async function updateCategoria(
  id: number,
  values: CategoriaFormValues,
): Promise<CategoriaItem> {
  const response = await apiPatch<any>(`/productos/categorias/${id}`, {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
  return response?.registro || response?.data || response;
}

export async function toggleCategoriaStatus(categoria: CategoriaItem): Promise<any> {
  const catId = Number(categoria.id);
  if (categoria.estado === 1) {
    return apiDelete<any>(`/productos/categorias/${catId}`);
  } else {
    return apiPatch<any>(`/productos/categorias/${catId}/activar`);
  }
}