import type {
  CuentaReporte,
  GastoAdministrativo,
  GastoDiarioDia,
  Granularidad,
  PagoPlanilla,
  ProductoVendido,
  ResumenVentas,
  StockReporte,
  TurnoReporte,
  VentaPorDia,
  VentaPorDiaSemana,
  VentaPorHora,
} from "../types/reportes.types";

/**
 * Cálculos del dashboard y de la reportería.
 *
 * La API entrega sumas y filas; aquí se derivan los indicadores (márgenes,
 * utilidad, ticket promedio, agrupaciones). Todo es puro y sin dependencias
 * para que el gráfico, la tabla y el CSV usen exactamente la misma cifra.
 */

const DIA_MS = 24 * 60 * 60 * 1000;

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

export const DIAS_SEMANA_LARGOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const TIPOS_PEDIDO: Record<number, string> = {
  1: "Mesa",
  2: "Para llevar",
  3: "Delivery",
};

export const etiquetaTipoPedido = (tipo: number) => TIPOS_PEDIDO[tipo] ?? `Tipo ${tipo}`;

/** Redondeo comercial a `decimales` (2 por defecto), sin el error de 1.005. */
export function redondear(valor: number, decimales = 2): number {
  const factor = 10 ** decimales;
  const n = Number(valor) || 0;
  return Math.round((n + Math.sign(n) * Number.EPSILON) * factor) / factor;
}

/** Suma un campo numérico; los valores nulos o no numéricos cuentan como 0. */
export function sumar<T>(filas: readonly T[], valor: (fila: T) => number | null | undefined): number {
  let total = 0;
  for (const fila of filas) total += Number(valor(fila)) || 0;
  return redondear(total);
}

/** Porcentaje con un decimal; 0 cuando la base es 0 para no mostrar NaN o Infinity. */
export function porcentaje(parte: number, total: number): number {
  if (!total) return 0;
  return redondear((parte / total) * 100, 1);
}

/** Costo de un producto vendido: unidades (incluye cortesías) por costo unitario. */
export const costoProducto = (p: ProductoVendido) => redondear(p.cantidad * p.costo_unitario);

export type ProductoRentabilidad = ProductoVendido & {
  costo_total: number;
  margen: number;
  margen_pct: number;
  precio_promedio: number;
};

/** Margen de un plato sobre su venta sin IGV. */
export function rentabilidadProducto(p: ProductoVendido): ProductoRentabilidad {
  const costo_total = costoProducto(p);
  const margen = redondear(p.monto_neto - costo_total);
  const vendidas = p.cantidad - p.cortesias;
  return {
    ...p,
    costo_total,
    margen,
    margen_pct: porcentaje(margen, p.monto_neto),
    precio_promedio: vendidas > 0 ? redondear(p.monto / vendidas) : 0,
  };
}

export const costoVentas = (productos: readonly ProductoVendido[]) => sumar(productos, costoProducto);

export type EstadoResultados = {
  cantidad_ventas: number;
  comensales: number;
  ventas_brutas: number;
  igv: number;
  ventas_netas: number;
  descuentos: number;
  costo_ventas: number;
  margen_bruto: number;
  margen_bruto_pct: number;
  gastos_diarios: number;
  gastos_administrativos: number;
  planilla: number;
  total_gastos: number;
  utilidad_operativa: number;
  utilidad_pct: number;
  ticket_promedio: number;
  consumo_por_comensal: number;
};

/**
 * Estado de resultados del período, en dos niveles:
 * - Margen bruto = ventas sin IGV − costo de receta de lo vendido.
 * - Utilidad operativa = ventas sin IGV − (compras del día + gastos
 *   administrativos + planilla), es decir, lo que realmente salió.
 * No se restan los dos a la vez: el costo de receta y las compras del día
 * miden el mismo insumo de dos formas y se duplicaría.
 */
