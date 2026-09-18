import { MESES } from "../types/cxc.types";

/**
 * Formateo del módulo de cuentas por cobrar.
 * Misma convención que caja, planilla, gastos y cuentas por pagar.
 */

export function formatearSoles(monto: number | null | undefined): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(monto) || 0);
}

/**
 * Fecha corta. A diferencia de CxP, en CxC el movimiento no tiene
 * `fecha_movimiento`: la tabla guarda año/mes/quincena y `fecha_creacion`, que
 * es un TIMESTAMPTZ. Por eso acá sí dejo que Date lo parsee completo.
 */
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function etiquetaMes(anio: number, mes: number): string {
  return `${MESES[mes - 1] ?? `Mes ${mes}`} ${anio}`;
}

/** "1ª quincena de Septiembre 2026". Es como el cliente nombra el corte. */
export function etiquetaQuincena(
  anio: number,
  mes: number,
  quincena: number,
): string {
  return `${quincena}ª quincena de ${etiquetaMes(anio, mes)}`;
}

/** Fecha de hoy en `YYYY-MM-DD`, en hora local. */
export function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** La quincena en la que cae una fecha: días 1-15 = 1, del 16 en adelante = 2. */
export function quincenaDe(fechaISO: string): 1 | 2 {
  const dia = Number(fechaISO.slice(8, 10));
  return dia <= 15 ? 1 : 2;
}

/**
 * Traduce el consumo de un cliente contra su tope de crédito a un nivel de
 * alerta.
 *
 * Lo hago acá y no en cada tabla porque el criterio tiene que ser uno solo:
 * decidimos advertir en vez de bloquear (el motivo está en
 * cxc_registrar_consumo.sql), así que el color es lo único que avisa. Si el
 * umbral del 80% cambia, cambia en un solo sitio.
 */
export function nivelCredito(
  saldo: number,
  limite: number | null,
): { nivel: "sin-tope" | "ok" | "atencion" | "excedido"; porcentaje: number | null } {
  if (!limite || limite <= 0) return { nivel: "sin-tope", porcentaje: null };

  const porcentaje = Math.round((saldo / limite) * 100);
  if (saldo > limite) return { nivel: "excedido", porcentaje };
  if (porcentaje >= 80) return { nivel: "atencion", porcentaje };
  return { nivel: "ok", porcentaje };
}

/**
 * Traduce los días sin abonar a un nivel de urgencia.
 *
 * El corte con el consorcio es quincenal y la empresa paga a inicios del mes
 * siguiente, así que el ciclo normal puede llegar a ~45 días. Por eso los
 * umbrales son más holgados que en CxP, donde el corte es semanal: usar los
 * mismos pintaría de rojo a clientes que están perfectamente al día.
 */
export function urgenciaCobranza(dias: number | null): {
  nivel: "ok" | "atencion" | "urgente";
  etiqueta: string;
} {
  if (dias === null) return { nivel: "atencion", etiqueta: "Nunca abonó" };
  if (dias <= 45) return { nivel: "ok", etiqueta: `Hace ${dias} d` };
  if (dias <= 60) return { nivel: "atencion", etiqueta: `Hace ${dias} d` };
  return { nivel: "urgente", etiqueta: `Hace ${dias} d` };
}
