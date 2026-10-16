"use client";

import Badge from "@/components/ui/badge/Badge";
import { Icon } from "@/components/ui/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VentaItem } from "../types/ventas.types";
import { TIPO_COMPROBANTE, fechaHora, lugarPedido, soles } from "../utils/formato";

type VentasTableProps = {
  ventas: VentaItem[];
  isLoading: boolean;
  onVer: (venta: VentaItem) => void;
};

const CABECERA = "px-4 py-3 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300";

export function VentasTable({ ventas, isLoading, onVer }: VentasTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[960px]">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
              <TableRow>
                <TableCell isHeader className={CABECERA}>Venta</TableCell>
                <TableCell isHeader className={CABECERA}>Comprobante</TableCell>
                <TableCell isHeader className={CABECERA}>Cliente</TableCell>
                <TableCell isHeader className={CABECERA}>Medio de pago</TableCell>
                <TableCell isHeader className={CABECERA}>Caja</TableCell>
                <TableCell isHeader className={`${CABECERA} text-end`}>Total</TableCell>
                <TableCell isHeader className={`${CABECERA} text-center`}>Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    Cargando ventas...
                  </TableCell>
                </TableRow>
              ) : ventas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    No hay ventas con estos filtros.
                  </TableCell>
                </TableRow>
              ) : (
                ventas.map((venta) => (
                  <TableRow key={venta.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{venta.codigo}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {lugarPedido(venta)} · {fechaHora(venta.fecha_cierre)}
                      </p>
                      {venta.nombre_mozo && (
                        <p className="text-xs text-gray-400">Mozo: {venta.nombre_mozo}</p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {venta.numero_comprobante ? (
                        <>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {venta.numero_comprobante}
                          </p>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            <Badge size="sm" color="light">
                              {TIPO_COMPROBANTE[venta.tipo_comprobante ?? 0] ?? "—"}
                            </Badge>
                            {venta.reemitido && (
                              <Badge size="sm" color="info">Reemitido</Badge>
                            )}
                          </div>
                        </>
                      ) : (
                        <Badge size="sm" color="warning">Crédito · sin comprobante</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {venta.receptor_razon_social || venta.nombre_cliente || "—"}
                      {venta.receptor_num_doc && venta.receptor_num_doc !== "00000000" && (
                        <p className="text-xs text-gray-400">{venta.receptor_num_doc}</p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {venta.pagos.map((pago) => (
                          <span key={pago.id} className="text-sm text-gray-700 dark:text-gray-300">
                            {pago.nombre_medio}
                            {venta.pagos.length > 1 && (
                              <span className="text-xs text-gray-400"> · {soles(pago.monto)}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{venta.cajas ?? "—"}</p>
                      {venta.caja_cerrada && (
                        <span className="text-xs text-gray-400">Caja cerrada</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end text-sm font-semibold text-gray-800 dark:text-white/90">
                      {soles(venta.monto_total)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onVer(venta)}
                        title="Ver detalle y acciones"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300"
                      >
                        <Icon name="mdi:eye-outline" size={16} />
                        Ver
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
