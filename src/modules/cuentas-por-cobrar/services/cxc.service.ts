import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPost,
} from "@/shared/api/api-client";
import type {
  AbonoCxcFormValues,
  ConsumoFormValues,
  EstadoCuentaCxc,
  ListMovimientosCxcParams,
  ListMovimientosCxcResult,
  ListSaldosCxcParams,
  ListSaldosCxcResult,
  MovimientoConAdvertencia,
  MovimientoCxc,
  MovimientosResumenCxc,
  ReporteCxc,
  SaldoCliente,
  SaldosResumenCxc,
} from "../types/cxc.types";

const BASE = "/cuentas-por-cobrar";

/**
 * Saldo por cliente del consorcio, de mayor a menor deuda.
 *
 * `solo_con_deuda` distingue las dos vistas que hacen falta: el dashboard
 * quiere solo a quienes nos deben; la pantalla los lista a todos, incluidos los
 * que están en cero.
 *
 * `id_convenio` filtra por empresa, que es la unidad en la que se factura.
 */
export async function listSaldos(
  params: ListSaldosCxcParams,
): Promise<ListSaldosCxcResult> {
  const { data, meta } = await apiGetPaginated<SaldoCliente, SaldosResumenCxc>(
    `${BASE}/saldos`,
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        buscar: params.buscar || undefined,
        solo_con_deuda: params.solo_con_deuda || undefined,
        id_convenio: params.id_convenio || undefined,
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
  params: ListMovimientosCxcParams,
): Promise<ListMovimientosCxcResult> {
  const { data, meta } = await apiGetPaginated<
    MovimientoCxc,
    MovimientosResumenCxc
  >(`${BASE}/movimientos`, {
    params: {
      pagina: params.pagina,
      limite: params.limite,
      buscar: params.buscar || undefined,
      id_persona: params.id_persona || undefined,
      id_convenio: params.id_convenio || undefined,
      tipo_movimiento: params.tipo_movimiento || undefined,
      anio: params.anio || undefined,
      mes: params.mes || undefined,
      quincena: params.quincena || undefined,
      incluir_anulados: params.incluir_anulados || undefined,
    },
  });

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

/**
 * Estado de cuenta de un cliente. Sin período trae el historial completo; con
 * período, la quincena que se está conciliando más el saldo anterior, para que
 * el papel cuadre.
 */
export async function getEstadoCuenta(
  idPersona: number,
  periodo?: { anio?: number; mes?: number; quincena?: number },
): Promise<EstadoCuentaCxc> {
  return apiGet<EstadoCuentaCxc>(`${BASE}/clientes/${idPersona}`, {
    params: {
      anio: periodo?.anio || undefined,
      mes: periodo?.mes || undefined,
      quincena: periodo?.quincena || undefined,
    },
  });
}

/**
 * Registra un consumo a crédito (aumenta la deuda).
 *
 * Hoy se carga a mano; cuando exista M12, ese módulo llamará a este mismo
 * endpoint al cobrar un pedido con medio de pago "crédito".
 *
 * Devuelve `supera_limite`: pasar el tope del convenio advierte, no bloquea.
 * Quien llame a esta función tiene que mostrar esa advertencia, porque es lo
 * único que avisa.
 */
export async function registrarConsumo(
  values: ConsumoFormValues,
): Promise<MovimientoConAdvertencia> {
  return apiPost<MovimientoConAdvertencia>(`${BASE}/consumos`, {
    id_persona: values.id_persona,
    monto: values.monto,
    fecha_movimiento: values.fecha_movimiento || undefined,
    observacion: values.observacion.trim() || undefined,
  });
}

/**
 * Registra el pago de la empresa o el descuento por planilla.
 * No puede superar la deuda pendiente.
 */
export async function registrarAbono(
  values: AbonoCxcFormValues,
): Promise<MovimientoCxc> {
  return apiPost<MovimientoCxc>(`${BASE}/abonos`, {
    id_persona: values.id_persona,
    monto: values.monto,
    fecha_movimiento: values.fecha_movimiento || undefined,
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
): Promise<MovimientoCxc> {
  return apiPost<MovimientoCxc>(`${BASE}/ajustes`, {
    id_persona: idPersona,
    monto,
    motivo: motivo.trim(),
  });
}

/**
 * Anula un movimiento (borrado lógico). El backend no deja anular consumos que
 * vienen de un pedido ni quincenas ya cerradas: para eso está el ajuste.
 * Devuelve el movimiento ya anulado, no una bandera.
 */
export async function anularMovimiento(
  id: number,
  motivo?: string,
): Promise<MovimientoCxc> {
  return apiDelete<MovimientoCxc>(`${BASE}/movimientos/${id}`, {
    data: { motivo: motivo?.trim() || undefined },
  });
}

/**
 * Reporte de la quincena agrupado por empresa, con el detalle de cada
 * trabajador. Es el entregable del módulo: lo que se le envía a cada empresa
 * del consorcio a inicios de mes.
 *
 * Sin período, usa la quincena en curso.
 */
export async function getReportePeriodo(params?: {
  anio?: number;
  mes?: number;
  quincena?: number;
  id_convenio?: number;
}): Promise<ReporteCxc> {
  return apiGet<ReporteCxc>(`${BASE}/reporte`, {
    params: {
      anio: params?.anio || undefined,
      mes: params?.mes || undefined,
      quincena: params?.quincena || undefined,
      id_convenio: params?.id_convenio || undefined,
    },
  });
}
