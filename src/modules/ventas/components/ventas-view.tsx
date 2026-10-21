"use client";

import { useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { DateRangePicker } from "@/components/form/DateRangePicker";
import Input from "@/components/form/input/InputField";
import Pagination from "@/components/tables/Pagination";
import { Icon } from "@/components/ui/icon";
import { useVentas } from "../hooks/use-ventas";
import { TIPO_COMPROBANTE, hoyLima, soles } from "../utils/formato";
import { VentaDetalleModal } from "./venta-detalle-modal";
import { VentasTable } from "./ventas-table";
import { plural } from "@/shared/utils/plural";

const FILTROS_COMPROBANTE = [
  { valor: "", etiqueta: "Todos" },
  { valor: "1", etiqueta: TIPO_COMPROBANTE[1] },
  { valor: "2", etiqueta: TIPO_COMPROBANTE[2] },
  { valor: "3", etiqueta: TIPO_COMPROBANTE[3] },
  { valor: "0", etiqueta: "Crédito" },
];

export function VentasView() {
  const v = useVentas();
  // Se fija al montar la vista: el límite del calendario no debe cambiar de valor
  // a mitad de la sesión.
  const hoy = useMemo(() => hoyLima(), []);

  return (
    <div>
      <PageBreadcrumb pageTitle="Ventas" />

      {/* Resumen del filtro: total vendido y cuánto entró por cada medio. */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <Icon
              name="mdi:receipt-text-check-outline"
              size={17}
              className="text-gray-700 dark:text-gray-200"
            />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {plural(v.resumen?.cantidad ?? 0, "venta")}
            </span>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-gray-800 dark:text-white">
            {soles(v.resumen?.monto_total)}
          </p>
        </div>
        {(v.resumen?.por_medio ?? []).map((m) => (
          <button
            key={m.medio_pago}
            type="button"
            onClick={() =>
              v.cambiarFiltro(
                "medio_pago",
                v.filtros.medio_pago === String(m.medio_pago)
                  ? ""
                  : String(m.medio_pago),
              )
            }
            className={`rounded-xl border p-4 text-left transition-colors dark:bg-white/[0.03] ${
              v.filtros.medio_pago === String(m.medio_pago)
                ? "border-brand-400 bg-brand-50 dark:border-brand-500/50"
                : "border-gray-200 bg-white hover:border-brand-300 dark:border-gray-800"
            }`}
          >
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {m.nombre_medio}
            </span>
            <p className="mt-1.5 text-xl font-bold text-gray-800 dark:text-white">
              {soles(m.monto)}
            </p>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-nowrap items-end gap-3">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Buscar pedido, comprobante, cliente o documento..."
            value={v.filtros.buscar}
            onChange={(e) => v.cambiarFiltro("buscar", e.target.value)}
          />
        </div>

        <div className="w-72 shrink-0">
          <DateRangePicker
            id="ventas-fechas"
            label="Fechas"
            value={{
              desde: v.filtros.fecha_desde,
              hasta: v.filtros.fecha_hasta,
            }}
            onChange={(rango) => v.cambiarRangoFechas(rango.desde, rango.hasta)}
            max={hoy}
            className="w-full"
          />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Comprobante:
        </span>
        {FILTROS_COMPROBANTE.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => v.cambiarFiltro("tipo_comprobante", f.valor)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              v.filtros.tipo_comprobante === f.valor
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      <VentasTable
        ventas={v.registros}
        isLoading={v.isLoading}
        onVer={(venta) => void v.abrirDetalle(venta.id)}
      />

      <div className="mt-5">
        <Pagination
          currentPage={v.pagina}
          totalPages={v.totalPages}
          totalItems={v.total}
          pageSize={v.pageSize}
          onPageChange={v.setPagina}
          onPageSizeChange={v.setPageSize}
        />
      </div>

      <VentaDetalleModal
        isOpen={v.detalleAbierto}
        onClose={v.cerrarDetalle}
        detalle={v.detalle}
        isLoading={v.cargandoDetalle}
        procesando={v.procesando}
        permisos={v.permisos}
        onReimprimirComanda={v.reimprimirComanda}
        onDescargarTicket={v.descargarTicket}
        onDescargarComprobante={v.descargarComprobante}
        onImprimirComprobante={v.imprimirComprobante}
        onCambiarMedio={v.cambiarMedioPago}
        onReemitir={v.reemitirComprobante}
      />
    </div>
  );
}
