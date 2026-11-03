"use client";

import { useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ParametrosRuta from "@/components/common/ParametrosRuta";
import { DateRangePicker } from "@/components/form/DateRangePicker";
import Input from "@/components/form/input/InputField";
import Pagination from "@/components/tables/Pagination";
import { Icon } from "@/components/ui/icon";
import { BandejaTab, ESTADO_SUNAT, LotesTab, ResumenDiaTab, usePermisosSunat } from "@/modules/sunat";
import { FiltroSucursal } from "@/modules/auth";
import { useEstadoPersistente } from "@/shared/hooks/use-estado-persistente";
import { useTienePermiso } from "@/shared/hooks/use-permiso";
import { useBusquedaDesdeUrl } from "@/shared/hooks/use-busqueda-desde-url";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import Link from "next/link";
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

/** Estados SUNAT que se filtran desde Ventas (boletas y facturas). */
const FILTROS_SUNAT = [
  { valor: "", etiqueta: "Todos" },
  ...([1, 5, 2, 3, 4] as const).map((e) => ({ valor: String(e), etiqueta: ESTADO_SUNAT[e].label })),
];

type Pestana = "ventas" | "dia" | "bandeja" | "lotes";

/**
 * Una sola pantalla para lo cobrado y para los comprobantes electrónicos: son el
 * mismo universo visto desde dos ángulos (la venta y su estado en SUNAT), así que
 * separarlos obligaba a saltar entre rutas para hacer lo mismo.
 */
const PESTANAS: {
  id: Pestana;
  titulo: string;
  icono: string;
  ayuda: string;
  /** Se pinta solo con permiso `sunat.listar`. */
  sunat: boolean;
}[] = [
  { id: "ventas", titulo: "Ventas", icono: "mdi:receipt-text-check-outline", ayuda: "Pedidos cobrados: comprobante, medio de pago y reimpresión", sunat: false },
  { id: "dia", titulo: "Resumen del día", icono: "mdi:calendar-check-outline", ayuda: "Comprobantes de un día y envío masivo", sunat: true },
  { id: "bandeja", titulo: "Pendientes y rechazados", icono: "mdi:inbox-arrow-up-outline", ayuda: "Lo que falta enviar, ordenado por fecha límite", sunat: true },
  { id: "lotes", titulo: "Resúmenes y bajas", icono: "mdi:file-multiple-outline", ayuda: "Resúmenes diarios de boletas y bajas de facturas", sunat: true },
];

export function VentasView() {
  const puedeVentas = useTienePermiso(PermisoBanderas.VENTAS_LISTAR);
  const permisosSunat = usePermisosSunat();
  const [pestana, setPestana] = useEstadoPersistente<Pestana>("ventas.pestana", "ventas");

  // Sin `ventas.listar` no se pide el listado: solo se usan las pestañas SUNAT.
  const v = useVentas({ activo: puedeVentas });
  // Se fija al montar la vista: el límite del calendario no debe cambiar de valor
  // a mitad de la sesión.
  const hoy = useMemo(() => hoyLima(), []);

  // Si se llegó desde el buscador del header, se busca ese texto en todas las
  // fechas: el filtro por defecto es «hoy» y escondería la venta buscada.
  useBusquedaDesdeUrl((busqueda) => {
    setPestana("ventas");
    v.cambiarFiltro("buscar", busqueda);
    v.cambiarRangoFechas("", "");
  });

  const disponibles = useMemo(
    () => PESTANAS.filter((p) => (p.sunat ? permisosSunat.listar : puedeVentas)),
    [puedeVentas, permisosSunat.listar],
  );
  // La pestaña guardada puede no estar permitida (cambió el rol o la sesión).
  const activa = disponibles.some((p) => p.id === pestana) ? pestana : disponibles[0]?.id;

  return (
    <div>
      <PageBreadcrumb pageTitle="Ventas y SUNAT" />

      {/* Enlace desde una notificación o desde la bandeja: /ventas?venta=ID abre
          el detalle, y /ventas?tab=bandeja llega directo a esa sección. */}
      <ParametrosRuta
        nombres={["venta", "tab"]}
        onParametros={({ venta, tab }) => {
          if (tab && PESTANAS.some((p) => p.id === tab)) setPestana(tab as Pestana);
          const id = Number(venta);
          if (Number.isInteger(id) && id > 0) {
            setPestana("ventas");
            void v.abrirDetalle(id);
          }
        }}
      />

      {disponibles.length > 1 && (
        <div role="tablist" aria-label="Ventas y comprobantes" className="mb-5 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {disponibles.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={activa === p.id} title={p.ayuda}
              onClick={() => setPestana(p.id)}
              className={`inline-flex min-w-[10rem] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition ${activa === p.id
                ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
              <Icon name={p.icono} size={18} />
              {p.titulo}
            </button>
          ))}
        </div>
      )}

      {activa === "ventas" && (
        <>
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

            <FiltroSucursal
              className="w-56 shrink-0"
              value={v.filtros.id_sucursal ? Number(v.filtros.id_sucursal) : null}
              onChange={(id) => v.cambiarFiltro("id_sucursal", id ? String(id) : "")}
            />

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
            {permisosSunat.listar && (
              <>
                <span className="ml-3 text-xs font-medium text-gray-500 dark:text-gray-400">SUNAT:</span>
                {FILTROS_SUNAT.map((f) => (
                  <button
                    key={f.valor}
                    type="button"
                    onClick={() => v.cambiarFiltro("estado_sunat", f.valor)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      (v.filtros.estado_sunat ?? "") === f.valor
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {f.etiqueta}
                  </button>
                ))}
              </>
            )}
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
        </>
      )}

      {activa !== "ventas" && (
        <>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <p className="max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              Las boletas y facturas quedan pendientes al cobrar y se imprimen igual. Puedes enviarlas aquí o desde Ventas;
              al llegar su fecha límite el sistema las envía solo.
            </p>
            {permisosSunat.verConfiguracion && (
              <Link href="/configuracion/empresa"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                <Icon name="mdi:cog-outline" size={16} />
                Configuración SUNAT
              </Link>
            )}
          </div>

          {activa === "dia" && <ResumenDiaTab permisos={permisosSunat} />}
          {activa === "bandeja" && <BandejaTab permisos={permisosSunat} />}
          {activa === "lotes" && <LotesTab permisos={permisosSunat} />}
        </>
      )}

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
        onCambioSunat={v.recargarDetalle}
      />
    </div>
  );
}
