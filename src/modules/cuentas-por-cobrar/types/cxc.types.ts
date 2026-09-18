/**
 * Tipos del módulo de Cuentas por Cobrar (M13).
 *
 * Es el espejo de CxP: allá Inga le debe a sus proveedores, acá el consorcio le
 * debe a Inga. Los trabajadores de las empresas del consorcio almuerzan a
 * crédito, el consumo se acumula por quincena, y a inicios del mes siguiente se
 * le manda el consolidado a cada empresa, que paga y luego se lo descuenta a su
 * gente por planilla.
 */

export type EstadoRegistro = 1 | 0;

/** Espejo de los tipos de cxc_movimiento. */
export const TIPO_MOVIMIENTO = {
  CONSUMO: 1,
  ABONO: 2,
  AJUSTE: 3,
} as const;

/**
 * La quincena es el corte del negocio: días 1-15 y 16-fin de mes.
 * No se elige al registrar (la base la deduce de la fecha), pero sí se filtra.
 */
export const QUINCENAS = [
  { valor: 1, etiqueta: "1ª quincena (1-15)" },
  { valor: 2, etiqueta: "2ª quincena (16-fin)" },
] as const;

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

/** Fila de la pantalla de saldos: cuánto nos debe cada cliente del consorcio. */
export type SaldoCliente = {
  id_persona: number;
  nombre: string;
  num_documento: string | null;
  id_convenio: number | null;
  convenio: string | null;
  /** Tope de crédito del convenio. 0 o null = sin tope definido. */
  limite_credito: number | null;
  /** Positivo = nos debe. Cero = al día. */
  saldo: number;
  total_cargos: number;
  total_abonos: number;
  ultimo_abono: string | null;
  /** El saldo pasó el tope del convenio. Advertencia, no bloqueo. */
  supera_limite: boolean;
  /** Cuánto le queda de crédito. `null` = sin tope definido. */
  credito_disponible: number | null;
  dias_sin_abonar: number | null;
};

export type SaldosResumenCxc = {
  deuda_total: number;
  clientes_con_deuda: number;
  clientes_total: number;
  clientes_sobre_limite: number;
};

export type ListSaldosCxcParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  solo_con_deuda?: boolean;
  id_convenio?: number;
};

export type ListSaldosCxcResult = {
  registros: SaldoCliente[];
  total: number;
  resumen?: SaldosResumenCxc;
};

export type MovimientoCxc = {
  id: number;
  id_persona: number;
  nombre_persona: string;
  num_documento?: string | null;
  id_convenio: number | null;
  nombre_convenio: string | null;
  tipo_movimiento: number;
  tipo_movimiento_nombre: string;
  monto: number;
  /** Foto del saldo justo después de este movimiento. */
  saldo_resultante: number;
  anio: number;
  mes: number;
  /** 1 = días 1-15, 2 = días 16-fin. */
  quincena: number;
  /** Pedido que lo originó, cuando viene de M12. */
  id_pedido: number | null;
  observacion: string | null;
  estado: EstadoRegistro;
  fecha_creacion: string;
  nombre_usuario_creacion?: string | null;
};

export type MovimientosResumenCxc = {
  total_cargos: number;
  total_abonos: number;
  saldo_periodo: number;
};

export type ListMovimientosCxcParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  id_persona?: number;
  id_convenio?: number;
  tipo_movimiento?: number;
  anio?: number;
  mes?: number;
  quincena?: number;
  incluir_anulados?: boolean;
};

export type ListMovimientosCxcResult = {
  registros: MovimientoCxc[];
  total: number;
  resumen?: MovimientosResumenCxc;
};

export type PeriodoCxc = {
  anio: number | null;
  mes: number | null;
  quincena: number | null;
};

export type EstadoCuentaCxc = {
  persona: SaldoCliente;
  periodo: PeriodoCxc;
  /** Saldo antes del período pedido. 0 cuando se trae el historial completo. */
  saldo_anterior: number;
  total_cargos: number;
  total_abonos: number;
  saldo_actual: number;
  /** Del más antiguo al más nuevo: un estado de cuenta se lee hacia abajo. */
  movimientos: MovimientoCxc[];
};

export type ConsumoFormValues = {
  id_persona: number | null;
  monto: number;
  fecha_movimiento: string;
  observacion: string;
};

export type AbonoCxcFormValues = {
  id_persona: number | null;
  monto: number;
  fecha_movimiento: string;
  observacion: string;
};

/** Un consumo registrado, más la advertencia de tope si la hubo. */
export type MovimientoConAdvertencia = MovimientoCxc & {
  supera_limite: boolean;
};

/** Línea de una persona dentro del reporte de la quincena. */
export type ReportePersona = {
  id_persona: number;
  nombre_persona: string;
  num_documento: string | null;
  consumo: number;
  abono: number;
  neto: number;
  cantidad_movimientos: number;
};

/** Una empresa del consorcio con el detalle de su gente. Es lo que se imprime. */
export type ReporteEmpresa = {
  id_convenio: number | null;
  nombre_convenio: string;
  total_consumo: number;
  total_abono: number;
  total_neto: number;
  cantidad_personas: number;
  personas: ReportePersona[];
};

export type ReporteCxc = {
  periodo: {
    anio: number;
    mes: number;
    quincena: number;
    etiqueta: string;
  };
  total_cargos: number;
  total_abonos: number;
  total_neto: number;
  empresas: ReporteEmpresa[];
};
