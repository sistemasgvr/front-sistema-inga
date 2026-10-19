"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useState } from "react";
import { DateRangePicker } from "@/components/form/DateRangePicker";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import {
  EMPRESA,
  exportarExcel,
  fechaHoraLima,
  formatoFecha,
  formatoMoneda,
  formatoNumero,
  Indicador,
  nombreArchivo,
} from "@/modules/reportes";
import { formatearRango } from "@/shared/utils/fecha";
import { useEstadoCuentaDetalle } from "../hooks/use-estado-cuenta-detalle";
import type { MovimientoDetalleCxc } from "../types/cxc.types";
import {
  conSaldoCorrido,
  descripcionMovimiento,
  esPagoMixto,
  precioConAdicionales,
  resumenPlatos,
  textoLinea,
} from "../utils/estado-cuenta";
import { seccionesEstadoCuenta } from "../utils/estado-cuenta-secciones";

const textoPeriodo = (rango: { desde: string; hasta: string }) =>
  rango.desde && rango.hasta ? formatearRango(rango) : "Todo el historial";

/** Detalle de platos de un consumo: cantidad, plato, precio, descuento y subtotal. */
function DetallePedido({ mov }: { mov: MovimientoDetalleCxc }) {
  const p = mov.pedido!;
  const datos = [
    p.mozo && `Atendió: ${p.mozo}`,
    p.comensales ? `${p.comensales} comensal(es)` : null,
    p.comprobante && `Comprobante ${p.comprobante}`,
  ].filter(Boolean);
  return (
    <div className="detalle-pedido rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
      {datos.length > 0 && <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{datos.join(" · ")}</p>}
      <table className="tabla-detalle w-full text-xs">
        <thead>
          <tr className="text-gray-500 dark:text-gray-400">
            <th className="w-14 py-1 text-right font-medium">Cant.</th>
            <th className="py-1 pl-3 text-left font-medium">Plato</th>
            <th className="py-1 text-right font-medium">P. unit.</th>
            <th className="py-1 text-right font-medium">Desc.</th>
            <th className="py-1 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {p.lineas.map((l) => (
            <tr key={l.id} className="text-gray-700 dark:text-gray-300">
              <td className="py-0.5 text-right tabular-nums">{formatoNumero(l.cantidad)}</td>
              <td className="py-0.5 pl-3">
                {textoLinea(l)}
                {l.cortesia && (
                  <span className="ml-1.5 rounded bg-success-50 px-1.5 text-[10px] font-medium text-success-700 dark:bg-success-500/15 dark:text-success-400">
                    cortesía
                  </span>
                )}
              </td>
              <td className="py-0.5 text-right tabular-nums">{formatoMoneda(precioConAdicionales(l))}</td>
              <td className="py-0.5 text-right tabular-nums">{l.descuento ? `−${formatoMoneda(l.descuento)}` : "—"}</td>
              <td className="py-0.5 text-right tabular-nums">{formatoMoneda(l.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200 font-medium text-gray-800 dark:border-gray-700 dark:text-white/90">
            <td colSpan={4} className="pt-1 text-right">
              Total del pedido
            </td>
            <td className="pt-1 text-right tabular-nums">{formatoMoneda(p.total)}</td>
          </tr>
          {esPagoMixto(mov) && (
            <tr className="text-gray-500 dark:text-gray-400">
              <td colSpan={5} className="pt-0.5 text-right">
                Pagado: {p.pagos.map((g) => `${g.medio} ${formatoMoneda(g.monto)}`).join(" · ")} — a cuenta {formatoMoneda(mov.monto)}
              </td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}

/**
 * Estado de cuenta de un cliente para imprimir, guardar como PDF o exportar a
 * Excel: saldo anterior, cada consumo con su pedido y los platos, los abonos,
 * el saldo después de cada movimiento y el resumen de lo consumido.
 */
export function EstadoCuentaDetalleView({ idPersona }: { idPersona: number }) {
  const e = useEstadoCuentaDetalle(idPersona);
  const [conDetalle, setConDetalle] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState<string | null>(null);
  const [emitido, setEmitido] = useState(() => fechaHoraLima());

  const d = e.datos;
  const periodo = textoPeriodo(e.rango);
  const movimientos = d ? conSaldoCorrido(d.saldo_anterior, d.movimientos) : [];
  const platos = d ? resumenPlatos(d.movimientos) : [];
  const base = d ? `Estado de cuenta ${d.nombre}` : "Estado de cuenta";
  const desdeArchivo = e.rango.desde || "historial";
  const hastaArchivo = e.rango.hasta || e.hoy;

  async function exportar() {
    if (!d || exportando) return;
    setExportando(true);
    setErrorExportar(null);
    try {
      await exportarExcel(nombreArchivo(base, desdeArchivo, hastaArchivo), {
        empresa: EMPRESA,
        titulo: `Estado de cuenta — ${d.nombre}`,
        periodo,
        generado: fechaHoraLima(),
        secciones: seccionesEstadoCuenta(d, periodo),
      });
    } catch (error) {
      setErrorExportar(error instanceof Error ? error.message : "No se pudo generar el archivo de Excel.");
    } finally {
      setExportando(false);
    }
  }

  /** El título de la pestaña es el nombre que el navegador propone para el PDF. */
  function imprimir() {
    const anterior = document.title;
    setEmitido(fechaHoraLima());
    document.title = nombreArchivo(base, desdeArchivo, hastaArchivo, "pdf").replace(/\.pdf$/, "");
    window.addEventListener("afterprint", () => (document.title = anterior), { once: true });
    setTimeout(() => window.print(), 50);
  }

  return (
    <div data-imprimir-reporte="" className="reporte-imprimible estado-cuenta">
      {/* Controles: no salen en papel. */}
      <div className="mb-5 space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/cuentas-por-cobrar" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600">
              <Icon name="mdi:arrow-left" size={16} aria-hidden="true" /> Cuentas por cobrar
            </Link>
            <h2 className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">Estado de cuenta detallado</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-72">
            <DateRangePicker label="Período" value={e.rango} onChange={e.cambiarRango} max={e.hoy} />
          </div>
          <div role="group" aria-label="Períodos rápidos" className="flex flex-wrap gap-1.5">
            {e.atajos.map((a) => (
              <button
                key={a.clave}
                type="button"
                aria-pressed={e.atajoActivo === a.clave}
                onClick={() => e.cambiarRango({ desde: a.desde, hasta: a.hasta })}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  e.atajoActivo === a.clave
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                {a.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={conDetalle}
              onChange={(ev) => setConDetalle(ev.target.checked)}
              className="size-4 rounded border-gray-300 accent-brand-500"
            />
            Mostrar los platos de cada pedido
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={e.recargar}
            disabled={e.cargando}
            startIcon={<Icon name="mdi:refresh" size={18} aria-hidden="true" />}
          >
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportar}
            disabled={!d || e.cargando || exportando}
            startIcon={<Icon name={exportando ? "mdi:loading" : "mdi:microsoft-excel"} className={exportando ? "animate-spin" : ""} size={18} aria-hidden="true" />}
          >
            {exportando ? "Generando Excel…" : "Exportar Excel"}
          </Button>
          <Button
            size="sm"
            onClick={imprimir}
            disabled={!d || e.cargando}
            startIcon={<Icon name="mdi:printer-outline" size={18} aria-hidden="true" />}
          >
            Imprimir / PDF
          </Button>
          {errorExportar && (
            <p className="w-full text-sm text-error-600 dark:text-error-500" role="alert">
              {errorExportar}
            </p>
          )}
        </div>
      </div>

      {!e.completo ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Elige la fecha final del período.</p>
      ) : e.error ? (
        <div className="rounded-2xl border border-error-200 bg-error-50 p-5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          <p className="font-medium">No se pudo cargar el estado de cuenta.</p>
          <p className="mt-1">{e.error}</p>
        </div>
      ) : e.cargando || !d ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500 dark:text-gray-400" role="status">
          <Icon name="mdi:loading" className="animate-spin" size={20} aria-hidden="true" />
          Cargando estado de cuenta…
        </div>
      ) : (
        <article className="documento-estado-cuenta space-y-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] print:rounded-none print:border-0 print:p-0">
          {/* Encabezado del documento (en pantalla y en papel). */}
          <div className="encabezado-impresion flex flex-wrap items-start justify-between gap-4 border-b-2 border-gray-800 pb-4 dark:border-gray-600">
            <div className="flex items-center gap-4">
              <Image src="/images/logo/logo-brand.png" alt="Ingá" width={70} height={36} style={{ width: 70, height: 36 }} />
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">{EMPRESA}</p>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white/90">Estado de cuenta</h1>
              </div>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
              <dt className="text-gray-500">Cliente:</dt>
              <dd className="font-medium text-gray-900 dark:text-white/90">{d.nombre}</dd>
              {d.num_documento && (
                <>
                  <dt className="text-gray-500">Documento:</dt>
                  <dd className="text-gray-800 dark:text-gray-200">{d.num_documento}</dd>
                </>
              )}
              {d.convenio && (
                <>
                  <dt className="text-gray-500">Convenio:</dt>
                  <dd className="text-gray-800 dark:text-gray-200">{d.convenio}</dd>
                </>
              )}
              <dt className="text-gray-500">Período:</dt>
              <dd className="text-gray-800 dark:text-gray-200">{periodo}</dd>
              <dt className="text-gray-500">Emitido:</dt>
              <dd className="text-gray-800 dark:text-gray-200">{emitido}</dd>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Indicador titulo="Saldo anterior" valor={formatoMoneda(d.saldo_anterior)} detalle={d.periodo.fecha_desde ? `Al ${formatoFecha(d.periodo.fecha_desde)}` : "Sin movimientos previos"} />
            <Indicador titulo="Consumos" valor={formatoMoneda(d.total_cargos)} detalle={`${d.movimientos.filter((m) => m.tipo_movimiento === 1).length} consumos en el período`} />
            <Indicador
              titulo="Abonos"
              valor={formatoMoneda(d.total_abonos)}
              detalle={d.total_ajustes ? `Ajustes: ${formatoMoneda(d.total_ajustes)}` : `${d.movimientos.filter((m) => m.tipo_movimiento === 2).length} abonos en el período`}
            />
            <Indicador
              titulo="Saldo al cierre"
              valor={formatoMoneda(d.saldo_final)}
              detalle={d.saldo_final !== d.saldo_actual ? `Saldo de hoy: ${formatoMoneda(d.saldo_actual)}` : "Es el saldo de hoy"}
            />
          </div>

          <section className="seccion-reporte">
            <h3 className="titulo-seccion mb-2 text-base font-medium text-gray-800 dark:text-white/90">Movimientos</h3>
            {movimientos.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Sin movimientos en el período.</p>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="tabla-estado-cuenta w-full min-w-[640px] text-sm print:min-w-0">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      <th className="px-3 py-2 text-left font-medium">Fecha</th>
                      <th className="px-3 py-2 text-left font-medium">Concepto</th>
                      <th className="px-3 py-2 text-right font-medium">Consumo</th>
                      <th className="px-3 py-2 text-right font-medium">Abono</th>
                      <th className="px-3 py-2 text-right font-medium">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.periodo.fecha_desde && (
                      <tr className="fila-saldo-anterior border-b border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-white/[0.02]">
                        <td className="px-3 py-2 text-gray-500">{formatoFecha(d.periodo.fecha_desde)}</td>
                        <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Saldo anterior</td>
                        <td />
                        <td />
                        <td className="px-3 py-2 text-right font-medium tabular-nums text-gray-800 dark:text-white/90">{formatoMoneda(d.saldo_anterior)}</td>
                      </tr>
                    )}
                    {movimientos.map((m) => (
                      <Fragment key={m.id}>
                        <tr className="fila-movimiento border-b border-gray-100 align-top dark:border-gray-800">
                          <td className="whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-400">{formatoFecha(m.fecha)}</td>
                          <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                            <span className="font-medium">{descripcionMovimiento(m)}</span>
                            {m.observacion && m.observacion !== `Pedido ${m.pedido?.codigo}` && (
                              <span className="block text-xs text-gray-500 dark:text-gray-400">{m.observacion}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-gray-800 dark:text-gray-200">{m.cargo ? formatoMoneda(m.cargo) : ""}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-success-700 dark:text-success-400">{m.abono ? formatoMoneda(m.abono) : ""}</td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums text-gray-900 dark:text-white/90">{formatoMoneda(m.saldo)}</td>
                        </tr>
                        {conDetalle && m.tipo_movimiento === 1 && m.pedido && m.pedido.lineas.length > 0 && (
                          <tr className="fila-detalle border-b border-gray-100 dark:border-gray-800">
                            <td />
                            <td colSpan={4} className="px-3 pb-3">
                              <DetallePedido mov={m} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 font-semibold text-gray-900 dark:border-gray-700 dark:text-white/90">
                      <td className="px-3 py-2" colSpan={2}>
                        Totales del período
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatoMoneda(d.total_cargos)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatoMoneda(d.total_abonos)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatoMoneda(d.saldo_final)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          {platos.length > 0 && (
            <section className="seccion-reporte">
              <h3 className="titulo-seccion mb-2 text-base font-medium text-gray-800 dark:text-white/90">Resumen de lo consumido</h3>
              <table className="tabla-reporte w-full max-w-xl text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <th className="px-3 py-2 text-left font-medium">Plato</th>
                    <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                    <th className="px-3 py-2 text-right font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {platos.map((p) => (
                    <tr key={p.plato} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{p.plato}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{formatoNumero(p.cantidad)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{formatoMoneda(p.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Conformidad: el consorcio descuenta por planilla, así que el papel se firma. */}
          <div className="firmas hidden grid-cols-2 gap-16 pt-14 text-center text-xs text-gray-600 print:grid">
            <div className="border-t border-gray-500 pt-1">Conforme del cliente — {d.nombre}</div>
            <div className="border-t border-gray-500 pt-1">{EMPRESA}</div>
          </div>
        </article>
      )}
    </div>
  );
}
