import type { EstadoSunat } from "../types/sunat.types";

type Color = "success" | "warning" | "error" | "info" | "light" | "dark";

/** Etiqueta, color y explicación de cada estado SUNAT, iguales en todas las pantallas. */
export const ESTADO_SUNAT: Record<EstadoSunat, { label: string; color: Color; ayuda: string }> = {
  0: { label: "No se envía", color: "light", ayuda: "La nota de venta no se informa a SUNAT." },
  1: { label: "Pendiente", color: "warning", ayuda: "Aún no se envía. Se enviará sola al llegar su fecha límite." },
  2: { label: "Aceptado", color: "success", ayuda: "SUNAT lo aceptó y devolvió su constancia (CDR)." },
  3: { label: "Rechazado", color: "error", ayuda: "SUNAT lo rechazó: el número ya no se puede usar, reemita la venta." },
  4: { label: "Anulado", color: "dark", ayuda: "Anulado en SUNAT (baja aceptada) o antes de enviarse." },
  5: { label: "En proceso", color: "info", ayuda: "Se está enviando o SUNAT aún procesa el resumen o la baja." },
};

export const TIPO_LOTE: Record<number, string> = {
  1: "Resumen diario",
  2: "Comunicación de baja",
};

export const AMBIENTE: Record<number, string> = {
  1: "Beta (pruebas)",
  2: "Producción",
};

/** Solo boletas (1) y facturas (2) son electrónicas. */
export const esElectronico = (tipoComprobante: number | null | undefined) =>
  tipoComprobante === 1 || tipoComprobante === 2;

/** La baja en SUNAT solo se admite hasta 7 días después de la emisión. */
export const DIAS_MAXIMOS_BAJA = 7;

export function diasDesde(fecha: string) {
  const dia = (valor: Date) =>
    new Date(valor.toLocaleDateString("en-CA", { timeZone: "America/Lima" })).getTime();
  return Math.round((dia(new Date()) - dia(new Date(fecha))) / 86_400_000);
}

/** «AAAA-MM-DD» → «28/10/2026». */
export const fechaCorta = (valor: string | null | undefined) =>
  valor ? valor.slice(0, 10).split("-").reverse().join("/") : "—";

/** Días que faltan para la fecha límite (negativo si ya venció). */
export function diasParaVencer(fechaLimite: string | null | undefined) {
  if (!fechaLimite) return null;
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  return Math.round((Date.parse(fechaLimite.slice(0, 10)) - Date.parse(hoy)) / 86_400_000);
}

export function textoVencimiento(fechaLimite: string | null | undefined) {
  const dias = diasParaVencer(fechaLimite);
  if (dias === null) return null;
  if (dias < 0) return "Plazo vencido: se enviará en la próxima revisión";
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  return `Vence en ${dias} días (${fechaCorta(fechaLimite)})`;
}

/** Descarga un archivo binario en el navegador. */
export function guardarArchivo(blob: Blob, nombre: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([blob], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
