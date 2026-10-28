"use client";

import { Modal } from "@/components/ui/modal";
import type { ReemitirValues, VentaDetalle } from "../types/ventas.types";
import { fechaHora, lugarPedido, soles } from "../utils/formato";
import { ComandasVenta } from "./comandas-venta";
import { ComprobantesVenta } from "./comprobantes-venta";
import { PagosVenta } from "./pagos-venta";

type VentaDetalleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  detalle: VentaDetalle | null;
  isLoading: boolean;
  procesando: string | null;
  permisos: { reimprimir: boolean; cambiarPago: boolean; reemitir: boolean };
  onReimprimirComanda: (idComanda: number) => Promise<boolean>;
  onDescargarTicket: (idComanda: number, nombre: string) => Promise<void>;
  onDescargarComprobante: (idComprobante: number, nombre: string) => Promise<void>;
  onImprimirComprobante: (idComprobante: number) => Promise<boolean>;
  onCambiarMedio: (idPago: number, medio: number) => Promise<boolean>;
  onReemitir: (values: ReemitirValues) => Promise<boolean>;
  /** Una acción SUNAT cambió el estado: recargar la venta. */
  onCambioSunat: () => void;
};

export function VentaDetalleModal({
  isOpen,
  onClose,
  detalle,
  isLoading,
  procesando,
  permisos,
  onReimprimirComanda,
  onDescargarTicket,
  onDescargarComprobante,
  onImprimirComprobante,
  onCambiarMedio,
  onReemitir,
  onCambioSunat,
}: VentaDetalleModalProps) {
  const items = detalle?.items.filter((i) => i.tipo_linea !== 3 && Number(i.cantidad) > Number(i.cantidad_cancelada)) ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[820px] p-0">
      <div className="flex max-h-[88vh] flex-col">
        <div className="shrink-0 border-b border-gray-100 px-6 pt-6 pb-4 pr-16 dark:border-gray-800">
          <h4 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
            {detalle ? `Venta ${detalle.codigo}` : "Venta"}
          </h4>
          {detalle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lugarPedido(detalle)}
              {detalle.nombre_mozo ? ` · Mozo: ${detalle.nombre_mozo}` : ""}
              {detalle.nombre_cliente ? ` · Cliente: ${detalle.nombre_cliente}` : ""}
              {` · Cobrada ${fechaHora(detalle.fecha_cierre)}`}
            </p>
          )}
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {isLoading || !detalle ? (
            <p className="py-10 text-center text-sm text-gray-500">Cargando venta...</p>
          ) : (
            <>
              <PagosVenta
                pagos={detalle.pagos}
                puedeCambiar={permisos.cambiarPago}
                procesando={procesando}
                onCambiar={onCambiarMedio}
              />
              <ComprobantesVenta
                comprobantes={detalle.comprobantes}
                puedeImprimir={permisos.reimprimir}
                puedeReemitir={permisos.reemitir}
                procesando={procesando}
                onImprimir={onImprimirComprobante}
                onDescargar={onDescargarComprobante}
                onReemitir={onReemitir}
                onCambioSunat={onCambioSunat}
              />

              <section>
                <h5 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Productos</h5>
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 px-3.5 py-2 text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {Number(item.cantidad) - Number(item.cantidad_cancelada)} × {item.nombre_producto}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white/90">{soles(item.monto_subtotal)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between gap-3 bg-gray-50 px-3.5 py-2 text-sm font-semibold dark:bg-white/[0.03]">
                    <span className="text-gray-700 dark:text-gray-300">
                      Total (IGV {soles(detalle.monto_igv)})
                    </span>
                    <span className="text-gray-900 dark:text-white">{soles(detalle.monto_total)}</span>
                  </div>
                </div>
              </section>

              <ComandasVenta
                comandas={detalle.comandas_impresion}
                puedeReimprimir={permisos.reimprimir}
                procesando={procesando}
                onReimprimir={onReimprimirComanda}
                onDescargar={onDescargarTicket}
              />
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
