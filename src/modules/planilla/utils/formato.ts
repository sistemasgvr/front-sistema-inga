import { MESES } from "../types/planilla.types";

/**
 * Formateo de montos, fechas y períodos del módulo de planilla.
 *
 * Los centralizo acá porque los usan las tres pantallas y todos los montos
 * deben verse igual. Reuso la misma convención que el módulo de caja.
 */

export function formatearSoles(monto: number | null | undefined): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(monto) || 0);
}

/** Fecha corta. Las fechas de pago son DATE, sin hora. */
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  // Corto la parte de fecha y construyo con componentes locales para evitar
  // que un DATE "2026-09-17" se interprete como UTC y se muestre un día antes.
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return "—";
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** "Septiembre 2026 · 1ra quincena" */
export function etiquetaPeriodo(
  anio: number,
  mes: number,
  quincena?: number | null,
): string {
  const nombreMes = MESES[mes - 1] ?? `Mes ${mes}`;
  const base = `${nombreMes} ${anio}`;
  if (!quincena) return base;
  return `${base} · ${quincena === 1 ? "1ra" : "2da"} quincena`;
}

/**
 * Deduce el período que corresponde a una fecha de pago, replicando la regla
 * del backend (`pla_registrar_pago`).
 *
 * Lo necesito en el front solo para *mostrarle* al cajero a qué quincena se va
 * a imputar el pago antes de guardarlo. La verdad la sigue calculando la base;
 * esto es únicamente para que no haya sorpresas al confirmar.
 */
export function deducirPeriodo(fechaISO: string): {
  anio: number;
  mes: number;
  quincena: number;
} {
  const [anio, mes, dia] = fechaISO.slice(0, 10).split("-").map(Number);
  if (dia <= 15) {
    // Primera mitad del mes: paga la 2da quincena del mes anterior.
    const anterior = new Date(anio, mes - 2, 1);
    return {
      anio: anterior.getFullYear(),
      mes: anterior.getMonth() + 1,
      quincena: 2,
    };
  }
  return { anio, mes, quincena: 1 };
}

/** Fecha de hoy en formato `YYYY-MM-DD`, en hora local. */
export function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}
