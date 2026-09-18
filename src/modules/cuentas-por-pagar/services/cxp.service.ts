import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPost,
  type ToggleStatusResult,
} from "@/shared/api/api-client";
import type {
  AbonoFormValues,
  CargoFormValues,
  EstadoCuenta,
  ListMovimientosParams,
  ListMovimientosResult,
  ListSaldosParams,
  ListSaldosResult,
  MovimientoCxp,
  MovimientosResumen,
  ReporteCxp,
  SaldoProveedor,
  SaldosResumen,
} from "../types/cxp.types";

const BASE = "/cuentas-por-pagar";

/**
 * Saldo deudor por proveedor, de mayor a menor deuda.
 *
 * `solo_con_deuda` distingue las dos vistas que hacen falta: el dashboard
 * quiere solo a quienes se les debe; la pantalla de proveedores los lista a
 * todos, incluidos los que están en cero.
 */
export async function listSaldos(
  params: ListSaldosParams,
): Promise<ListSaldosResult> {
  const { data, meta } = await apiGetPaginated<SaldoProveedor, SaldosResumen>(
    `${BASE}/saldos`,
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        buscar: params.buscar || undefined,
        solo_con_deuda: params.solo_con_deuda || undefined,
      },
    },
  );

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

export async function listMovimientos(
  params: ListMovimientosParams,
): Promise<ListMovimientosResult> {
  const { data, meta } = await apiGetPaginated<MovimientoCxp, MovimientosResumen>(
    `${BASE}/movimientos`,
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        id_persona: params.id_persona || undefined,
        tipo_movimiento: params.tipo_movimiento || undefined,
        anio: params.anio || undefined,
        mes: params.mes || undefined,
        semana: params.semana || undefined,
      },
    },
  );

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

/** Estado de cuenta de un proveedor: saldo, totales y últimos movimientos. */
export async function getEstadoCuenta(
  idPersona: number,
): Promise<EstadoCuenta> {
  return apiGet<EstadoCuenta>(`${BASE}/proveedores/${idPersona}`);
}

/**
 * Registra una compra a crédito (aumenta la deuda).
 *
 * Hoy se carga a mano; cuando exista M14, ese módulo llamará a este mismo
 * endpoint automáticamente al marcar un ítem como "a crédito".
 */
export async function registrarCargo(
  values: CargoFormValues,
): Promise<MovimientoCxp> {
  return apiPost<MovimientoCxp>(`${BASE}/cargos`, {
    id_persona: values.id_persona,
    monto: values.monto,
    fecha_movimiento: values.fecha_movimiento || undefined,
    num_comprobante: values.num_comprobante.trim() || undefined,
    observacion: values.observacion.trim() || undefined,
  });
}

/** Registra el abono semanal. No puede superar la deuda pendiente. */
export async function registrarAbono(
  values: AbonoFormValues,
): Promise<MovimientoCxp> {
  return apiPost<MovimientoCxp>(`${BASE}/abonos`, {
    id_persona: values.id_persona,
    monto: values.monto,
    medio_pago: values.medio_pago,
    id_turno: values.id_turno ?? undefined,
    fecha_movimiento: values.fecha_movimiento || undefined,
    num_comprobante: values.num_comprobante.trim() || undefined,
    observacion: values.observacion.trim() || undefined,
  });
}

/**
 * Ajuste manual del saldo. El monto lleva signo: positivo aumenta la deuda,
 * negativo la reduce. El motivo es obligatorio.
 */
export async function registrarAjuste(
  idPersona: number,
  monto: number,
  motivo: string,
): Promise<MovimientoCxp> {
  return apiPost<MovimientoCxp>(`${BASE}/ajustes`, {
    id_persona: idPersona,
    monto,
    motivo: motivo.trim(),
  });
}

/**
 * Anula un movimiento. El backend solo permite el último del proveedor:
 * anular uno del medio dejaría inconsistentes los saldos del historial.
 */
export async function anularMovimiento(
  id: number,
  motivo?: string,
): Promise<ToggleStatusResult> {
  return apiDelete<ToggleStatusResult>(`${BASE}/movimientos/${id}`, {
    data: { motivo: motivo?.trim() || undefined },
  });
}

/**
 * Reporte del período: cargos, abonos, desglose por proveedor y por semana.
 * Es la base del reporte exportable que pide el alcance.
 */
export async function getReportePeriodo(
  anio?: number,
  mes?: number,
): Promise<ReporteCxp> {
  return apiGet<ReporteCxp>(`${BASE}/reporte`, { params: { anio, mes } });
}
