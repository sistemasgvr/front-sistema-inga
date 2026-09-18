/**
 * Tipos del módulo de Cuentas por Pagar (M15).
 *
 * Es el espejo de CxC: allá el consorcio le debe a Inga, acá Inga le debe a sus
 * proveedores. Inga trabaja con 4 proveedores a crédito (pollo, pescado,
 * verduras y carnes) y les abona semanalmente.
 */

export type EstadoRegistro = 1 | 0;

/** Espejo de los tipos de cxc_movimiento. */
export const TIPO_MOVIMIENTO = {
  CARGO: 1,
  ABONO: 2,
  AJUSTE: 3,
} as const;

/** Catálogo MEDIO_PAGO. Sin crédito: el abono se paga al momento. */
export const MEDIO_PAGO = { EFECTIVO: 1, YAPE: 2, TARJETA: 3 } as const;

export const MEDIOS_PAGO_ABONO = [
  { valor: MEDIO_PAGO.EFECTIVO, etiqueta: "Efectivo", icono: "mdi:cash" },
  { valor: MEDIO_PAGO.YAPE, etiqueta: "Yape", icono: "mdi:cellphone" },
  { valor: MEDIO_PAGO.TARJETA, etiqueta: "Transferencia", icono: "mdi:bank-outline" },
] as const;

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

/** Fila de la pantalla de saldos: cuánto le debemos a cada proveedor. */
export type SaldoProveedor = {
  id_persona: number;
  nombre: string;
  num_documento: string | null;
  /** Positivo = le debemos. Cero = al día. */
  saldo: number;
  total_cargos: number;
  total_abonos: number;
  ultimo_abono: string | null;
  /** Días desde el último abono. `null` si nunca se le abonó. */
  dias_sin_abonar: number | null;
};

export type SaldosResumen = {
  deuda_total: number;
  proveedores_con_deuda: number;
  proveedores_total: number;
};

export type ListSaldosParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  solo_con_deuda?: boolean;
};

export type ListSaldosResult = {
  registros: SaldoProveedor[];
  total: number;
  resumen?: SaldosResumen;
};

export type MovimientoCxp = {
  id: number;
  id_persona: number;
  nombre_proveedor: string;
  num_documento?: string | null;
  tipo_movimiento: number;
  tipo_movimiento_nombre: string;
  monto: number;
  /** Foto del saldo justo después de este movimiento. */
  saldo_resultante: number;
  medio_pago: number | null;
  medio_pago_nombre: string | null;
  fecha_movimiento: string;
  anio: number;
  mes: number;
  /** Semana ISO. El corte con proveedores es semanal. */
  semana: number;
  num_comprobante: string | null;
  id_gasto_diario: number | null;
  id_turno: number | null;
  nombre_caja?: string | null;
  observacion: string | null;
  estado: EstadoRegistro;
  fecha_creacion: string;
};

export type MovimientosResumen = {
  total_cargos: number;
  total_abonos: number;
  abonos_efectivo: number;
  neto: number;
  cantidad: number;
};

export type ListMovimientosParams = {
  pagina: number;
  limite: number;
  id_persona?: number;
  tipo_movimiento?: number;
  anio?: number;
  mes?: number;
  semana?: number;
};

export type ListMovimientosResult = {
  registros: MovimientoCxp[];
  total: number;
  resumen?: MovimientosResumen;
};

export type EstadoCuenta = {
  proveedor: SaldoProveedor & {
    telefono: string | null;
    email: string | null;
  };
  movimientos: MovimientoCxp[];
};

export type CargoFormValues = {
  id_persona: number | null;
  monto: number;
  fecha_movimiento: string;
  num_comprobante: string;
  observacion: string;
};

export type AbonoFormValues = {
  id_persona: number | null;
  monto: number;
  medio_pago: number;
  id_turno: number | null;
  fecha_movimiento: string;
  num_comprobante: string;
  observacion: string;
};

/** Línea del desglose por proveedor dentro del reporte. */
export type ReporteProveedor = {
  id_persona: number;
  nombre_proveedor: string;
  cargos_periodo: number;
  abonos_periodo: number;
  /** El saldo vivo de hoy, no el del período. */
  saldo_actual: number;
};

/** Línea del desglose por semana: el ritmo real de pago a proveedores. */
export type ReporteSemana = {
  semana: number;
  desde: string;
  hasta: string;
  cargos: number;
  abonos: number;
};

export type ReporteCxp = {
  anio: number;
  mes: number;
  cargos_periodo: number;
  abonos_periodo: number;
  neto_periodo: number;
  /** Deuda acumulada de hoy, sin filtrar por período. */
  deuda_actual_total: number;
  por_proveedor: ReporteProveedor[];
  por_semana: ReporteSemana[];
};
