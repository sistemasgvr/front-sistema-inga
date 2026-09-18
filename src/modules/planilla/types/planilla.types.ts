/**
 * Tipos del módulo de Planilla (M17).
 *
 * Alcance mínimo por pedido explícito del cliente: registrar trabajadores y
 * registrar sus pagos. No es RRHH — no hay contratos ni asistencia.
 *
 * El objetivo real es que el gasto de planilla entre al cuadre de caja y al
 * cálculo de rentabilidad del dashboard.
 */

export type EstadoRegistro = 1 | 0;

/** Medios de pago admitidos en planilla (catálogo MEDIO_PAGO, sin crédito). */
export const MEDIO_PAGO = {
  EFECTIVO: 1,
  YAPE: 2,
  TARJETA: 3,
} as const;

export const MEDIOS_PAGO_PLANILLA = [
  { valor: MEDIO_PAGO.EFECTIVO, etiqueta: "Efectivo", icono: "mdi:cash" },
  { valor: MEDIO_PAGO.YAPE, etiqueta: "Yape", icono: "mdi:cellphone" },
  {
    valor: MEDIO_PAGO.TARJETA,
    etiqueta: "Transferencia",
    icono: "mdi:bank-outline",
  },
] as const;

/**
 * Las dos quincenas del mes.
 *
 * Inga paga la 1ra el día 17 del mismo mes, y la 2da el día 2 del mes
 * siguiente. Por eso el backend deduce la quincena de la fecha de pago en vez
 * de pedirla: si el cajero la eligiera a mano, el 2 de octubre marcaría
 * "octubre" cuando en realidad paga la 2da quincena de septiembre.
 */
export const QUINCENAS = [
  { valor: 1, etiqueta: "1ra quincena", detalle: "Días 1 al 15 · se paga el 17" },
  { valor: 2, etiqueta: "2da quincena", detalle: "Días 16 a fin · se paga el 2" },
] as const;

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export type TrabajadorItem = {
  id: number;
  id_sucursal: number | null;
  nombre_sucursal: string | null;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  num_documento: string | null;
  puesto: string | null;
  sueldo_referencial: number;
  estado: EstadoRegistro;
  /** Lo pagado en el período consultado (por defecto, el mes actual). */
  pagado_periodo: number;
  pagos_periodo: number;
  /** Quincenas ya cobradas en el período: permite marcar "1ra ✓ / 2da pendiente". */
  quincenas_pagadas: number[] | null;
  ultimo_pago_fecha: string | null;
  ultimo_pago_monto: number | null;
  /** Solo llegan en el detalle (GET por id). */
  total_pagado_historico?: number;
  cantidad_pagos?: number;
  fecha_creacion?: string;
  fecha_modificacion?: string;
};

export type TrabajadorFormValues = {
  nombres: string;
  apellidos: string;
  num_documento: string;
  puesto: string;
  sueldo_referencial: number;
  id_sucursal: number | null;
};

export type TrabajadoresResumen = {
  total: number;
  activos: number;
  inactivos: number;
  anio: number;
  mes: number;
};

export type TrabajadorStatusFilter = "todos" | "activos" | "inactivos";

export type ListTrabajadoresParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: TrabajadorStatusFilter;
  anio?: number;
  mes?: number;
  quincena?: number;
};

export type ListTrabajadoresResult = {
  registros: TrabajadorItem[];
  total: number;
  resumen?: TrabajadoresResumen;
};

export type PagoItem = {
  id: number;
  id_trabajador: number;
  nombre_trabajador: string;
  puesto: string | null;
  num_documento?: string | null;
  fecha_pago: string;
  anio: number;
  mes: number;
  quincena: number;
  monto: number;
  medio_pago: number;
  medio_pago_nombre: string | null;
  id_turno: number | null;
  nombre_caja?: string | null;
  observacion: string | null;
  estado: EstadoRegistro;
  fecha_creacion: string;
};

export type PagoFormValues = {
  id_trabajador: number | null;
  monto: number;
  fecha_pago: string;
  medio_pago: number;
  id_turno: number | null;
  observacion: string;
};

export type PagosResumen = {
  monto_total: number;
  efectivo: number;
  yape: number;
  tarjeta: number;
  trabajadores_pagados: number;
  cantidad_pagos: number;
};

export type ListPagosParams = {
  pagina: number;
  limite: number;
  id_trabajador?: number;
  anio?: number;
  mes?: number;
  quincena?: number;
  medio_pago?: number;
};

export type ListPagosResult = {
  registros: PagoItem[];
  total: number;
  resumen?: PagosResumen;
};

/** Fila de la lista de pagados dentro del reporte de período. */
export type ReportePagado = {
  id_trabajador: number;
  nombre_trabajador: string;
  puesto: string | null;
  sueldo_referencial: number;
  monto_pagado: number;
  cantidad_pagos: number;
  quincenas: number[];
};

/** Fila de la lista de pendientes dentro del reporte de período. */
export type ReportePendiente = {
  id_trabajador: number;
  nombre_trabajador: string;
  puesto: string | null;
  sueldo_referencial: number;
};

export type ReportePeriodo = {
  anio: number;
  mes: number;
  quincena: number | null;
  monto_total: number;
  efectivo: number;
  yape: number;
  tarjeta: number;
  cantidad_pagados: number;
  cantidad_pendientes: number;
  /** Proyección según el sueldo referencial, no un monto exigible. */
  estimado_pendiente: number;
  pagados: ReportePagado[];
  pendientes: ReportePendiente[];
};
