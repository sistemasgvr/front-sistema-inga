import {
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
} from "@/shared/api/api-client";
import type { ToggleStatusResult } from "@/shared/api/api-client";
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
  const { data, meta } = await apiGetPaginated<CategoriaItem, CategoriasResumen>(
    "/productos/categorias",
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        buscar: params.buscar || undefined,
        estado: params.estado || "activos",
        es_carta: params.es_carta,
      },
    },
  );

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

export async function createCategoria(values: CategoriaFormValues): Promise<CategoriaItem> {
  const response = await apiPost<CategoriaItem>("/productos/categorias", {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
  return response;
}

export async function updateCategoria(
  id: number,
  values: CategoriaFormValues,
): Promise<CategoriaItem> {
  const response = await apiPatch<CategoriaItem>(`/productos/categorias/${id}`, {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  });
  return response;
}

export async function toggleCategoriaStatus(categoria: CategoriaItem): Promise<ToggleStatusResult> {
  const catId = Number(categoria.id);
  if (categoria.estado === 1) {
    return apiDelete<ToggleStatusResult>(`/productos/categorias/${catId}`);
  } else {
    return apiPatch<ToggleStatusResult>(`/productos/categorias/${catId}/activar`);
  }
}