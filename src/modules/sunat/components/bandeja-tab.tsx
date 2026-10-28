"use client";

import Link from "next/link";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useAccionesSunat } from "../hooks/use-acciones-sunat";
import { useListadoSunat } from "../hooks/use-listado-sunat";
import type { PermisosSunat } from "../hooks/use-permisos-sunat";
import { listarBandejaSunat } from "../services/sunat.service";
import type { BandejaItem } from "../types/sunat.types";
import { ESTADO_SUNAT, fechaCorta, textoVencimiento } from "../utils/sunat";
import { EstadoSunatBadge } from "./estado-sunat-badge";

const CABECERA = "px-4 py-3 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300";
const soles = (n: number) => `S/ ${Number(n ?? 0).toFixed(2)}`;
const TIPO: Record<number, string> = { 1: "Boleta", 2: "Factura" };

type Filtros = { estado_sunat?: number; tipo_comprobante?: number };

const FILTROS_ESTADO: { valor?: number; etiqueta: string }[] = [
  { etiqueta: "Por atender" },
  { valor: 1, etiqueta: ESTADO_SUNAT[1].label },
  { valor: 5, etiqueta: ESTADO_SUNAT[5].label },
  { valor: 3, etiqueta: ESTADO_SUNAT[3].label },
  { valor: 2, etiqueta: ESTADO_SUNAT[2].label },
  { valor: 4, etiqueta: ESTADO_SUNAT[4].label },
];

const chip = (activo: boolean) =>
  `rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${activo
    ? "bg-brand-500 text-white"
    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`;

/** Bandeja de trabajo: lo pendiente ordenado por fecha límite y lo rechazado por SUNAT. */
export function BandejaTab({ permisos }: { permisos: PermisosSunat }) {
  const l = useListadoSunat<BandejaItem, Filtros>(listarBandejaSunat, {});
  const acciones = useAccionesSunat(l.recargar);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Estado:</span>
        {FILTROS_ESTADO.map((f) => (
          <button key={f.etiqueta} type="button" className={chip(l.filtros.estado_sunat === f.valor)}
            onClick={() => l.cambiarFiltro("estado_sunat", f.valor)}
            title={f.valor ? ESTADO_SUNAT[f.valor as 1].ayuda : "Pendientes, en proceso y rechazados"}>
            {f.etiqueta}
          </button>
        ))}
        <span className="ml-3 text-xs font-medium text-gray-500 dark:text-gray-400">Tipo:</span>
        {[undefined, 1, 2].map((t) => (
          <button key={t ?? 0} type="button" className={chip(l.filtros.tipo_comprobante === t)}
            onClick={() => l.cambiarFiltro("tipo_comprobante", t)}>
            {t ? `${TIPO[t]}s` : "Todos"}
          </button>
        ))}
      </div>

      {l.error && <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">{l.error}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[920px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className={CABECERA}>Comprobante</TableCell>
                  <TableCell isHeader className={CABECERA}>Cliente</TableCell>
                  <TableCell isHeader className={`${CABECERA} text-end`}>Total</TableCell>
                  <TableCell isHeader className={CABECERA}>Plazo</TableCell>
                  <TableCell isHeader className={CABECERA}>Estado SUNAT</TableCell>
                  <TableCell isHeader className={`${CABECERA} text-center`}>Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {l.cargando ? (
                  <TableRow><TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">Cargando...</TableCell></TableRow>
                ) : l.registros.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">No hay comprobantes en este estado.</TableCell></TableRow>
                ) : l.registros.map((c) => (
                  <TableRow key={c.id} className={c.por_vencer ? "bg-warning-50/40 dark:bg-warning-500/5" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"}>
                    <TableCell className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{c.numero}</p>
                      <p className="text-xs text-gray-500">{TIPO[c.tipo_comprobante]} · emitida {fechaCorta(c.fecha_emision?.slice(0, 10))}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {c.receptor_razon_social ?? "CLIENTES VARIOS"}
                      {c.receptor_num_doc && c.receptor_num_doc !== "00000000" && <p className="text-xs text-gray-400">{c.receptor_num_doc}</p>}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end text-sm font-semibold text-gray-800 dark:text-white/90">{soles(c.monto_total)}</TableCell>
                    <TableCell className="px-4 py-3 text-xs">
                      {c.estado_sunat === 1 ? (
                        <span className={c.por_vencer ? "font-semibold text-warning-700 dark:text-warning-400" : "text-gray-600 dark:text-gray-300"}>
                          {textoVencimiento(c.fecha_limite_envio)}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                      {c.intentos_envio > 0 && <p className="text-gray-400">{c.intentos_envio} intento(s)</p>}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <EstadoSunatBadge estado={c.estado_sunat} />
                      {c.sunat_mensaje && <p className="mt-0.5 max-w-[280px] text-xs text-gray-500">{c.sunat_mensaje}</p>}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex justify-center gap-1.5">
                        {permisos.enviar && c.estado_sunat === 1 && c.estado === 1 && (
                          <Button size="sm" disabled={Boolean(acciones.procesando)} onClick={() => void acciones.enviar(c.id)}
                            startIcon={<Icon name="mdi:send-outline" size={16} />}>
                            {acciones.procesando === `enviar-${c.id}` ? "Enviando..." : "Enviar"}
                          </Button>
                        )}
                        <Link href={`/ventas?venta=${c.id_pedido}`}
                          title={c.estado_sunat === 3 ? "Abrir la venta para reemitir el comprobante" : "Abrir la venta"}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300">
                          <Icon name={c.estado_sunat === 3 ? "mdi:file-replace-outline" : "mdi:open-in-new"} size={16} />
                          {c.estado_sunat === 3 ? "Reemitir" : "Venta"}
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Pagination currentPage={l.pagina} totalPages={l.totalPaginas} totalItems={l.total} pageSize={l.limite} onPageChange={l.setPagina} />
    </div>
  );
}
