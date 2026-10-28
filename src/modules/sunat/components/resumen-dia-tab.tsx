"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DatePicker } from "@/components/form/DatePicker";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { hoyIso } from "@/shared/utils/fecha";
import { useAccionesSunat } from "../hooks/use-acciones-sunat";
import type { PermisosSunat } from "../hooks/use-permisos-sunat";
import { useResumenDia } from "../hooks/use-resumen-dia";
import { ESTADO_SUNAT, textoVencimiento } from "../utils/sunat";
import { EstadoSunatBadge } from "./estado-sunat-badge";

const CABECERA = "px-4 py-3 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300";
const soles = (n: number) => `S/ ${Number(n ?? 0).toFixed(2)}`;
const TIPO: Record<number, string> = { 1: "Boleta", 2: "Factura" };

/**
 * Comprobantes de un día: cuántos hay por tipo y estado, el envío masivo
 * (facturas una por una, boletas en resumen diario) y el envío individual.
 */
export function ResumenDiaTab({ permisos }: { permisos: PermisosSunat }) {
  const hoy = useMemo(() => hoyIso(), []);
  const [fecha, setFecha] = useState(hoy);
  const r = useResumenDia(fecha);
  const acciones = useAccionesSunat(r.recargar);
  const [confirmar, setConfirmar] = useState(false);

  const boletas = r.resumen?.grupos.find((g) => g.tipoComprobante === 1);
  const facturas = r.resumen?.grupos.find((g) => g.tipoComprobante === 2);
  const pendientes = (boletas?.pendientes ?? 0) + (facturas?.pendientes ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-60">
          <DatePicker id="sunat-fecha" label="Día de emisión" value={fecha} max={hoy} onChange={(f) => setFecha(f || hoy)} className="w-full" />
        </div>
        {permisos.enviar && (
          <Button size="sm" disabled={!pendientes || r.enviando || r.cargando} onClick={() => setConfirmar(true)}
            title={pendientes ? undefined : "No hay comprobantes pendientes este día"}
            startIcon={<Icon name="mdi:send-check-outline" size={18} />}>
            {r.enviando ? "Enviando..." : `Enviar pendientes del día (${pendientes})`}
          </Button>
        )}
      </div>

      {r.error && <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">{r.error}</p>}

      {/* Totales por tipo: cuántos hay en cada estado SUNAT. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[boletas, facturas].map((g, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{i === 0 ? "Boletas" : "Facturas"}</p>
              <p className="text-xs text-gray-500">{g?.cantidad ?? 0} emitidas · {g?.pendientes ?? 0} pendientes</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(g?.porEstado ?? []).length === 0 ? (
                <span className="text-xs text-gray-400">{r.cargando ? "Cargando..." : "Sin comprobantes"}</span>
              ) : g!.porEstado.map((e) => (
                <span key={e.estadoSunat} className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <EstadoSunatBadge estado={e.estadoSunat} />
                  {e.cantidad} · {soles(e.monto)}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">
              {i === 0 ? "Las boletas pendientes se envían juntas en un resumen diario." : "Las facturas se envían una por una."}
            </p>
          </div>
        ))}
      </div>

      {r.resultado && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-white/[0.02]">
          <p className="font-semibold text-gray-800 dark:text-white/90">Resultado del envío</p>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Facturas: {r.resultado.facturas.enviadas} de {r.resultado.facturas.total} enviadas · {r.resultado.facturas.aceptadas} aceptadas
            {r.resultado.facturas.rechazadas ? ` · ${r.resultado.facturas.rechazadas} rechazadas` : ""}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Boletas: {r.resultado.boletas.total} en {r.resultado.boletas.resumenes.length} resumen(es)
            {r.resultado.boletas.resumenes.map((x, i) => x.identificador
              ? ` · ${x.identificador} (${ESTADO_SUNAT[(x.estado_sunat ?? 5) as 0].label})`
              : ` · Resumen ${i + 1}: ${x.error}`).join("")}
          </p>
          {r.resultado.facturas.errores.map((e) => <p key={e} className="text-xs text-error-600">{e}</p>)}
          <p className="mt-1 text-xs text-gray-400">Los resúmenes se confirman en la pestaña «Resúmenes y bajas».</p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[860px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className={CABECERA}>Comprobante</TableCell>
                  <TableCell isHeader className={CABECERA}>Cliente</TableCell>
                  <TableCell isHeader className={`${CABECERA} text-end`}>Total</TableCell>
                  <TableCell isHeader className={CABECERA}>Estado SUNAT</TableCell>
                  <TableCell isHeader className={`${CABECERA} text-center`}>Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {r.cargando ? (
                  <TableRow><TableCell colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">Cargando...</TableCell></TableRow>
                ) : !r.resumen?.comprobantes.length ? (
                  <TableRow><TableCell colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">No hay boletas ni facturas este día.</TableCell></TableRow>
                ) : r.resumen.comprobantes.map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-4 py-3">
                      <p className={`text-sm font-semibold text-gray-800 dark:text-white/90 ${c.estado === 0 ? "line-through" : ""}`}>{c.numero}</p>
                      <p className="text-xs text-gray-500">{TIPO[c.tipoComprobante]}{c.estado === 0 ? " · reemplazado al reemitir" : ""}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {c.receptorRazonSocial ?? "CLIENTES VARIOS"}
                      {c.receptorNumDoc && c.receptorNumDoc !== "00000000" && <p className="text-xs text-gray-400">{c.receptorNumDoc}</p>}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end text-sm font-semibold text-gray-800 dark:text-white/90">{soles(c.montoTotal)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <EstadoSunatBadge estado={c.estadoSunat} />
                      <p className="mt-0.5 max-w-[260px] text-xs text-gray-500">
                        {c.estadoSunat === 1 && c.estado === 1 ? textoVencimiento(c.fechaLimiteEnvio) : c.sunatMensaje}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex justify-center gap-1.5">
                        {permisos.enviar && c.estadoSunat === 1 && c.estado === 1 && (
                          <Button size="sm" disabled={Boolean(acciones.procesando)} onClick={() => void acciones.enviar(c.id)}
                            startIcon={<Icon name="mdi:send-outline" size={16} />}>
                            {acciones.procesando === `enviar-${c.id}` ? "Enviando..." : "Enviar"}
                          </Button>
                        )}
                        {c.estadoSunat !== 0 && (
                          <Button size="sm" variant="outline" disabled={Boolean(acciones.procesando)} title="PDF A4"
                            onClick={() => void acciones.descargar(c.id, "pdf-a4", c.numero)}
                            startIcon={<Icon name="mdi:file-document-outline" size={16} />}>
                            A4
                          </Button>
                        )}
                        <Link href={`/ventas?venta=${c.idPedido}`} title="Abrir la venta"
                          className="inline-flex items-center rounded-lg border border-gray-200 px-2.5 text-gray-600 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300">
                          <Icon name="mdi:open-in-new" size={16} />
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

      <ConfirmDialog
        isOpen={confirmar}
        onClose={() => setConfirmar(false)}
        variant="warning"
        title="Enviar pendientes del día a SUNAT"
        description={`Se enviarán ${facturas?.pendientes ?? 0} factura(s) una por una y ${boletas?.pendientes ?? 0} boleta(s) en resumen diario. Lo que SUNAT acepte ya no se puede reemitir sin baja.`}
        confirmText="Enviar"
        isLoading={r.enviando}
        onConfirm={async () => { setConfirmar(false); await r.enviarDia(); }}
      />
    </div>
  );
}
