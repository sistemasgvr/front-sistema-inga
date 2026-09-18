/**
 * Formateo del módulo de gastos diarios.
 * Misma convención que caja, planilla, gastos administrativos y CxP.
 */

export function formatearSoles(monto: number | null | undefined): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(monto) || 0);
}

/** Fecha corta. `fecha_gasto` es DATE, sin hora. */
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  // Construyo con componentes locales para que un DATE no se interprete como
  // UTC y se muestre un día antes.
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return "—";
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** "Jueves 18 de septiembre" — para la cabecera del día que se está registrando. */
export function fechaLarga(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return "—";
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Fecha de hoy en `YYYY-MM-DD`, en hora local. */
export function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Formatea la cantidad sin decimales innecesarios.
 *
 * Las cantidades son NUMERIC(14,4) para admitir fracciones (2.5 kg), pero
 * mostrar "3.0000 und" es ruido. Recorto los ceros de la derecha.
 */
export function formatearCantidad(cantidad: number | null | undefined): string {
  const n = Number(cantidad) || 0;
  return n % 1 === 0 ? String(n) : String(parseFloat(n.toFixed(4)));
}
