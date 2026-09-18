/**
 * Tipos del módulo de caja y turnos (M11).
 *
 * El flujo es: se abre un turno sobre una caja física, durante el turno entran
 * las ventas y los movimientos manuales, y al final se cuenta el efectivo y se
 * cierra comparando lo contado contra lo que el sistema esperaba.
 */

export type EstadoRegistro = 1 | 0;

/** Catálogo TURNO_ESTADO. */
export const ESTADO_TURNO = { ABIERTO: 1, CERRADO: 2 } as const;

/** Catálogo CAJA_MOV_TIPO. */
export const TIPO_MOVIMIENTO = { INGRESO: 1, EGRESO: 2 } as const;

/**
 * Denominaciones del sol peruano, de mayor a menor.
 * Las tengo acá para armar la tabla de arqueo sin que el cajero tenga que
 * escribir cada valor: solo pone cuántos tiene de cada uno.
 */
export const DENOMINACIONES_SOLES = [
  200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1,
] as const;

export type CajaItem = {
  id: number;
  id_sucursal: number;
  nombre_sucursal: string;
  codigo: string;
  nombre: string;
  estado: EstadoRegistro;
  /** Datos del turno en curso, si la caja está tomada. */
  tiene_turno_abierto: boolean;
  id_turno_abierto: number | null;
  turno_fecha_apertura: string | null;
  turno_monto_apertura: number | null;
  turno_id_cajero: number | null;
  turno_cajero: string | null;
  fecha_creacion?: string;
  fecha_modificacion?: string;
};

export type CajaFormValues = {
  id_sucursal: number | null;
  codigo: string;
  nombre: string;
};

export type CajasResumen = {
  total: number;
  activos: number;
  inactivos: number;
  /** Cuántas cajas tienen un turno abierto ahora mismo. */
  abiertas: number;
};

export type CajaStatusFilter = "todos" | "activos" | "inactivos";

export type ListCajasParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  estado?: CajaStatusFilter;
  id_sucursal?: number;
};

export type ListCajasResult = {
  registros: CajaItem[];
  total: number;
  resumen?: CajasResumen;
};

export type TurnoItem = {
  id: number;
  id_caja: number;
  codigo_caja: string;
  nombre_caja: string;
  id_sucursal?: number;
  nombre_sucursal?: string;
  id_cajero: number;
  nombre_cajero: string;
  monto_apertura: number;
  fecha_apertura: string;
  monto_cierre_sistema: number | null;
  monto_cierre_declarado: number | null;
  /** Positiva = sobrante, negativa = faltante. */
  monto_diferencia: number | null;
  fecha_cierre: string | null;
  estado_turno: number;
  estado_turno_nombre: string | null;
  observacion: string | null;
  estado: EstadoRegistro;

  // Totales calculados que llegan solo en el detalle (obtener / resumen).
  ventas_efectivo?: number;
  ventas_yape?: number;
  ventas_tarjeta?: number;
  ventas_credito?: number;
  total_ventas?: number;
  ingresos_caja?: number;
  egresos_caja?: number;
  /** Lo que debería haber en el cajón: apertura + efectivo + ingresos − egresos. */
  efectivo_esperado?: number;
};

export type MovimientoItem = {
  id: number;
  id_turno?: number;
  tipo_movimiento: number;
  tipo_movimiento_nombre: string | null;
  monto: number;
  motivo: string;
  id_usuario_autoriza: number | null;
  nombre_autoriza: string | null;
  nombre_registra?: string | null;
  fecha_creacion: string;
};

export type ArqueoLinea = {
  denominacion: number;
  cantidad: number;
};

export type ArqueoItem = ArqueoLinea & {
  id: number;
  monto_subtotal: number;
};

export type ResumenTurno = {
  turno: TurnoItem;
  movimientos: MovimientoItem[];
  arqueo: ArqueoItem[];
  /** Suma de lo contado físicamente. */
  total_arqueo: number;
};

export type TurnosResumen = {
  abiertos: number;
  cerrados: number;
  con_descuadre: number;
};

export type ListTurnosParams = {
  pagina: number;
  limite: number;
  id_caja?: number;
  id_cajero?: number;
  estado_turno?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
};

export type ListTurnosResult = {
  registros: TurnoItem[];
  total: number;
  resumen?: TurnosResumen;
};

export type AbrirTurnoValues = {
  id_caja: number;
  id_cajero: number;
  monto_apertura: number;
  observacion?: string;
};

export type MovimientoFormValues = {
  tipo_movimiento: number;
  monto: number;
  motivo: string;
};
