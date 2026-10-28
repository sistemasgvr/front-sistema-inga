"use client";

import { useState } from "react";
import { DatePicker } from "@/components/form/DatePicker";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast/ToastContext";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useListadoSunat } from "../hooks/use-listado-sunat";
import type { PermisosSunat } from "../hooks/use-permisos-sunat";
import { consultarLoteSunat, descargarArchivoLote, listarLotesSunat, obtenerLoteSunat } from "../services/sunat.service";
import type { LoteSunat } from "../types/sunat.types";
import { TIPO_LOTE, fechaCorta } from "../utils/sunat";
import { EstadoSunatBadge } from "./estado-sunat-badge";

const CABECERA = "px-4 py-3 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300";
const soles = (n: number) => `S/ ${Number(n ?? 0).toFixed(2)}`;
const mensaje = (e: unknown, d: string) => (e instanceof Error && e.message) || d;

type Filtros = { fecha?: string; tipo_lote?: number };

const chip = (activo: boolean) =>
  `rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${activo
    ? "bg-brand-500 text-white"
    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`;

/**
 * Resúmenes diarios (boletas) y comunicaciones de baja (facturas). SUNAT los procesa
 * en diferido: el sistema consulta el ticket solo; «Consultar» lo hace en el momento.
 */
export function LotesTab({ permisos }: { permisos: PermisosSunat }) {
  const { toast } = useToast();
  const l = useListadoSunat<LoteSunat, Filtros>(listarLotesSunat, {});
  const [procesando, setProcesando] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<LoteSunat | null>(null);

  async function ejecutar(clave: string, accion: () => Promise<void>, error: string) {
    setProcesando(clave);
    try { await accion(); }
    catch (e) { toast("error", error, mensaje(e, "Inténtalo de nuevo.")); }
    finally { setProcesando(null); }
  }

  const consultar = (lote: LoteSunat) => ejecutar(`consultar-${lote.id}`, async () => {
    const r = await consultarLoteSunat(lote.id);
    toast(r.estado_sunat === 2 ? "success" : r.estado_sunat === 3 ? "error" : "info",
      `${r.identificador}: ${r.estado_sunat === 5 ? "SUNAT aún lo procesa" : r.estado_sunat === 2 ? "aceptado" : "no aceptado"}`,
      r.sunat_mensaje ?? "Se volverá a consultar automáticamente.");
    l.recargar();
    if (detalle?.id === lote.id) setDetalle(r);
  }, "No se pudo consultar el ticket");

  const verDetalle = (lote: LoteSunat) =>
    ejecutar(`ver-${lote.id}`, async () => setDetalle(await obtenerLoteSunat(lote.id)), "No se pudo abrir el lote");

  const botones = (lote: LoteSunat) => (
    <div className="flex justify-center gap-1.5">
      {permisos.enviar && lote.estado_sunat === 5 && lote.ticket && (
        <Button size="sm" disabled={Boolean(procesando)} onClick={() => void consultar(lote)}
          startIcon={<Icon name="mdi:cloud-search-outline" size={16} />}>
          {procesando === `consultar-${lote.id}` ? "Consultando..." : "Consultar"}
        </Button>
      )}
      {lote.tiene_xml && (
        <Button size="sm" variant="outline" disabled={Boolean(procesando)} title="XML enviado a SUNAT"
          onClick={() => void ejecutar(`xml-${lote.id}`, () => descargarArchivoLote(lote, "xml"), "No se pudo descargar el XML")}>
          XML
        </Button>
      )}
      {lote.tiene_cdr && (
        <Button size="sm" variant="outline" disabled={Boolean(procesando)} title="Constancia de recepción de SUNAT"
          onClick={() => void ejecutar(`cdr-${lote.id}`, () => descargarArchivoLote(lote, "cdr"), "No se pudo descargar el CDR")}>
          CDR
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-60">
          <DatePicker id="sunat-lotes-fecha" label="Fecha (documentos o envío)" value={l.filtros.fecha ?? ""}
            onChange={(f) => l.cambiarFiltro("fecha", f || undefined)} className="w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {[undefined, 1, 2].map((t) => (
            <button key={t ?? 0} type="button" className={chip(l.filtros.tipo_lote === t)} onClick={() => l.cambiarFiltro("tipo_lote", t)}>
              {t ? TIPO_LOTE[t] : "Todos"}
            </button>
          ))}
          {l.filtros.fecha && (
            <button type="button" className="text-xs font-medium text-brand-600 hover:underline" onClick={() => l.cambiarFiltro("fecha", undefined)}>
              Quitar fecha
            </button>
          )}
        </div>
      </div>

      {l.error && <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">{l.error}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className={CABECERA}>Identificador</TableCell>
                  <TableCell isHeader className={CABECERA}>Tipo</TableCell>
                  <TableCell isHeader className={CABECERA}>Documentos del</TableCell>
                  <TableCell isHeader className={`${CABECERA} text-center`}>Comprobantes</TableCell>
                  <TableCell isHeader className={CABECERA}>Estado SUNAT</TableCell>
                  <TableCell isHeader className={`${CABECERA} text-center`}>Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {l.cargando ? (
                  <TableRow><TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">Cargando...</TableCell></TableRow>
                ) : l.registros.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">No hay resúmenes ni bajas.</TableCell></TableRow>
                ) : l.registros.map((lote) => (
                  <TableRow key={lote.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-4 py-3">
                      <button type="button" onClick={() => void verDetalle(lote)} className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
                        {lote.identificador}
                      </button>
                      {lote.ticket && <p className="text-xs text-gray-400">Ticket {lote.ticket}</p>}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{TIPO_LOTE[lote.tipo_lote]}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {fechaCorta(lote.fecha_documentos)}
                      <p className="text-xs text-gray-400">Enviado {fechaCorta(lote.fecha_envio)}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{lote.cantidad ?? "—"}</TableCell>
                    <TableCell className="px-4 py-3">
                      <EstadoSunatBadge estado={lote.estado_sunat} />
                      {lote.sunat_mensaje && <p className="mt-0.5 max-w-[280px] text-xs text-gray-500">{lote.sunat_mensaje}</p>}
                    </TableCell>
                    <TableCell className="px-4 py-3">{botones(lote)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Pagination currentPage={l.pagina} totalPages={l.totalPaginas} totalItems={l.total} pageSize={l.limite} onPageChange={l.setPagina} />

      <Modal isOpen={Boolean(detalle)} onClose={() => setDetalle(null)} className="max-w-[640px] p-6">
        {detalle && (
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">{detalle.identificador}</h4>
              <p className="text-xs text-gray-500">
                {TIPO_LOTE[detalle.tipo_lote]} · documentos del {fechaCorta(detalle.fecha_documentos)}
                {detalle.ticket ? ` · ticket ${detalle.ticket}` : ""}
              </p>
              <div className="mt-2"><EstadoSunatBadge estado={detalle.estado_sunat} /></div>
              {detalle.sunat_mensaje && <p className="mt-1 whitespace-pre-line text-xs text-gray-500">{detalle.sunat_mensaje}</p>}
            </div>
            <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
              {(detalle.comprobantes ?? []).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-3.5 py-2 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {c.numero}
                    <span className="ml-2 text-xs text-gray-400">{c.estado_item === 3 ? `Anular${c.motivo ? `: ${c.motivo}` : ""}` : "Informar"}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{soles(c.monto_total)}</span>
                    <EstadoSunatBadge estado={c.estado_sunat} />
                  </span>
                </li>
              ))}
            </ul>
            {botones(detalle)}
          </div>
        )}
      </Modal>
    </div>
  );
}
