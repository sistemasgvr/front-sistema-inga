"use client";

import Badge from "@/components/ui/badge/Badge";
import { Icon } from "@/components/ui/icon";
import type { ComandaVenta } from "../types/ventas.types";
import { ESTADO_IMPRESION, TIPO_COMANDA, fechaHora } from "../utils/formato";

type ComandasVentaProps = {
  comandas: ComandaVenta[];
  puedeReimprimir: boolean;
  procesando: string | null;
  onReimprimir: (idComanda: number) => Promise<boolean>;
};

export function ComandasVenta({ comandas, puedeReimprimir, procesando, onReimprimir }: ComandasVentaProps) {
  return (
    <section>
      <h5 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Comandas e impresiones</h5>
      {comandas.length === 0 ? (
        <p className="text-sm text-gray-500">Este pedido no tiene comandas registradas.</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
          {comandas.map((c) => {
            const estado = c.estado_impresion ? ESTADO_IMPRESION[c.estado_impresion] : null;
            return (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {TIPO_COMANDA[c.tipo] ?? c.tipo} #{c.numero}
                    <span className="font-normal text-gray-500"> · {c.estacion ?? "Sin estación"}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {fechaHora(c.fecha_envio)}
                    {c.tipo === "COMANDA" ? ` · ${c.cantidad_items} ítems` : ""}
                  </p>
                  {c.error_impresion && <p className="text-xs text-error-500">{c.error_impresion}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge size="sm" color={estado?.color ?? "light"}>{estado?.label ?? "Sin registro"}</Badge>
                  {puedeReimprimir && (
                    <button
                      type="button"
                      disabled={!!procesando}
                      onClick={() => void onReimprimir(c.id)}
                      title="Volver a imprimir"
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                    >
                      <Icon name="mdi:printer-outline" size={15} />
                      {procesando === `comanda-${c.id}` ? "Enviando..." : "Reimprimir"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
