import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  type ToggleStatusResult,
} from "@/shared/api/api-client";
import type {
  ListPagosParams,
  ListPagosResult,
  ListTrabajadoresParams,
  ListTrabajadoresResult,
  PagoFormValues,
  PagoItem,
  PagosResumen,
  ReportePeriodo,
  TrabajadorFormValues,
  TrabajadorItem,
  TrabajadoresResumen,
} from "../types/planilla.types";

/* ------------------------------ Trabajadores ------------------------------ */

export async function listTrabajadores(
  params: ListTrabajadoresParams,
): Promise<ListTrabajadoresResult> {
  const { data, meta } = await apiGetPaginated<
    TrabajadorItem,
    TrabajadoresResumen
  >("/planilla/trabajadores", {
    params: {
      pagina: params.pagina,
      limite: params.limite,
      buscar: params.buscar || undefined,
      estado: params.estado || "activos",
      anio: params.anio || undefined,
      mes: params.mes || undefined,
      quincena: params.quincena || undefined,
    },
  });

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

export async function createTrabajador(
  values: TrabajadorFormValues,
): Promise<TrabajadorItem> {
  return apiPost<TrabajadorItem>("/planilla/trabajadores", {
    nombres: values.nombres.trim(),
    apellidos: values.apellidos.trim(),
    // Mando `undefined` y no cadena vacía: la base distingue "sin dato" (null)
    // de un dato en blanco, y el documento es único cuando se informa.
    num_documento: values.num_documento.trim() || undefined,
    puesto: values.puesto.trim() || undefined,
    sueldo_referencial: values.sueldo_referencial,
    id_sucursal: values.id_sucursal ?? undefined,
  });
}

export async function updateTrabajador(
  id: number,
  values: TrabajadorFormValues,
): Promise<TrabajadorItem> {
  return apiPatch<TrabajadorItem>(`/planilla/trabajadores/${id}`, {
    nombres: values.nombres.trim(),
    apellidos: values.apellidos.trim(),
    num_documento: values.num_documento.trim() || undefined,
    puesto: values.puesto.trim() || undefined,
    sueldo_referencial: values.sueldo_referencial,
    id_sucursal: values.id_sucursal ?? undefined,
  });
}

export async function toggleTrabajadorStatus(
  trabajador: TrabajadorItem,
): Promise<ToggleStatusResult> {
  if (trabajador.estado === 1) {
    return apiDelete<ToggleStatusResult>(
      `/planilla/trabajadores/${trabajador.id}`,
    );
  }
  return apiPatch<ToggleStatusResult>(
    `/planilla/trabajadores/${trabajador.id}/activar`,
  );
}

/* --------------------------------- Pagos ---------------------------------- */

export async function listPagos(
  params: ListPagosParams,
): Promise<ListPagosResult> {
  const { data, meta } = await apiGetPaginated<PagoItem, PagosResumen>(
    "/planilla/pagos",
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        id_trabajador: params.id_trabajador || undefined,
        anio: params.anio || undefined,
        mes: params.mes || undefined,
        quincena: params.quincena || undefined,
        medio_pago: params.medio_pago || undefined,
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
 * Registra el pago de una quincena.
 *
 * No mando el período (año/mes/quincena): el backend lo deduce de la fecha de
 * pago. Es deliberado — si el cajero lo eligiera a mano, un pago del 2 de
 * octubre se cargaría a octubre cuando en realidad corresponde a la segunda
 * quincena de septiembre, y el gasto quedaría en el mes equivocado.
 */
export async function registrarPago(
  values: PagoFormValues,
): Promise<PagoItem> {
  return apiPost<PagoItem>("/planilla/pagos", {
    id_trabajador: values.id_trabajador,
    monto: values.monto,
    fecha_pago: values.fecha_pago || undefined,
    medio_pago: values.medio_pago,
    id_turno: values.id_turno ?? undefined,
    observacion: values.observacion.trim() || undefined,
  });
}

export async function anularPago(
  id: number,
  motivo?: string,
): Promise<ToggleStatusResult> {
  return apiDelete<ToggleStatusResult>(`/planilla/pagos/${id}`, {
    data: { motivo: motivo?.trim() || undefined },
  });
}

/**
 * Reporte del período: cuánto se pagó, a quién, y **a quién falta**.
 *
 * La lista de pendientes solo tiene sentido con una quincena concreta: sin
 * ella, "pendiente del mes" es ambiguo y el backend devuelve lista vacía.
 */
export async function getReportePeriodo(
  anio?: number,
  mes?: number,
  quincena?: number,
): Promise<ReportePeriodo> {
  return apiGet<ReportePeriodo>("/planilla/pagos/reporte", {
    params: { anio, mes, quincena },
  });
}
