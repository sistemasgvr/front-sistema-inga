/**
 * Utilidades de fecha del sistema.
 *
 * Convención: las fechas se construyen siempre como fechas locales
 * (`new Date(anio, mes, dia)`) para que el día no se desplace por zona horaria,
 * y viajan a la API en ISO corto (`YYYY-MM-DD`). El usuario final ve fechas
 * `dd/mm/aaaa`, que es lo que se escribe a mano en los filtros.
 */

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

/** Encabezados del calendario; la semana arranca en lunes. */
export const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"] as const;

/** Separador entre el inicio y el fin dentro del texto del rango. */
export const SEPARADOR_RANGO = " — ";

export type RangoFechas = { desde: string; hasta: string };

export const RANGO_VACIO: RangoFechas = { desde: "", hasta: "" };

const dos = (n: number) => String(n).padStart(2, "0");

const esDigito = (c: string) => c >= "0" && c <= "9";

const soloDigitos = (texto: string) => texto.replace(/\D/g, "");

/** Today in Lima as `YYYY-MM-DD`, the date the reports and filters count on. */
export function hoyIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
}

/** Fecha local (sin hora) a ISO corto. */
export function aYmd(fecha: Date): string {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** ISO corto a fecha local; devuelve null si el día no existe en el calendario. */
export function desdeYmd(ymd: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!partes) return null;
  const fecha = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
  return aYmd(fecha) === ymd.trim() ? fecha : null;
}

/** `dd/mm/aaaa` a fecha local; rechaza fechas inexistentes como 31/02/2026. */
export function parsearDdMmYyyy(texto: string): Date | null {
  const partes = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto.trim());
  if (!partes) return null;
  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const anio = Number(partes[3]);
  const fecha = new Date(anio, mes - 1, dia);
  const valida =
    fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
  return valida ? fecha : null;
}

/** ISO corto a `dd/mm/aaaa`; cadena vacía si no hay fecha. */
export function formatearDdMmYyyy(ymd: string): string {
  const fecha = desdeYmd(ymd);
  return fecha
    ? `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`
    : "";
}

/** Rango a `dd/mm/aaaa — dd/mm/aaaa`, con el separador siempre visible. */
export function formatearRango(rango: RangoFechas): string {
  const desde = formatearDdMmYyyy(rango.desde);
  const hasta = formatearDdMmYyyy(rango.hasta);
  if (desde && hasta) return `${desde}${SEPARADOR_RANGO}${hasta}`;
  return desde ? `${desde}${SEPARADOR_RANGO}` : "";
}

/** Fechas locales a ISO corto para entregarlas como filtro. */
export function rangoDesdeFechas(desde: Date | null, hasta: Date | null): RangoFechas {
  return { desde: desde ? aYmd(desde) : "", hasta: hasta ? aYmd(hasta) : "" };
}

