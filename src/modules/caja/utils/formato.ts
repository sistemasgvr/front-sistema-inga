/**
 * Formateo de montos y fechas del módulo de caja.
 *
 * Los centralizo acá porque los usan cuatro pantallas distintas y todos los
 * montos de caja tienen que verse igual: mismo símbolo, mismos dos decimales y
 * mismo separador de miles. Si cada componente lo hiciera a su manera, el
 * arqueo mostraría "1250.5" en un lado y "S/ 1,250.50" en otro.
 */

export function formatearSoles(monto: number | null | undefined): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(monto) || 0);
}

/** Fecha y hora corta, en la zona horaria de Lima. */
export function formatearFechaHora(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Cuánto lleva abierto un turno, en formato "3h 25min".
 * Sirve para que el cajero vea de un vistazo si se le pasó la hora de cerrar.
 */
export function tiempoTranscurrido(desde: string | null | undefined): string {
  if (!desde) return "—";
  const minutos = Math.floor((Date.now() - new Date(desde).getTime()) / 60000);
  if (minutos < 1) return "recién abierto";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`;
}

/** Solo la fecha, en formato largo ("lunes, 12 de octubre"). */
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-PE", {
    timeZone: "America/Lima",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Indica si la fecha cae en un día anterior a hoy (hora de Lima).
 * Comparo el día calendario y no las horas: un turno abierto a las 23:00 ya es
 * "de ayer" a las 00:30, aunque lleve abierto apenas hora y media.
 */
export function esDeDiaAnterior(fecha: string | null | undefined): boolean {
  if (!fecha) return false;
  const diaLima = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  return diaLima(new Date(fecha)) < diaLima(new Date());
}