export function estadoResultados(datos: {
  resumen_ventas: ResumenVentas;
  productos: readonly ProductoVendido[];
  gastos_diarios: readonly GastoDiarioDia[];
  gastos_administrativos: readonly GastoAdministrativo[];
  planilla: readonly PagoPlanilla[];
}): EstadoResultados {
  const r = datos.resumen_ventas;
  const ventas_brutas = redondear(r.total);
  const igv = redondear(r.igv);
  const ventas_netas = redondear(ventas_brutas - igv);
  const costo_ventas = costoVentas(datos.productos);
  const margen_bruto = redondear(ventas_netas - costo_ventas);
  const gastos_diarios = sumar(datos.gastos_diarios, (g) => g.total);
  const gastos_administrativos = sumar(datos.gastos_administrativos, (g) => g.monto);
  const planilla = sumar(datos.planilla, (p) => p.monto);
  const total_gastos = redondear(gastos_diarios + gastos_administrativos + planilla);
  const utilidad_operativa = redondear(ventas_netas - total_gastos);
  return {
    cantidad_ventas: r.cantidad,
    comensales: r.comensales,
    ventas_brutas,
    igv,
    ventas_netas,
    descuentos: redondear(r.descuentos),
    costo_ventas,
    margen_bruto,
    margen_bruto_pct: porcentaje(margen_bruto, ventas_netas),
    gastos_diarios,
    gastos_administrativos,
    planilla,
    total_gastos,
    utilidad_operativa,
    utilidad_pct: porcentaje(utilidad_operativa, ventas_netas),
    ticket_promedio: r.cantidad ? redondear(ventas_brutas / r.cantidad) : 0,
    consumo_por_comensal: r.comensales ? redondear(ventas_brutas / r.comensales) : 0,
  };
}

/* --------------------------------- Fechas --------------------------------- */

const aUtc = (ymd: string) => Date.parse(`${ymd}T00:00:00Z`);
const aYmdUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Todos los días del rango, ambos inclusive; vacío si el rango no es válido. */
export function diasDelRango(desde: string, hasta: string): string[] {
  const inicio = aUtc(desde);
  const fin = aUtc(hasta);
  if (Number.isNaN(inicio) || Number.isNaN(fin) || inicio > fin) return [];
  const dias: string[] = [];
  for (let t = inicio; t <= fin; t += DIA_MS) dias.push(aYmdUtc(t));
  return dias;
}

/** Lunes de la semana (ISO) a la que pertenece el día. */
export function lunesDeSemana(ymd: string): string {
  const t = aUtc(ymd);
  const diaIso = (new Date(t).getUTCDay() + 6) % 7;
  return aYmdUtc(t - diaIso * DIA_MS);
}

export function clavePeriodo(ymd: string, granularidad: Granularidad): string {
  if (granularidad === "mes") return ymd.slice(0, 7);
  if (granularidad === "semana") return lunesDeSemana(ymd);
  return ymd;
}

export function etiquetaPeriodo(clave: string, granularidad: Granularidad): string {
  if (granularidad === "mes") {
    const [anio, mes] = clave.split("-");
    return `${MESES_CORTOS[Number(mes) - 1] ?? mes} ${anio}`;
  }
  const [, mes, dia] = clave.split("-");
  return granularidad === "semana" ? `Sem. ${dia}/${mes}` : `${dia}/${mes}`;
}

export type PuntoSerie = { clave: string; etiqueta: string; valores: Record<string, number> };

/**
 * Agrupa filas fechadas por día, semana o mes, completando con 0 los períodos
 * sin movimiento para que el eje no salte días.
 */
export function agruparPorPeriodo<T extends { fecha: string }>(
  desde: string,
  hasta: string,
  granularidad: Granularidad,
  filas: readonly T[],
  campos: Record<string, (fila: T) => number>,
): PuntoSerie[] {
  const puntos = new Map<string, PuntoSerie>();
  const nombres = Object.keys(campos);
  for (const dia of diasDelRango(desde, hasta)) {
    const clave = clavePeriodo(dia, granularidad);
    if (!puntos.has(clave)) {
      const valores: Record<string, number> = {};
      for (const nombre of nombres) valores[nombre] = 0;
      puntos.set(clave, { clave, etiqueta: etiquetaPeriodo(clave, granularidad), valores });
    }
  }
  for (const fila of filas) {
    const punto = puntos.get(clavePeriodo(fila.fecha.slice(0, 10), granularidad));
    if (!punto) continue;
    for (const nombre of nombres) {
      punto.valores[nombre] = redondear(punto.valores[nombre] + (Number(campos[nombre](fila)) || 0));
    }
  }
  return Array.from(puntos.values());
}

export type PuntoFlujo = {
  clave: string;
  etiqueta: string;
  ingresos: number;
  gastos: number;
  utilidad: number;
};