/** -1, 0 o 1 según el orden de dos fechas, sin mirar la hora. */
export function compararDia(a: Date, b: Date): number {
  const x = aYmd(a);
  const y = aYmd(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

export function mismoDia(a: Date, b: Date): boolean {
  return aYmd(a) === aYmd(b);
}

/** Compara contra el "hoy" de Lima, no contra la zona horaria del navegador. */
export function esHoy(fecha: Date): boolean {
  return aYmd(fecha) === hoyIso();
}

/** Acepta `min`/`max` en ISO corto o en `dd/mm/aaaa`. */
export function parsearLimite(valor?: string): Date | null {
  return valor ? desdeYmd(valor) ?? parsearDdMmYyyy(valor) : null;
}

/** Las 42 celdas (6 filas) del mes; lunes en la primera columna. */
export function diasDelMes(anio: number, mes: number): (Date | null)[] {
  const primero = new Date(anio, mes, 1);
  const desplazamiento = (primero.getDay() + 6) % 7;
  const ultimo = new Date(anio, mes + 1, 0).getDate();
  const celdas: (Date | null)[] = [];
  for (let i = 0; i < 42; i++) {
    const dia = i - desplazamiento + 1;
    celdas.push(dia >= 1 && dia <= ultimo ? new Date(anio, mes, dia) : null);
  }
  return celdas;
}

export const decadaDe = (anio: number) => Math.floor(anio / 12) * 12;

/** Separa el texto en sus dos segmentos a partir del guion del rango. */
export function segmentosDe(texto: string): [string, string] {
  const corte = texto.search(/[—–-]/);
  if (corte >= 0) return [texto.slice(0, corte), texto.slice(corte + 1)];
  // Sin guion, una tercera barra separa los segmentos, para el texto pegado
  // como "05/01/2026/31/12/2026".
  let barras = 0;
  for (let i = 0; i < texto.length; i++) {
    if (texto[i] === "/" && ++barras === 3) return [texto.slice(0, i), texto.slice(i + 1)];
  }
  return [texto, ""];
}

/** Posiciones del guion con sus espacios; indica dónde empieza el segundo segmento. */
export function limitesSeparador(texto: string): { inicio: number; fin: number } | null {
  const i = texto.search(/[—–]/);
  if (i < 0) return null;
  const inicio = i > 0 && texto[i - 1] === " " ? i - 1 : i;
  let fin = i + 1;
  if (texto[fin] === " ") fin += 1;
  return { inicio, fin };
}

/** Inserta las barras de una sola fecha a medida que se escribe. */
export function enmascararSegmento(segmento: string): string {
  const d = soloDigitos(segmento).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Fuerza el guion entre los dos segmentos del texto del rango. */
export function enmascararRango(texto: string): string {
  const [izquierda, derecha] = segmentosDe(texto);
  const desde = enmascararSegmento(izquierda);
  const hasta = enmascararSegmento(derecha);
  if (!desde && !hasta) return "";
  return desde ? `${desde}${SEPARADOR_RANGO}${hasta}` : `${SEPARADOR_RANGO}${hasta}`;
}

/** Cuántos dígitos hay antes del cursor, para devolverlo tras reenmascarar. */
export function indiceDigitoEnCursor(texto: string, cursor: number): number {
  let digitos = 0;
  for (let i = 0; i < Math.min(cursor, texto.length); i++) {
    if (esDigito(texto[i])) digitos += 1;
  }
  return digitos;
}

/** Cursor que deja exactamente `indiceDigito` dígitos a su izquierda. */
export function cursorParaRangoEnmascarado(
  texto: string,
  indiceDigito: number,
  despuesDeSeparador = false,
): number {
  let posicion = texto.length;
  let digitos = 0;
  for (let i = 0; i <= texto.length; i++) {
    if (digitos === indiceDigito) {
      posicion = i;
      break;
    }
    if (i < texto.length && esDigito(texto[i])) digitos += 1;
  }
  if (despuesDeSeparador) {
    const limites = limitesSeparador(texto);
    if (limites && posicion < limites.fin) posicion = limites.fin;
  }
  return posicion;
}

/**
 * Interpreta un segmento a medio escribir para saltar el calendario a esa fecha.
 * Solo sirve de pista de navegación: si no alcanza a ser una fecha real, no mueve nada.
 */
export function segmentoParaNavegacion(segmento: string): { anio: number; mes: number; dia: number } | null {
  const d = soloDigitos(segmento);
  if (d.length < 2) return null;
  const dia = Number(d.slice(0, 2));
  const mes = Number(d.slice(2, 4));
  const anioTexto = d.slice(4);
  let anio = anioTexto ? anioTexto : hoyIso().slice(0, 4);
  if (anioTexto && anioTexto.length < 4) anio = `20${anioTexto}`;
  const tentativa = new Date(Number(anio.slice(0, 4)), mes - 1, dia);
  if (Number.isNaN(tentativa.getTime())) return null;
  if (tentativa.getDate() !== dia || tentativa.getMonth() !== mes - 1) return null;
  return { anio: tentativa.getFullYear(), mes: tentativa.getMonth(), dia };
}

/** Rango escrito a mano, ya ordenado de menor a mayor. */
export function rangoDesdeTexto(texto: string): { desde: Date | null; hasta: Date | null } {
  const [izquierda, derecha] = segmentosDe(texto);
  const inicio = parsearDdMmYyyy(enmascararSegmento(izquierda));
  if (!inicio) return { desde: null, hasta: null };
  if (!soloDigitos(derecha)) return { desde: inicio, hasta: null };
  const fin = parsearDdMmYyyy(enmascararSegmento(derecha));
  if (!fin) return { desde: inicio, hasta: null };
  return compararDia(fin, inicio) < 0 ? { desde: fin, hasta: inicio } : { desde: inicio, hasta: fin };
}