"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { LISTA_IDS, useLista } from "@/modules/listas";
import type { PagoVenta } from "../types/ventas.types";
import { MEDIOS_CAMBIABLES, fechaHora, soles } from "../utils/formato";

type PagosVentaProps = {
  pagos: PagoVenta[];
  puedeCambiar: boolean;
  procesando: string | null;
  onCambiar: (idPago: number, medio: number) => Promise<boolean>;
};

export function PagosVenta({ pagos, puedeCambiar, procesando, onCambiar }: PagosVentaProps) {
  const [editando, setEditando] = useState<number | null>(null);
  const [medio, setMedio] = useState<number | null>(null);
  const medios = useLista(LISTA_IDS.MEDIO_PAGO, { enabled: puedeCambiar }).opciones
    .filter((o) => o.valor_entero !== null && MEDIOS_CAMBIABLES.includes(Number(o.valor_entero)));

  const vigentes = pagos.filter((p) => p.estado === 1);
  const anulados = pagos.filter((p) => p.estado !== 1);

  async function confirmar(pago: PagoVenta) {
    if (!medio) return;
    if (await onCambiar(pago.id, medio)) {
      setEditando(null);
      setMedio(null);
    }
  }

  return (
    <section>
      <h5 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Pagos</h5>
      <div className="space-y-2">
        {vigentes.map((pago) => {
          const cambiable = puedeCambiar && MEDIOS_CAMBIABLES.includes(pago.medio_pago);
          const abierto = editando === pago.id;
          const ocupado = procesando === `pago-${pago.id}`;
          return (
            <div key={pago.id} className="rounded-xl border border-gray-200 p-3.5 dark:border-gray-700">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {pago.nombre_medio} · {soles(pago.monto)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {pago.nombre_caja ?? "Sin caja"} · Turno {pago.id_turno ?? "—"}{" "}
                    <Badge size="sm" color={pago.estado_turno === 2 ? "light" : "success"}>
                      {pago.estado_turno === 2 ? "Cerrado" : "Abierto"}
                    </Badge>
                  </p>
                  <p className="text-xs text-gray-400">
                    {fechaHora(pago.fecha_creacion)}{pago.usuario ? ` · ${pago.usuario}` : ""}
                  </p>
                </div>
                {cambiable && !abierto && (
                  <button
                    type="button"
                    disabled={!!procesando}
                    onClick={() => { setEditando(pago.id); setMedio(null); }}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                  >
                    <Icon name="mdi:swap-horizontal" size={16} />
                    Cambiar medio
                  </button>
                )}
                {!MEDIOS_CAMBIABLES.includes(pago.medio_pago) && (
                  <span className="text-xs text-gray-400">El crédito se corrige en Cuentas por cobrar</span>
                )}
              </div>

              {abierto && (
                <div className="mt-3 space-y-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <div role="radiogroup" aria-label="Nuevo medio de pago" className="flex flex-wrap gap-2">
                    {medios.filter((o) => Number(o.valor_entero) !== pago.medio_pago).map((o) => {
                      const valor = Number(o.valor_entero);
                      const activo = medio === valor;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          role="radio"
                          aria-checked={activo}
                          disabled={ocupado}
                          onClick={() => setMedio(valor)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${activo
                            ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"}`}
                        >
                          {o.nombre}
                        </button>
                      );
                    })}
                  </div>
                  {pago.estado_turno === 2 && (
                    <p className="rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                      La caja de este pago ya está cerrada: se recalcularán su efectivo esperado y su diferencia.
                      Lo que declaró el cajero no cambia.
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" disabled={ocupado} onClick={() => setEditando(null)}>
                      Cancelar
                    </Button>
                    <Button size="sm" disabled={!medio || ocupado} onClick={() => void confirmar(pago)}>
                      {ocupado ? "Guardando..." : "Confirmar cambio"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {anulados.length > 0 && (
        <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
          <p className="font-medium">Pagos reemplazados</p>
          {anulados.map((p) => (
            <p key={p.id}>
              {p.nombre_medio} · {soles(p.monto)} · cambiado el {fechaHora(p.fecha_modificacion)}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
