import { hoyIso } from "@/shared/utils/fecha";

/** Valores de tipo_comprobante: 1 boleta, 2 factura, 3 nota de venta. 0 = venta sin comprobante (crédito). */
export const TIPO_COMPROBANTE: Record<number, string> = {
  1: "Boleta",
  2: "Factura",
  3: "Nota de venta",
};

export const TIPO_PEDIDO: Record<number, string> = {
  1: "Mesa",
  2: "Para llevar",
  3: "Delivery",
};

export const TIPO_COMANDA: Record<string, string> = {
  COMANDA: "Comanda",
  PRECUENTA: "Precuenta",
  COMPROBANTE: "Comprobante",
};

export const ESTADO_IMPRESION: Record<string, { label: string; color: "success" | "warning" | "error" | "light" }> = {
  enviado: { label: "Impresa", color: "success" },
  pendiente: { label: "En cola", color: "warning" },
  procesando: { label: "Imprimiendo", color: "warning" },
  revision: { label: "Con error", color: "error" },
};

/** Medios que se pueden intercambiar desde Ventas; el crédito (4) se corrige en CxC. */
export const MEDIOS_CAMBIABLES = [1, 2, 3];

export const soles = (valor: number | string | null | undefined) =>
  `S/ ${Number(valor ?? 0).toFixed(2)}`;

export const fechaHora = (valor: string | null | undefined) =>
  valor
    ? new Date(valor).toLocaleString("es-PE", {
        timeZone: "America/Lima",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/** Fecha de hoy en Lima como YYYY-MM-DD, para el filtro por defecto. */
export const hoyLima = hoyIso;

export function lugarPedido(venta: { tipo_pedido: number; codigo_mesa: string | null }) {
  return venta.tipo_pedido === 1 && venta.codigo_mesa
    ? `Mesa ${venta.codigo_mesa}`
    : TIPO_PEDIDO[venta.tipo_pedido] ?? "—";
}
