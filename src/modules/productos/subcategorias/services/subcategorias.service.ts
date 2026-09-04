import {
  apiGetPaginated,
  apiPost,
  apiPatch,
  apiDelete,
} from "@/shared/api/api-client";
import type { ToggleStatusResult } from "@/shared/api/api-client";
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
  const { data, meta } = await apiGetPaginated<
    SubCategoriaItem,
    SubCategoriasResumen
  >("/productos/subcategorias", {
    params: {
      pagina: params.pagina,
      limite: params.limite,
      buscar: params.buscar || undefined,
      estado: params.estado || "activos",
      id_categoria: params.id_categoria || undefined,
    },
  });

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

export async function createSubCategoria(values: SubCategoriaFormValues): Promise<SubCategoriaItem> {
  const response = await apiPost<SubCategoriaItem>("/productos/subcategorias", {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
  });
  return response;
}

export async function updateSubCategoria(
  id: number,
  values: SubCategoriaFormValues,
): Promise<SubCategoriaItem> {
  const response = await apiPatch<SubCategoriaItem>(`/productos/subcategorias/${id}`, {
    ...values,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
  });
  return response;
}

export async function toggleSubCategoriaStatus(subcat: SubCategoriaItem): Promise<ToggleStatusResult> {
  const subId = Number(subcat.id);
  if (subcat.estado === 1) {
    return apiDelete<ToggleStatusResult>(`/productos/subcategorias/${subId}`);
  } else {
    return apiPatch<ToggleStatusResult>(`/productos/subcategorias/${subId}/activar`);
  }
}