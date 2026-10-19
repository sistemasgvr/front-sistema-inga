import type { LineaPedidoCxc, MovimientoDetalleCxc } from "../types/cxc.types";

/**
 * Cálculos del estado de cuenta detallado (pantalla, papel y Excel).
 * Puros y sin dependencias para que los tres muestren la misma cifra.
 */

const redondear = (n: number) => Math.round((n + Math.sign(n) * Number.EPSILON) * 100) / 100;

/** Consumo suma a la deuda, abono la baja y el ajuste entra con su signo. */
export function montoConSigno(mov: Pick<MovimientoDetalleCxc, "tipo_movimiento" | "monto">): number {
  if (mov.tipo_movimiento === 1) return mov.monto;
  if (mov.tipo_movimiento === 2) return -mov.monto;
  return mov.monto;
}

export type MovimientoConSaldo = MovimientoDetalleCxc & { cargo: number; abono: number; saldo: number };

/**
 * Saldo después de cada movimiento, partiendo del saldo anterior al período.
 * Se recalcula aquí (y no se usa `saldo_resultante`) para que cuadre aunque
 * en el medio se haya anulado algún movimiento.
 */
export function conSaldoCorrido(saldoAnterior: number, movimientos: readonly MovimientoDetalleCxc[]): MovimientoConSaldo[] {
  let saldo = saldoAnterior;
  return movimientos.map((m) => {
    const signo = montoConSigno(m);
    saldo = redondear(saldo + signo);
    return { ...m, cargo: signo > 0 ? m.monto : 0, abono: signo < 0 ? Math.abs(signo) : 0, saldo };
  });
}

export const TIPO_MOVIMIENTO_CXC: Record<number, string> = { 1: "Consumo", 2: "Abono", 3: "Ajuste" };

/** "Consumo · PED-20 · Mesa M7", "Abono · Yape", "Abono · corrige PED-23". */
export function descripcionMovimiento(mov: MovimientoDetalleCxc): string {
  const partes = [TIPO_MOVIMIENTO_CXC[mov.tipo_movimiento] ?? "Movimiento"];
  if (mov.tipo_movimiento === 1 && mov.pedido) {
    partes.push(mov.pedido.codigo);
    if (mov.pedido.mesa) partes.push(`Mesa ${mov.pedido.mesa}`);
  } else {
    if (mov.medio_pago_nombre) partes.push(mov.medio_pago_nombre);
    if (mov.pedido) partes.push(`corrige ${mov.pedido.codigo}`);
  }
  return partes.join(" · ");
}

/** Nombre del plato con sus adicionales: "Lomo saltado + Huevo + Queso". */
export function textoLinea(linea: LineaPedidoCxc): string {
  const extras = linea.adicionales.map((a) => a.nombre);
  return [linea.producto, ...extras].join(" + ");
}

/** Precio por unidad con adicionales incluidos. */
export const precioConAdicionales = (linea: LineaPedidoCxc) =>
  redondear(linea.precio_unitario + linea.adicionales.reduce((s, a) => s + a.precio, 0));

export type FilaPlato = {
  fecha: string;
  pedido: string;
  mesa: string | null;
  plato: string;
  cantidad: number;
  precio: number;
  descuento: number;
  subtotal: number;
  cortesia: boolean;
};

/** Una fila por plato consumido a crédito en el período (solo cargos con pedido). */
export function filasPlatos(movimientos: readonly MovimientoDetalleCxc[]): FilaPlato[] {
  return movimientos.flatMap((m) =>
    m.tipo_movimiento === 1 && m.pedido
      ? m.pedido.lineas.map((l) => ({
          fecha: m.pedido!.fecha,
          pedido: m.pedido!.codigo,
          mesa: m.pedido!.mesa,
          plato: textoLinea(l),
          cantidad: l.cantidad,
          precio: precioConAdicionales(l),
          descuento: l.descuento,
          subtotal: l.subtotal,
          cortesia: l.cortesia,
        }))
      : [],
  );
}

/** Qué consumió en el período, sumado por plato (sin adicionales), de más a menos. */
export function resumenPlatos(movimientos: readonly MovimientoDetalleCxc[]) {
  const porPlato = new Map<string, { plato: string; cantidad: number; monto: number }>();
  for (const m of movimientos) {
    if (m.tipo_movimiento !== 1 || !m.pedido) continue;
    for (const l of m.pedido.lineas) {
      const actual = porPlato.get(l.producto) ?? { plato: l.producto, cantidad: 0, monto: 0 };
      actual.cantidad = redondear(actual.cantidad + l.cantidad);
      actual.monto = redondear(actual.monto + l.subtotal);
      porPlato.set(l.producto, actual);
    }
  }
  return Array.from(porPlato.values()).sort((a, b) => b.monto - a.monto || b.cantidad - a.cantidad);
}

/** El crédito del pedido cuando se pagó una parte con otro medio (pago mixto). */
export function esPagoMixto(mov: MovimientoDetalleCxc): boolean {
  return Boolean(mov.pedido && mov.tipo_movimiento === 1 && Math.abs(mov.pedido.total - mov.monto) > 0.004);
}

/* ------------------------------ Rangos rápidos ----------------------------- */

const dos = (n: number) => String(n).padStart(2, "0");
const ultimoDia = (anio: number, mes: number) => new Date(Date.UTC(anio, mes, 0)).getUTCDate();
const ymd = (anio: number, mes: number, dia: number) => `${anio}-${dos(mes)}-${dos(dia)}`;

export type RangoRapido = { clave: string; etiqueta: string; desde: string; hasta: string };

/**
 * Atajos de período a partir de hoy (Lima, `YYYY-MM-DD`). El corte del
 * consorcio es quincenal: 1ª = días 1 a 15, 2ª = 16 a fin de mes.
 * Ningún rango pasa de hoy. "Todo el historial" va sin fechas.
 */
export function rangosRapidos(hoy: string): RangoRapido[] {
  const [anio, mes, dia] = hoy.split("-").map(Number);
  const primera = dia <= 15;
  const actual = primera
    ? { desde: ymd(anio, mes, 1), hasta: ymd(anio, mes, 15) }
    : { desde: ymd(anio, mes, 16), hasta: ymd(anio, mes, ultimoDia(anio, mes)) };
  const mesAnt = mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
  const anterior = primera
    ? { desde: ymd(mesAnt.anio, mesAnt.mes, 16), hasta: ymd(mesAnt.anio, mesAnt.mes, ultimoDia(mesAnt.anio, mesAnt.mes)) }
    : { desde: ymd(anio, mes, 1), hasta: ymd(anio, mes, 15) };
  // Nunca después de hoy: el selector no admite fechas futuras.
  const tope = (hasta: string) => (hasta > hoy ? hoy : hasta);
  return [
    { clave: "quincena", etiqueta: "Quincena actual", desde: actual.desde, hasta: tope(actual.hasta) },
    { clave: "quincena-anterior", etiqueta: "Quincena anterior", ...anterior },
    { clave: "mes", etiqueta: "Mes actual", desde: ymd(anio, mes, 1), hasta: hoy },
    { clave: "todo", etiqueta: "Todo el historial", desde: "", hasta: "" },
  ];
}
