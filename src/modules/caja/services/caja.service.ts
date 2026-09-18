import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  type ToggleStatusResult,
} from "@/shared/api/api-client";
import type {
  AbrirTurnoValues,
  ArqueoLinea,
  CajaFormValues,
  CajaItem,
  CajasResumen,
  ListCajasParams,
  ListCajasResult,
  ListTurnosParams,
  ListTurnosResult,
  MovimientoFormValues,
  MovimientoItem,
  ResumenTurno,
  TurnoItem,
  TurnosResumen,
} from "../types/caja.types";

/* ------------------------------- Cajas físicas ------------------------------ */

export async function listCajas(
  params: ListCajasParams,
): Promise<ListCajasResult> {
  const { data, meta } = await apiGetPaginated<CajaItem, CajasResumen>(
    "/caja/cajas",
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        buscar: params.buscar || undefined,
        estado: params.estado || "activos",
        id_sucursal: params.id_sucursal || undefined,
      },
    },
  );

  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

export async function createCaja(values: CajaFormValues): Promise<CajaItem> {
  return apiPost<CajaItem>("/caja/cajas", {
    id_sucursal: values.id_sucursal,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
  });
}

export async function updateCaja(
  id: number,
  values: CajaFormValues,
): Promise<CajaItem> {
  return apiPatch<CajaItem>(`/caja/cajas/${id}`, {
    id_sucursal: values.id_sucursal,
    codigo: values.codigo.trim().toUpperCase(),
    nombre: values.nombre.trim(),
  });
}

export async function toggleCajaStatus(
  caja: CajaItem,
): Promise<ToggleStatusResult> {
  if (caja.estado === 1) {
    return apiDelete<ToggleStatusResult>(`/caja/cajas/${caja.id}`);
  }
  return apiPatch<ToggleStatusResult>(`/caja/cajas/${caja.id}/activar`);
}

/* ---------------------------------- Turnos ---------------------------------- */

export async function listTurnos(
  params: ListTurnosParams,
): Promise<ListTurnosResult> {
  const { data, meta } = await apiGetPaginated<TurnoItem, TurnosResumen>(
    "/caja/turnos",
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        id_caja: params.id_caja || undefined,
        id_cajero: params.id_cajero || undefined,
        estado_turno: params.estado_turno || undefined,
        fecha_desde: params.fecha_desde || undefined,
        fecha_hasta: params.fecha_hasta || undefined,
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
 * Busca el turno abierto de un cajero.
 *
 * Devuelve `null` cuando no tiene ninguno, y eso NO es un error: es lo normal
 * al empezar el día. Por eso el endpoint responde `{ registro: null }` con 200
 * en vez de un 404, y acá simplemente lo desenvuelvo.
 */
export async function getTurnoAbierto(
  idCajero: number,
): Promise<TurnoItem | null> {
  const response = await apiGet<{ registro: TurnoItem | null }>(
    `/caja/turnos/abierto/${idCajero}`,
  );
  return response?.registro ?? null;
}

export async function getResumenTurno(idTurno: number): Promise<ResumenTurno> {
  return apiGet<ResumenTurno>(`/caja/turnos/${idTurno}/resumen`);
}

export async function abrirTurno(
  values: AbrirTurnoValues,
): Promise<TurnoItem> {
  return apiPost<TurnoItem>("/caja/turnos/abrir", {
    id_caja: values.id_caja,
    id_cajero: values.id_cajero,
    monto_apertura: values.monto_apertura,
    observacion: values.observacion?.trim() || undefined,
  });
}

export async function cerrarTurno(
  idTurno: number,
  montoDeclarado: number,
  observacion?: string,
): Promise<TurnoItem> {
  return apiPost<TurnoItem>(`/caja/turnos/${idTurno}/cerrar`, {
    monto_cierre_declarado: montoDeclarado,
    observacion: observacion?.trim() || undefined,
  });
}

/* ------------------------- Movimientos y arqueo ----------------------------- */

/**
 * Registra un ingreso o egreso.
 * Devuelve el turno actualizado porque el efectivo esperado acaba de cambiar
 * y la pantalla necesita refrescarlo.
 */
export async function registrarMovimiento(
  idTurno: number,
  values: MovimientoFormValues,
): Promise<TurnoItem> {
  return apiPost<TurnoItem>(`/caja/turnos/${idTurno}/movimientos`, {
    tipo_movimiento: values.tipo_movimiento,
    monto: values.monto,
    motivo: values.motivo.trim(),
  });
}

export async function listMovimientos(
  idTurno: number,
): Promise<{ registros: MovimientoItem[]; resumen: { ingresos: number; egresos: number; neto: number } }> {
  return apiGet(`/caja/turnos/${idTurno}/movimientos`);
}

export async function anularMovimiento(
  idMovimiento: number,
): Promise<ToggleStatusResult> {
  return apiDelete<ToggleStatusResult>(
    `/caja/turnos/movimientos/${idMovimiento}`,
  );
}

/**
 * Guarda el arqueo completo.
 *
 * Mando siempre todas las líneas, no solo las que cambiaron: el backend
 * reemplaza el conteo anterior. Si mandara solo las nuevas, las denominaciones
 * que el cajero puso en cero quedarían con el valor viejo.
 */
export async function guardarArqueo(
  idTurno: number,
  detalle: ArqueoLinea[],
): Promise<ResumenTurno> {
  return apiPost<ResumenTurno>(`/caja/turnos/${idTurno}/arqueo`, { detalle });
}
