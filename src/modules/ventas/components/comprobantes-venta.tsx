"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { Icon } from "@/components/ui/icon";
import type { ComprobanteVenta, ReemitirValues } from "../types/ventas.types";
import { TIPO_COMPROBANTE, fechaHora, soles } from "../utils/formato";

type ComprobantesVentaProps = {
  comprobantes: ComprobanteVenta[];
  puedeImprimir: boolean;
  puedeReemitir: boolean;
  procesando: string | null;
  onImprimir: (idComprobante: number) => Promise<boolean>;
  onDescargar: (idComprobante: number, nombre: string) => Promise<void>;
  onReemitir: (values: ReemitirValues) => Promise<boolean>;
};

/** Mismas reglas que el cobro: la factura exige RUC; la boleta, DNI opcional; la nota de venta, nada. */
function documentoValido(tipo: number, documento: string) {
  if (tipo === 2) return /^\d{11}$/.test(documento);
  if (tipo === 1) return documento === "" || /^\d{8}$/.test(documento);
  return true;
}

export function ComprobantesVenta({
  comprobantes,
  puedeImprimir,
  puedeReemitir,
  procesando,
  onImprimir,
  onDescargar,
  onReemitir,
}: ComprobantesVentaProps) {
  const vigente = comprobantes.find((c) => c.estado === 1) ?? null;
  const anulados = comprobantes.filter((c) => c.estado !== 1);
  const [reemitiendo, setReemitiendo] = useState(false);
  const [tipo, setTipo] = useState(1);
  const [documento, setDocumento] = useState("");
  const valido = documentoValido(tipo, documento);
  const ocupado = procesando === "reemitir";

  function abrirReemision() {
    if (!vigente) return;
    setTipo(vigente.tipo_comprobante);
    setDocumento(
      vigente.tipo_comprobante === 3 || vigente.receptor_num_doc === "00000000"
        ? ""
        : vigente.receptor_num_doc ?? "",
    );
    setReemitiendo(true);
  }

  async function reemitir() {
    if (!valido) return;
    if (await onReemitir({ tipo_comprobante: tipo, documento: tipo === 3 ? "" : documento })) {
      setReemitiendo(false);
    }
  }

  return (
    <section>
      <h5 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Comprobante</h5>
      {!vigente ? (
        <p className="rounded-xl border border-dashed border-gray-200 p-3.5 text-sm text-gray-500 dark:border-gray-700">
          Venta a crédito: no emite comprobante.
        </p>
      ) : (
        <div className="rounded-xl border border-gray-200 p-3.5 dark:border-gray-700">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {TIPO_COMPROBANTE[vigente.tipo_comprobante]} {vigente.numero}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {vigente.receptor_razon_social ?? "—"}
                {vigente.receptor_num_doc ? ` · ${vigente.receptor_num_doc}` : ""}
              </p>
              <p className="text-xs text-gray-400">
                Emitido {fechaHora(vigente.fecha_emision)} · Gravado {soles(vigente.monto_gravado)} · IGV{" "}
                {soles(vigente.monto_igv)} · Total {soles(vigente.monto_total)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!!procesando}
                onClick={() => void onDescargar(vigente.id, vigente.numero)}
                startIcon={<Icon name="mdi:file-pdf-box" size={16} />}
              >
                {procesando === `pdf-comprobante-${vigente.id}` ? "Generando..." : "PDF"}
              </Button>
              {puedeImprimir && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!procesando}
                  onClick={() => void onImprimir(vigente.id)}
                  startIcon={<Icon name="mdi:printer-outline" size={16} />}
                >
                  {procesando === `comprobante-${vigente.id}` ? "Enviando..." : "Imprimir"}
                </Button>
              )}
              {puedeReemitir && !reemitiendo && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!procesando}
                  onClick={abrirReemision}
                  startIcon={<Icon name="mdi:file-replace-outline" size={16} />}
                >
                  Reemitir
                </Button>
              )}
            </div>
          </div>

          {reemitiendo && (
            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {vigente.numero} quedará anulado y se emitirá un comprobante nuevo con otro número por el mismo
                monto. Los pagos no cambian.
              </p>
              <div role="radiogroup" aria-label="Tipo de comprobante" className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                {[1, 2, 3].map((valor) => (
                  <button
                    key={valor}
                    type="button"
                    role="radio"
                    aria-checked={tipo === valor}
                    disabled={ocupado}
                    onClick={() => { setTipo(valor); if (valor === 3) setDocumento(""); }}
                    className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${tipo === valor
                      ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
                  >
                    {TIPO_COMPROBANTE[valor]}
                  </button>
                ))}
              </div>
              {tipo !== 3 && (
                <Input
                  value={documento}
                  disabled={ocupado}
                  maxLength={tipo === 2 ? 11 : 8}
                  placeholder={tipo === 2 ? "RUC del cliente (11 dígitos) *" : "DNI del cliente (opcional)"}
                  error={documento !== "" && !valido}
                  hint={documento !== "" && !valido
                    ? tipo === 2 ? "El RUC debe tener 11 dígitos." : "El DNI debe tener 8 dígitos."
                    : tipo === 2 ? "El cliente debe estar registrado con su RUC y razón social." : undefined}
                  onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ""))}
                />
              )}
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" disabled={ocupado} onClick={() => setReemitiendo(false)}>
                  Cancelar
                </Button>
                <Button size="sm" disabled={!valido || ocupado} onClick={() => void reemitir()}>
                  {ocupado ? "Emitiendo..." : "Anular y emitir nuevo"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {anulados.length > 0 && (
        <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
          <p className="font-medium">Comprobantes anulados</p>
          {anulados.map((c) => (
            <p key={c.id} className="flex flex-wrap items-center gap-1">
              <Badge size="sm" color="light">{TIPO_COMPROBANTE[c.tipo_comprobante]}</Badge>
              <span className="line-through">{c.numero}</span>
              <span>· emitido {fechaHora(c.fecha_emision)}</span>
              <button
                type="button"
                disabled={!!procesando}
                onClick={() => void onDescargar(c.id, `${c.numero}-anulado`)}
                className="inline-flex items-center gap-0.5 font-medium text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400"
              >
                <Icon name="mdi:file-pdf-box" size={14} />
                PDF
              </button>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
