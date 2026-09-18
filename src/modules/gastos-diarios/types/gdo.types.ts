/**
 * Tipos del módulo de Gastos Diarios Operativos (M14).
 *
 * Reemplaza el Excel de "Egresos Caja Día y Noche" y la hoja física de
 * "Requerimiento Diario": el registro ágil de las compras del día ligadas a la
 * cocina, con muchos ítems chicos y variados.
 *
 * No confundir con los Gastos Administrativos (M16), que son los de estructura
 * del negocio (alquiler, luz, internet).
 */

export type EstadoRegistro = 1 | 0;

/**
 * Forma de pago por línea.
 *
 * Ojo: NO es el catálogo MEDIO_PAGO. Acá el 3 es CRÉDITO (genera deuda al
 * proveedor), mientras que en MEDIO_PAGO el 3 es tarjeta. Son dominios
 * distintos y mezclarlos sería una trampa.
 */
export const FORMA_PAGO = {
  EFECTIVO: 1,
  YAPE: 2,
  CREDITO: 3,
} as const;

export const FORMAS_PAGO = [
  {
    valor: FORMA_PAGO.EFECTIVO,
    etiqueta: "Efectivo",
    detalle: "Sale del cajón",
    icono: "mdi:cash",
  },
  {
    valor: FORMA_PAGO.YAPE,
    etiqueta: "Yape",
    detalle: "No toca el cajón",
    icono: "mdi:cellphone",
  },
  {
    valor: FORMA_PAGO.CREDITO,
    etiqueta: "Crédito",
    detalle: "Genera deuda al proveedor",
    icono: "mdi:handshake-outline",
  },
] as const;

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export type InsumoItem = {
  id: number;
  id_categoria: number;
  nombre_categoria?: string;
  nombre: string;
  /** Último precio pagado. Solo sugiere el importe al comprar. */
  precio_referencial: number;
  id_proveedor_habitual: number | null;
  nombre_proveedor_habitual: string | null;
  estado: EstadoRegistro;
  veces_comprado?: number;
};

/** Una categoría con sus insumos anidados dentro. */
export type CategoriaInsumos = {
  id: number;
  codigo: string;
  nombre: string;
  orden: number;
  estado: EstadoRegistro;
  insumos: InsumoItem[];
};

export type InsumosResumen = {
  total: number;
  activos: number;
  inactivos: number;
  categorias: number;
};

export type InsumoFormValues = {
  id_categoria: number | null;
  nombre: string;
  precio_referencial: number;
  id_proveedor_habitual: number | null;
};

export type LineaGasto = {
  id: number;
  id_insumo: number;
  nombre_insumo: string;
  id_categoria: number;
  nombre_categoria: string;
  id_unidad_medida: number | null;
  nombre_unidad: string | null;
  simbolo_unidad: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  forma_pago: number;
  forma_pago_nombre: string;
  id_proveedor: number | null;
  nombre_proveedor: string | null;
  /** Cargo generado en CxP si la línea fue a crédito. */
  id_cxp_movimiento: number | null;
  observacion: string | null;
  estado: EstadoRegistro;
  fecha_creacion: string;
};

export type GastoDia = {
  id: number;
  id_sucursal: number | null;
  nombre_sucursal: string | null;
  id_turno: number | null;
  nombre_caja: string | null;
  estado_turno: number | null;
  fecha_gasto: string;
  anio: number;
  mes: number;
  total_efectivo: number;
  total_yape: number;
  total_credito: number;
  total_general: number;
  observacion: string | null;
  estado: EstadoRegistro;
  cantidad_items?: number;
};

/** Lo que devuelve abrir/obtener un día: cabecera + líneas. */
export type DiaConDetalle = {
  dia: GastoDia;
  detalle: LineaGasto[];
};

export type LineaFormValues = {
  id_insumo: number | null;
  cantidad: number;
  precio_unitario: number;
  forma_pago: number;
  id_unidad_medida: number | null;
  id_proveedor: number | null;
  observacion: string;
};

export type DiasResumen = {
  total_efectivo: number;
  total_yape: number;
  total_credito: number;
  total_general: number;
  dias: number;
};

export type ListDiasParams = {
  pagina: number;
  limite: number;
  anio?: number;
  mes?: number;
};

export type ListDiasResult = {
  registros: GastoDia[];
  total: number;
  resumen?: DiasResumen;
};

export type ReporteCategoria = {
  id_categoria: number;
  nombre_categoria: string;
  monto: number;
  cantidad: number;
};

export type ReporteProveedor = {
  id_persona: number;
  nombre_proveedor: string;
  monto: number;
  cantidad: number;
};

export type ReporteDia = {
  fecha_gasto: string;
  id_gasto_dia: number | null;
  total_efectivo: number;
  total_yape: number;
  total_credito: number;
  total_general: number;
  cantidad_items: number;
  por_categoria: ReporteCategoria[];
  /** Solo las compras a crédito: lo que suma deuda y se abona después. */
  por_proveedor: ReporteProveedor[];
};

/** Unidad de medida para el selector de la línea. */
export type UnidadMedida = {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string | null;
};
