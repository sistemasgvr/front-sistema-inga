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
  const queryParams: Record<string, any> = {
    pagina: params.pagina,
    limite: params.limite,
    estado: params.estado || "activos",
  };

  if (params.buscar && params.buscar.trim() !== "") {
    queryParams.buscar = params.buscar.trim();
  }

  // Si id_categoria tiene un valor válido, lo casteamos como Number
  if (params.id_categoria !== undefined && params.id_categoria !== null && params.id_categoria !== ("" as any)) {
    const parsedId = Number(params.id_categoria);
    if (!isNaN(parsedId) && parsedId > 0) {
      queryParams.id_categoria = parsedId;
    }
  }

  const { data, meta } = await apiGetPaginated<
    SubCategoriaItem,
    SubCategoriasResumen
  >("/productos/subcategorias", {
    params: queryParams,
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
    id_categoria: Number(values.id_categoria),
    orden: Number(values.orden ?? 0),
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
    id_categoria: Number(values.id_categoria),
    orden: Number(values.orden ?? 0),
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