import {
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from "@/shared/api/api-client";
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

export const imprimirComprobante = (idComprobante: number) =>
  apiPost<VentaDetalle>(`/ventas/comprobantes/${idComprobante}/imprimir`);
