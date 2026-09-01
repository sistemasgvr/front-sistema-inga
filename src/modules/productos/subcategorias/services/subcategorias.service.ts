import {
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
} from "@/shared/api/api-client";
import type {
  ListSubCategoriasParams,
  ListSubCategoriasResult,
  SubCategoriaItem,
  SubCategoriaFormValues,
  SubCategoriasResumen,
} from "../types/subcategorias.types";

export async function listSubCategorias(
  params: ListSubCategoriasParams,
): Promise<ListSubCategoriasResult> {
  const response = await apiGetPaginated<SubCategoriaItem>("/productos/subcategorias", {
    params: {
      pagina: params.pagina,
      limite: params.limite,
      buscar: params.buscar || undefined,
      estado: params.estado || "activos",
      id_categoria: params.id_categoria || undefined,
    },
  });

  const rawResponse = response as unknown as {
    data?: SubCategoriaItem[] | { data?: SubCategoriaItem[]; meta?: any; registros?: SubCategoriaItem[] };
    meta?: {
      total: number;
      resumen?: SubCategoriasResumen;
    };
    registros?: SubCategoriaItem[];
    total?: number;
    resumen?: SubCategoriasResumen;
  };

  let registros: SubCategoriaItem[] = [];
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

export async function createSubCategoria(values: SubCategoriaFormValues): Promise<SubCategoriaItem> {
  const response = await apiPost<any>("/productos/subcategorias", {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
  });
  return response?.registro || response?.data || response;
}

export async function updateSubCategoria(
  id: number,
  values: SubCategoriaFormValues,
): Promise<SubCategoriaItem> {
  const response = await apiPatch<any>(`/productos/subcategorias/${id}`, {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
  });
  return response?.registro || response?.data || response;
}

export async function toggleSubCategoriaStatus(subcat: SubCategoriaItem): Promise<any> {
  const subId = Number(subcat.id);
  if (subcat.estado === 1) {
    return apiDelete<any>(`/productos/subcategorias/${subId}`);
  } else {
    return apiPatch<any>(`/productos/subcategorias/${subId}/activar`);
  }
}