"use client";

import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { useState } from "react";
import type { ReporteCxc } from "../types/cxc.types";
import { formatearSoles } from "../utils/formato";

type ReporteQuincenaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reporte: ReporteCxc | null;
};

/**
 * El consolidado de la quincena, agrupado por empresa y con el detalle de cada
 * trabajador.
 *
 * Es EL entregable del módulo: a inicios de cada mes hay que mandarle a cada
 * empresa del consorcio lo que consumió su gente, para que pague y luego se lo
 * descuente por planilla.
 *
 * Empiezo con las empresas colapsadas y solo el total a la vista, porque lo
 * primero que se quiere saber es cuánto le toca a cada una. El detalle de
 * personas se abre cuando alguien lo pide — típicamente cuando la empresa
 * pregunta por qué le sale ese monto.
 *
 * La exportación a Excel/PDF queda para cuando se defina el formato exacto con
 * el cliente. Mientras tanto, "Copiar" deja el detalle listo para pegarlo en un
 * correo o un WhatsApp, que es como se está enviando hoy.
 */
export function ReporteQuincenaModal({
  isOpen,
  onClose,
  reporte,
}: ReporteQuincenaModalProps) {
  const [abiertas, setAbiertas] = useState<Set<number | null>>(new Set());
  const [copiada, setCopiada] = useState<number | null | "todo">(null);

  function alternar(id: number | null) {
    setAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Arma el texto plano de una empresa, listo para pegar en un correo. */
  function textoEmpresa(indice: number): string {
    if (!reporte) return "";
    const emp = reporte.empresas[indice];
    const lineas = [
      `${emp.nombre_convenio} — ${reporte.periodo.etiqueta}`,
      "",
      ...emp.personas.map(
        (p) =>
          `${p.nombre_persona}${p.num_documento ? ` (${p.num_documento})` : ""}: ${formatearSoles(p.neto)}`,
      ),
      "",
      `TOTAL: ${formatearSoles(emp.total_neto)}`,
    ];
    return lineas.join("\n");
  }

  async function copiar(texto: string, marca: number | null | "todo") {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiada(marca);
      window.setTimeout(() => setCopiada(null), 2000);
    } catch {
      // Sin permiso de portapapeles no hago nada: el detalle sigue a la vista
      // para copiarlo a mano.
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[820px] p-6">
      <div className="mb-5">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Reporte de la quincena
        </h4>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {reporte?.periodo.etiqueta ?? "Cargando..."}
        </p>
      </div>

      {!reporte ? (
        <p className="py-10 text-center text-sm text-gray-500">
          Cargando el reporte...
        </p>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Consumido
              </p>
              <p className="mt-1 text-lg font-bold text-error-600 dark:text-error-400">
                {formatearSoles(reporte.total_cargos)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Abonado</p>
              <p className="mt-1 text-lg font-bold text-success-600 dark:text-success-400">
                {formatearSoles(reporte.total_abonos)}
              </p>
            </div>
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
              <p className="text-xs text-brand-700 dark:text-brand-300">
                A cobrar
              </p>
              <p className="mt-1 text-lg font-bold text-brand-700 dark:text-brand-400">
                {formatearSoles(reporte.total_neto)}
              </p>
            </div>
          </div>

          {reporte.empresas.length === 0 ? (
            <div className="rounded-xl border border-gray-200 py-12 text-center dark:border-gray-800">
              <Icon
                name="mdi:file-document-outline"
                size={40}
                className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
              />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                No hubo movimientos en esta quincena
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Cambia el período para ver otro corte.
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
              {reporte.empresas.map((emp, indice) => {
                const abierta = abiertas.has(emp.id_convenio);

                return (
                  <div
                    key={emp.id_convenio ?? "sin-convenio"}
                    className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
                      <button
                        type="button"
                        onClick={() => alternar(emp.id_convenio)}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-start"
                      >
                        <Icon
                          name={
                            abierta ? "mdi:chevron-down" : "mdi:chevron-right"
                          }
                          size={20}
                          className="shrink-0 text-gray-400"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {emp.nombre_convenio}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {emp.cantidad_personas}{" "}
                            {emp.cantidad_personas === 1
                              ? "persona"
                              : "personas"}
                          </p>
                        </div>
                      </button>

                      <div className="text-end">
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                          {formatearSoles(emp.total_neto)}
                        </p>
                        {Number(emp.total_abono) > 0 && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {formatearSoles(emp.total_consumo)} − abonos
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copiar(textoEmpresa(indice), emp.id_convenio)
                        }
                        className="shrink-0 text-gray-400 transition-colors hover:text-brand-500"
                        title="Copiar el detalle para enviarlo a la empresa"
                      >
                        <Icon
                          name={
                            copiada === emp.id_convenio
                              ? "mdi:check"
                              : "mdi:content-copy"
                          }
                          size={17}
                          className={
                            copiada === emp.id_convenio
                              ? "text-success-500"
                              : undefined
                          }
                        />
                      </button>
                    </div>

                    {abierta && (
                      <ul className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {emp.personas.map((p) => (
                          <li
                            key={p.id_persona}
                            className="flex items-center justify-between px-4 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm text-gray-700 dark:text-gray-200">
                                {p.nombre_persona}
                              </p>
                              {p.num_documento && (
                                <p className="font-mono text-[11px] text-gray-400">
                                  {p.num_documento}
                                </p>
                              )}
                            </div>
                            <div className="text-end">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {formatearSoles(p.neto)}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {p.cantidad_movimientos}{" "}
                                {p.cantidad_movimientos === 1
                                  ? "movimiento"
                                  : "movimientos"}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
