import { MESES } from "../types/gastos.types";

/**
 * Formateo de montos y fechas del módulo de gastos administrativos.
 * Misma convención que caja y planilla, para que todos los montos del sistema
 * se lean igual.
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
  // Construyo con componentes locales para que un DATE "2026-09-05" no se
  // interprete como UTC y se muestre un día antes.
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return "—";
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** "Septiembre 2026" */
export function etiquetaMes(anio: number, mes: number): string {
  return `${MESES[mes - 1] ?? `Mes ${mes}`} ${anio}`;
}

/** Fecha de hoy en `YYYY-MM-DD`, en hora local. */
export function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}