/** Ventas sin IGV contra todo lo gastado (compras, administrativos, planilla) por período. */
export function flujoPorPeriodo(datos: {
  desde: string;
  hasta: string;
  granularidad: Granularidad;
  por_dia: readonly VentaPorDia[];
  gastos_diarios: readonly GastoDiarioDia[];
  gastos_administrativos: readonly GastoAdministrativo[];
  planilla: readonly PagoPlanilla[];
}): PuntoFlujo[] {
  type Fila = { fecha: string; ingresos: number; gastos: number };
  const filas: Fila[] = [
    ...datos.por_dia.map((v) => ({ fecha: v.fecha, ingresos: v.neto, gastos: 0 })),
    ...datos.gastos_diarios.map((g) => ({ fecha: g.fecha, ingresos: 0, gastos: g.total })),
    ...datos.gastos_administrativos.map((g) => ({ fecha: g.fecha, ingresos: 0, gastos: g.monto })),
    ...datos.planilla.map((p) => ({ fecha: p.fecha, ingresos: 0, gastos: p.monto })),
  ];
  return agruparPorPeriodo(datos.desde, datos.hasta, datos.granularidad, filas, {
    ingresos: (f) => f.ingresos,
    gastos: (f) => f.gastos,
  }).map((p) => ({
    clave: p.clave,
    etiqueta: p.etiqueta,
    ingresos: p.valores.ingresos,
    gastos: p.valores.gastos,
    utilidad: redondear(p.valores.ingresos - p.valores.gastos),
  }));
}

/** Horas con venta, rellenando los huecos entre la primera y la última. */
export function serieHoras(filas: readonly VentaPorHora[]): VentaPorHora[] {
  if (!filas.length) return [];
  const porHora = new Map(filas.map((f) => [f.hora, f]));
  const horas = filas.map((f) => f.hora);
  const serie: VentaPorHora[] = [];
  for (let h = Math.min(...horas); h <= Math.max(...horas); h++) {
    serie.push(porHora.get(h) ?? { hora: h, cantidad: 0, total: 0 });
  }
  return serie;
}

export const etiquetaHora = (hora: number) => `${String(hora).padStart(2, "0")}:00`;

/** Los 7 días de la semana (lunes primero), con 0 los que no tuvieron venta. */
export function serieDiasSemana(filas: readonly VentaPorDiaSemana[]) {
  const porDia = new Map(filas.map((f) => [f.dia, f]));
  return DIAS_SEMANA_LARGOS.map((nombre, i) => {
    const fila = porDia.get(i + 1);
    return { dia: i + 1, nombre, cantidad: fila?.cantidad ?? 0, total: fila?.total ?? 0 };
  });
}

/* ------------------------------- Agrupaciones ------------------------------ */

/** Agrupa filas por una clave de texto sumando los campos indicados; ordena por el primero, de mayor a menor. */
export function agruparPor<T, C extends string>(
  filas: readonly T[],
  clave: (fila: T) => string,
  campos: Record<C, (fila: T) => number>,
): ({ clave: string; registros: number } & Record<C, number>)[] {
  const nombres = Object.keys(campos) as C[];
  const grupos = new Map<string, { clave: string; registros: number } & Record<C, number>>();
  for (const fila of filas) {
    const k = clave(fila);
    let grupo = grupos.get(k);
    if (!grupo) {
      grupo = { clave: k, registros: 0 } as { clave: string; registros: number } & Record<C, number>;
      for (const nombre of nombres) (grupo as Record<string, number | string>)[nombre] = 0;
      grupos.set(k, grupo);
    }
    grupo.registros += 1;
    for (const nombre of nombres) {
      const actual = (grupo as Record<string, number>)[nombre];
      (grupo as Record<string, number>)[nombre] = redondear(actual + (Number(campos[nombre](fila)) || 0));
    }
  }
  const orden = nombres[0];
  return Array.from(grupos.values()).sort((a, b) =>
    orden ? (b as Record<string, number>)[orden] - (a as Record<string, number>)[orden] : 0,
  );
}

export function ventasPorCategoria(productos: readonly ProductoVendido[]) {
  return agruparPor(productos, (p) => p.categoria, {
    monto: (p) => p.monto,
    cantidad: (p) => p.cantidad,
    monto_neto: (p) => p.monto_neto,
    costo: costoProducto,
  }).map((g) => ({
    categoria: g.clave,
    productos: g.registros,
    monto: g.monto,
    cantidad: g.cantidad,
    monto_neto: g.monto_neto,
    costo: g.costo,
    margen: redondear(g.monto_neto - g.costo),
    margen_pct: porcentaje(g.monto_neto - g.costo, g.monto_neto),
  }));
}

/**
 * Los `n` mayores y el resto sumado en "Otros", para que un gráfico de torta o
 * de barras no se llene de rebanadas ilegibles.
 */
