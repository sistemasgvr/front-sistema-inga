const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numero = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });

export const formatoMoneda = (valor: number | null | undefined) => moneda.format(Number(valor) || 0);

export const formatoNumero = (valor: number | null | undefined) => numero.format(Number(valor) || 0);

export const formatoPorcentaje = (valor: number | null | undefined) =>
  `${(Number(valor) || 0).toLocaleString("es-PE", { maximumFractionDigits: 1 })} %`;

/** `2026-10-15 10:54` o `2026-10-15` a `15/10/2026 10:54` / `15/10/2026`. */
export function formatoFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  const [fecha, hora] = valor.split(" ");
  const [anio, mes, dia] = fecha.split("-");
  if (!anio || !mes || !dia) return valor;
  return `${dia}/${mes}/${anio}${hora ? ` ${hora}` : ""}`;
}

const fechaHora = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Fecha y hora actuales de Lima: `16/10/2026 14:05`. */
export const fechaHoraLima = (fecha = new Date()) => fechaHora.format(fecha).replace(",", "");
