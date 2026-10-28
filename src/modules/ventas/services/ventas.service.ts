import {
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from "@/shared/api/api-client";
import { descargarTicketPdf } from "@/modules/impresion";
import type {
  ListVentasParams,
  ListVentasResult,
  ReemitirValues,
  VentaDetalle,
  VentaItem,
  VentasResumen,
} from "../types/ventas.types";

export async function listVentas(
  params: ListVentasParams,
  signal?: AbortSignal,
): Promise<ListVentasResult> {
  const { data, meta } = await apiGetPaginated<VentaItem, VentasResumen>(
    "/ventas",
    {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        buscar: params.buscar?.trim() || undefined,
        fecha_desde: params.fecha_desde || undefined,
        fecha_hasta: params.fecha_hasta || undefined,
        tipo_comprobante: params.tipo_comprobante || undefined,
        medio_pago: params.medio_pago || undefined,
        estado_sunat: params.estado_sunat || undefined,
      },
      signal,
    },
  );
  return {
    registros: data,
    total: meta.total,
    resumen: meta.resumen ?? undefined,
  };
}

export const getVenta = (id: number) => apiGet<VentaDetalle>(`/ventas/${id}`);

export const cambiarMedioPago = (idPago: number, medioPago: number) =>
  apiPatch<VentaDetalle>(`/ventas/pagos/${idPago}/medio`, {
    medio_pago: medioPago,
  });

export const reemitirComprobante = (idVenta: number, values: ReemitirValues) =>
  apiPost<VentaDetalle>(`/ventas/${idVenta}/reemitir`, {
    tipo_comprobante: values.tipo_comprobante,
    documento: values.documento?.trim() || undefined,
  });

export const reimprimirComanda = (idComanda: number) =>
  apiPost<VentaDetalle>(`/ventas/comandas/${idComanda}/reimprimir`);

/** PDF con forma de ticket, archivado en Storage por el backend (comanda, precuenta o comprobante impreso). */
export const descargarTicket = (idComanda: number, nombre: string) =>
  descargarTicketPdf(`/ventas/comandas/${idComanda}/pdf`, nombre);

/** PDF del comprobante (boleta, factura o nota de venta) archivado en Storage. */
export const descargarComprobante = (idComprobante: number, nombre: string) =>
  descargarTicketPdf(`/ventas/comprobantes/${idComprobante}/pdf`, nombre);

export const imprimirComprobante = (idComprobante: number) =>
  apiPost<VentaDetalle>(`/ventas/comprobantes/${idComprobante}/imprimir`);
