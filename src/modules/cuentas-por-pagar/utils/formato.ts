import { MESES } from "../types/cxp.types";

/**
 * Formateo del módulo de cuentas por pagar.
 * Misma convención que caja, planilla y gastos.
 */

export function formatearSoles(monto: number | null | undefined): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(monto) || 0);
}

/** Fecha corta. `fecha_movimiento` es DATE, sin hora. */
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

/**
 * Traduce los días sin abonar a un nivel de urgencia.
 *
 * El corte con proveedores es semanal, así que pasar de 7 días ya es una
 * semana de atraso. Uso esos umbrales para el color de la fila: es lo que
 * convierte una tabla de números en una alerta que se lee de un vistazo.
 */
export function urgenciaAtraso(dias: number | null): {
  nivel: "ok" | "atencion" | "urgente";
  etiqueta: string;
} {
  if (dias === null) return { nivel: "atencion", etiqueta: "Nunca abonado" };
  if (dias <= 7) return { nivel: "ok", etiqueta: `Hace ${dias} d` };
  if (dias <= 14) return { nivel: "atencion", etiqueta: `Hace ${dias} d` };
  return { nivel: "urgente", etiqueta: `Hace ${dias} d` };
}
