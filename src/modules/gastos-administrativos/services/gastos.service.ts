import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  type ToggleStatusResult,
} from "@/shared/api/api-client";
import type {
  CategoriaFormValues,
  CategoriaGasto,
  CategoriasResumen,
  GastoFormValues,
  GastoItem,
  GastosResumen,
  ListGastosParams,
  ListGastosResult,
  ReporteMensual,
} from "../types/gastos.types";

const BASE = "/gastos-administrativos";

/* ------------------------------- Categorías ------------------------------- */

/**
 * Trae el árbol completo de categorías.
 *
 * No está paginado: son pocas y el formulario de gasto necesita el árbol entero
 * para armar su selector agrupado ("Servicios → Luz / Agua / Internet").
 */
export async function listCategorias(
  tipoGasto?: number,
  estado: "todos" | "activos" | "inactivos" = "activos",
): Promise<{ registros: CategoriaGasto[]; resumen: CategoriasResumen }> {
  const response = await apiGet<{
    registros: CategoriaGasto[];
    resumen: CategoriasResumen;
  }>(`${BASE}/categorias`, {
    params: { tipo_gasto: tipoGasto || undefined, estado },
  });

  return {
    registros: response?.registros ?? [],
    resumen: response?.resumen ?? {
      total: 0,
      fijos: 0,
      variables: 0,
      inactivos: 0,
    },
  };
}

export async function createCategoria(
  values: CategoriaFormValues,
): Promise<CategoriaGasto> {
  return apiPost<CategoriaGasto>(`${BASE}/categorias`, {
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    tipo_gasto: values.tipo_gasto,
    id_categoria_padre: values.id_categoria_padre ?? undefined,
    orden: values.orden,
  });
}

export async function updateCategoria(
  id: number,
  values: CategoriaFormValues,
): Promise<CategoriaGasto> {
  return apiPatch<CategoriaGasto>(`${BASE}/categorias/${id}`, {
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
    tipo_gasto: values.tipo_gasto,
    orden: values.orden,
  });
}

export async function toggleCategoriaStatus(
  categoria: CategoriaGasto,
): Promise<ToggleStatusResult> {
  if (categoria.estado === 1) {
    return apiDelete<ToggleStatusResult>(`${BASE}/categorias/${categoria.id}`);
  }
  return apiPatch<ToggleStatusResult>(
    `${BASE}/categorias/${categoria.id}/activar`,
  );
}

/* --------------------------------- Gastos --------------------------------- */

export async function listGastos(
  params: ListGastosParams,
): Promise<ListGastosResult> {
  const { data, meta } = await apiGetPaginated<GastoItem, GastosResumen>(BASE, {
    params: {
      pagina: params.pagina,
      limite: params.limite,
      buscar: params.buscar || undefined,
      id_categoria: params.id_categoria || undefined,
      tipo_gasto: params.tipo_gasto || undefined,
      anio: params.anio || undefined,
      mes: params.mes || undefined,
      medio_pago: params.medio_pago || undefined,
    },
  });

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

/**
 * Registra un gasto.
 *
 * No mando el período: el backend lo deriva de `fecha_gasto`. A diferencia de
 * planilla, acá la regla es directa (un gasto del 5 de octubre es de octubre),
 * pero lo dejo del lado del servidor igual para que el reporte y la fecha nunca
 * puedan desincronizarse.
 */
export async function registrarGasto(
  values: GastoFormValues,
): Promise<GastoItem> {
  return apiPost<GastoItem>(BASE, {
    id_categoria: values.id_categoria,
    concepto: values.concepto.trim(),
    monto: values.monto,
    fecha_gasto: values.fecha_gasto || undefined,
    medio_pago: values.medio_pago,
    id_turno: values.id_turno ?? undefined,
    num_comprobante: values.num_comprobante.trim() || undefined,
    observacion: values.observacion.trim() || undefined,
  });
}

export async function updateGasto(
  id: number,
  values: GastoFormValues,
): Promise<GastoItem> {
  return apiPatch<GastoItem>(`${BASE}/${id}`, {
    id_categoria: values.id_categoria,
    concepto: values.concepto.trim(),
    monto: values.monto,
    fecha_gasto: values.fecha_gasto || undefined,
    medio_pago: values.medio_pago,
    num_comprobante: values.num_comprobante.trim() || undefined,
    observacion: values.observacion.trim() || undefined,
  });
}

export async function anularGasto(
  id: number,
  motivo?: string,
): Promise<ToggleStatusResult> {
  return apiDelete<ToggleStatusResult>(`${BASE}/${id}`, {
    data: { motivo: motivo?.trim() || undefined },
  });
}

/**
 * Reporte mensual: totales por tipo y medio, desglose por categoría y
 * comparación contra el mes anterior.
 *
 * Es el número que alimenta el cálculo de rentabilidad del dashboard:
 * ventas − insumos (M14) − planilla (M17) − administrativos (este).
 */
export async function getReporteMensual(
  anio?: number,
  mes?: number,
): Promise<ReporteMensual> {
  return apiGet<ReporteMensual>(`${BASE}/reporte`, { params: { anio, mes } });
}