export function topConOtros<T>(
  filas: readonly T[],
  n: number,
  valor: (fila: T) => number,
  etiqueta: (fila: T) => string,
  etiquetaOtros = "Otros",
): { etiqueta: string; valor: number }[] {
  const ordenadas = [...filas].sort((a, b) => valor(b) - valor(a));
  const top = ordenadas.slice(0, n).map((f) => ({ etiqueta: etiqueta(f), valor: redondear(valor(f)) }));
  const resto = ordenadas.slice(n);
  if (resto.length) top.push({ etiqueta: etiquetaOtros, valor: sumar(resto, valor) });
  return top;
}

/**
 * Resumen de turnos. En la base `monto_diferencia = sistema − declarado`
 * (caj_cerrar_turno): positiva es faltante y negativa, sobrante. Solo cuentan
 * los turnos cerrados, que son los que tienen arqueo.
 */
export function resumenCaja(turnos: readonly TurnoReporte[]) {
  const cerrados = turnos.filter((t) => t.estado_turno === 2);
  const diferencias = cerrados.map((t) => Number(t.monto_diferencia) || 0);
  return {
    turnos: turnos.length,
    abiertos: turnos.length - cerrados.length,
    cerrados: cerrados.length,
    ventas: sumar(turnos, (t) => t.totales?.total_ventas),
    ventas_efectivo: sumar(turnos, (t) => t.totales?.ventas_efectivo),
    diferencia_neta: sumar(diferencias, (d) => d),
    faltantes: sumar(diferencias, (d) => (d > 0 ? d : 0)),
    sobrantes: sumar(diferencias, (d) => (d < 0 ? -d : 0)),
    turnos_con_diferencia: diferencias.filter((d) => d !== 0).length,
  };
}

export function resumenCuentas(filas: readonly CuentaReporte[]) {
  return {
    personas: filas.length,
    con_saldo: filas.filter((f) => f.saldo > 0).length,
    saldo: sumar(filas, (f) => f.saldo),
    cargos: sumar(filas, (f) => f.cargos_periodo),
    abonos: sumar(filas, (f) => f.abonos_periodo),
  };
}

export function resumenInventario(stock: readonly StockReporte[]) {
  return {
    items: stock.length,
    valorizado: sumar(stock, (s) => s.valorizado),
    bajo_minimo: stock.filter((s) => s.bajo_minimo).length,
    por_almacen: agruparPor(stock, (s) => s.almacen, { valorizado: (s) => s.valorizado }).map((g) => ({
      almacen: g.clave,
      items: g.registros,
      valorizado: g.valorizado,
    })),
  };
}

export function planillaPorTrabajador(pagos: readonly PagoPlanilla[]) {
  return agruparPor(pagos, (p) => p.trabajador, { monto: (p) => p.monto }).map((g) => ({
    trabajador: g.clave,
    pagos: g.registros,
    monto: g.monto,
  }));
}

export function gastosAdministrativosPorCategoria(gastos: readonly GastoAdministrativo[]) {
  return agruparPor(gastos, (g) => g.categoria, {
    monto: (g) => g.monto,
    fijos: (g) => (g.tipo_gasto === 1 ? g.monto : 0),
    variables: (g) => (g.tipo_gasto === 2 ? g.monto : 0),
  }).map((g) => ({
    categoria: g.clave,
    gastos: g.registros,
    monto: g.monto,
    fijos: g.fijos,
    variables: g.variables,
  }));
}

export type LineaResultado = { concepto: string; monto: number; pct: number | null; nivel: "titulo" | "detalle" | "total" };

/** Líneas del estado de resultados, con el % sobre la venta sin IGV. */
export function lineasEstadoResultados(e: EstadoResultados): LineaResultado[] {
  const base = e.ventas_netas;
  const linea = (concepto: string, monto: number, nivel: LineaResultado["nivel"] = "detalle"): LineaResultado => ({
    concepto,
    monto,
    pct: base ? porcentaje(monto, base) : null,
    nivel,
  });
  return [
    { concepto: "Ventas cobradas (con IGV)", monto: e.ventas_brutas, pct: null, nivel: "titulo" },
    { concepto: "(−) IGV", monto: e.igv, pct: null, nivel: "detalle" },
    linea("Ventas sin IGV", e.ventas_netas, "total"),
    linea("(−) Costo de recetas de lo vendido", e.costo_ventas),
    linea("Margen bruto", e.margen_bruto, "total"),
    linea("Compras del día", e.gastos_diarios),
    linea("Gastos administrativos", e.gastos_administrativos),
    linea("Planilla", e.planilla),
    linea("(−) Total de gastos pagados", e.total_gastos),
    linea("Utilidad operativa (ventas sin IGV − gastos)", e.utilidad_operativa, "total"),
  ];
}
