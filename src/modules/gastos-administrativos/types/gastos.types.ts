/**
 * Tipos del módulo de Gastos Administrativos (M16).
 *
 * Son los gastos que NO tienen que ver con preparar comida: alquiler, luz,
 * agua, internet, arreglos del local, útiles de oficina. Reemplazan la sección
 * de gastos administrativos del "Excel de flujo de caja mensual".
 *
 * No confundir con los Gastos Diarios Operativos (M14), que registran la compra
 * de insumos del día y pueden generar deuda a proveedor.
 */

export type EstadoRegistro = 1 | 0;

/** Fijo = se repite cada mes. Variable = puntual. */
export const TIPO_GASTO = { FIJO: 1, VARIABLE: 2 } as const;

export const TIPOS_GASTO = [
  {
    valor: TIPO_GASTO.FIJO,
    etiqueta: "Fijo",
    detalle: "Se repite cada mes: alquiler, luz, internet",
    icono: "mdi:calendar-sync-outline",
  },
  {
    valor: TIPO_GASTO.VARIABLE,
    etiqueta: "Variable",
    detalle: "Puntual: arreglos, útiles de oficina",
    icono: "mdi:calendar-question-outline",
  },
] as const;

/** Catálogo MEDIO_PAGO. Sin crédito: un gasto administrativo se paga al momento. */
export const MEDIO_PAGO = { EFECTIVO: 1, YAPE: 2, TARJETA: 3 } as const;

export const MEDIOS_PAGO_GASTO = [
  { valor: MEDIO_PAGO.EFECTIVO, etiqueta: "Efectivo", icono: "mdi:cash" },
  { valor: MEDIO_PAGO.YAPE, etiqueta: "Yape", icono: "mdi:cellphone" },
  { valor: MEDIO_PAGO.TARJETA, etiqueta: "Transferencia", icono: "mdi:bank-outline" },
] as const;

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export type CategoriaGasto = {
  id: number;
  id_categoria_padre?: number | null;
  nombre_categoria_padre?: string | null;
  codigo: string;
  nombre: string;
  tipo_gasto: number;
  tipo_gasto_nombre: string;
  orden: number;
  estado: EstadoRegistro;
  /** Cuántos gastos vigentes cuelgan de la categoría. Avisa antes de dar de baja. */
  gastos_registrados: number;
  subcategorias?: CategoriaGasto[];
  subcategorias_activas?: number;
};

export type CategoriaFormValues = {
  codigo: string;
  nombre: string;
  tipo_gasto: number;
  id_categoria_padre: number | null;
  orden: number;
};

export type CategoriasResumen = {
  total: number;
  fijos: number;
  variables: number;
  inactivos: number;
};

export type GastoItem = {
  id: number;
  id_categoria: number;
  nombre_categoria: string;
  codigo_categoria?: string;
  id_categoria_padre?: number | null;
  nombre_categoria_padre: string | null;
  tipo_gasto: number;
  tipo_gasto_nombre: string;
  concepto: string;
  monto: number;
  fecha_gasto: string;
  anio: number;
  mes: number;
  medio_pago: number;
  medio_pago_nombre: string | null;
  num_comprobante: string | null;
  id_persona: number | null;
  razon_social: string | null;
  id_turno: number | null;
  nombre_caja?: string | null;
  observacion: string | null;
  estado: EstadoRegistro;
  fecha_creacion: string;
};

export type GastoFormValues = {
  id_categoria: number | null;
  concepto: string;
  monto: number;
  fecha_gasto: string;
  medio_pago: number;
  id_turno: number | null;
  num_comprobante: string;
  observacion: string;
};

export type GastosResumen = {
  monto_total: number;
  fijos: number;
  variables: number;
  efectivo: number;
  yape: number;
  tarjeta: number;
  cantidad: number;
};

export type ListGastosParams = {
  buscar?: string;
  pagina: number;
  limite: number;
  id_categoria?: number;
  tipo_gasto?: number;
  anio?: number;
  mes?: number;
  medio_pago?: number;
};

export type ListGastosResult = {
  registros: GastoItem[];
  total: number;
  resumen?: GastosResumen;
};

/** Línea del desglose por categoría dentro del reporte mensual. */
export type ReporteCategoria = {
  id_categoria: number;
  nombre_categoria: string;
  tipo_gasto: number;
  tipo_gasto_nombre: string;
  monto: number;
  cantidad: number;
  detalle: { nombre: string; monto: number; concepto: string }[];
};

export type ReporteMensual = {
  anio: number;
  mes: number;
  monto_total: number;
  fijos: number;
  variables: number;
  efectivo: number;
  yape: number;
  tarjeta: number;
  cantidad: number;
  total_mes_anterior: number;
  /** `null` cuando el mes anterior no tuvo gastos: un 0% sería engañoso. */
  variacion_porcentual: number | null;
  por_categoria: ReporteCategoria[];
};
