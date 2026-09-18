import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  type ToggleStatusResult,
} from "@/shared/api/api-client";
import type {
  CategoriaInsumos,
  DiaConDetalle,
  GastoDia,
  DiasResumen,
  InsumoFormValues,
  InsumoItem,
  InsumosResumen,
  LineaFormValues,
  ListDiasParams,
  ListDiasResult,
  ReporteDia,
} from "../types/gdo.types";

const BASE = "/gastos-diarios";

/* -------------------------------- Insumos -------------------------------- */

/**
 * Lista maestra de insumos, agrupada por categoría y sin paginar.
 *
 * Son los ~200 productos de la hoja física del cliente. El formulario de
 * registro rápido los necesita todos a mano para que el cajero busque y elija
 * sin ir al servidor en cada tecla.
 */
export async function listInsumos(
  buscar = "",
  idCategoria?: number,
  estado: "todos" | "activos" | "inactivos" = "activos",
): Promise<{ registros: CategoriaInsumos[]; resumen: InsumosResumen }> {
  const response = await apiGet<{
    registros: CategoriaInsumos[];
    resumen: InsumosResumen;
  }>(`${BASE}/insumos`, {
    params: {
      buscar: buscar || undefined,
      id_categoria: idCategoria || undefined,
      estado,
    },
  });

  return {
    registros: response?.registros ?? [],
    resumen: response?.resumen ?? {
      total: 0,
      activos: 0,
      inactivos: 0,
      categorias: 0,
    },
  };
}

/**
 * Crea un insumo.
 *
 * Lo usan dos sitios: el mantenimiento de la lista y el propio formulario de
 * compra, para crear "al vuelo" lo que no está en la lista — que es lo que el
 * alcance pide explícitamente.
 */
export async function createInsumo(
  values: InsumoFormValues,
): Promise<InsumoItem> {
  return apiPost<InsumoItem>(`${BASE}/insumos`, {
    id_categoria: values.id_categoria,
    nombre: values.nombre.trim(),
    precio_referencial: values.precio_referencial,
    id_proveedor_habitual: values.id_proveedor_habitual ?? undefined,
  });
}

export async function updateInsumo(
  id: number,
  values: InsumoFormValues,
): Promise<InsumoItem> {
  return apiPatch<InsumoItem>(`${BASE}/insumos/${id}`, {
    id_categoria: values.id_categoria,
    nombre: values.nombre.trim(),
    precio_referencial: values.precio_referencial,
    id_proveedor_habitual: values.id_proveedor_habitual ?? undefined,
    // Si el formulario dejó el proveedor en blanco, hay que decirlo explícito:
    // mandar el id vacío significa "no lo cambies", no "quítalo".
    quitar_proveedor: values.id_proveedor_habitual === null,
  });
}

export async function toggleInsumo(id: number): Promise<ToggleStatusResult> {
  return apiDelete<ToggleStatusResult>(`${BASE}/insumos/${id}`);
}

/* ------------------------------ Gasto del día ---------------------------- */

/**
 * Abre el gasto del día, o lo devuelve si ya existe.
 *
 * Es idempotente a propósito: el cajero no debería pensar en "crear el día",
 * simplemente entra a la pantalla y si es la primera compra el día se crea solo.
 */
export async function abrirDia(
  fechaGasto?: string,
  idSucursal?: number,
  idTurno?: number,
): Promise<DiaConDetalle> {
  return apiPost<DiaConDetalle>(`${BASE}/dias/abrir`, {
    fecha_gasto: fechaGasto || undefined,
    id_sucursal: idSucursal ?? undefined,
    id_turno: idTurno ?? undefined,
  });
}

export async function getDia(id: number): Promise<DiaConDetalle> {
  return apiGet<DiaConDetalle>(`${BASE}/dias/${id}`);
}

export async function listDias(
  params: ListDiasParams,
): Promise<ListDiasResult> {
  const { data, meta } = await apiGetPaginated<GastoDia, DiasResumen>(
    `${BASE}/dias`,
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        anio: params.anio || undefined,
        mes: params.mes || undefined,
      },
    },
  );

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

/**
 * Agrega una compra al día.
 *
 * Si la línea va a crédito, el backend genera **automáticamente** la deuda al
 * proveedor en Cuentas por Pagar (M15). Por eso devuelve el día completo: los
 * totales acaban de cambiar.
 */
export async function agregarLinea(
  idGastoDia: number,
  values: LineaFormValues,
): Promise<DiaConDetalle> {
  return apiPost<DiaConDetalle>(`${BASE}/dias/${idGastoDia}/lineas`, {
    id_insumo: values.id_insumo,
    cantidad: values.cantidad,
    precio_unitario: values.precio_unitario,
    forma_pago: values.forma_pago,
    id_unidad_medida: values.id_unidad_medida ?? undefined,
    id_proveedor: values.id_proveedor ?? undefined,
    observacion: values.observacion.trim() || undefined,
  });
}

/** Anula una compra. Si era a crédito, revierte la deuda generada en CxP. */
export async function anularLinea(
  id: number,
  motivo?: string,
): Promise<DiaConDetalle> {
  return apiDelete<DiaConDetalle>(`${BASE}/lineas/${id}`, {
    data: { motivo: motivo?.trim() || undefined },
  });
}

/**
 * Cuadre del día: totales por forma de pago, desglose por categoría y por
 * proveedor a crédito. Es lo que hoy hacen a mano en el Excel de egresos.
 */
export async function getReporteDia(
  fechaGasto?: string,
  idSucursal?: number,
): Promise<ReporteDia> {
  return apiGet<ReporteDia>(`${BASE}/dias/reporte`, {
    params: { fecha_gasto: fechaGasto, id_sucursal: idSucursal },
  });
}
