"use client";

import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { TIPO_MOVIMIENTO, type ResumenTurno } from "../types/caja.types";
import { formatearFechaHora, formatearSoles } from "../utils/formato";

type TurnoDetalleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  detalle: ResumenTurno | null;
  isLoading: boolean;
};

/**
 * Detalle de un turno cerrado: es el "comprobante" que revisa el administrador
 * cuando quiere entender por qué una caja no cuadró.
 *
 * Uso Modal directo y no FormModal porque acá no hay nada que guardar, solo que
 * leer. Poner un botón "Guardar" en una vista de solo lectura confunde.
 */
export function TurnoDetalleModal({
  isOpen,
  onClose,
  detalle,
  isLoading,
}: TurnoDetalleModalProps) {
  const turno = detalle?.turno;
  // `monto_diferencia` viene del backend como `sistema − declarado`:
  // positiva = faltante, negativa = sobrante.
  const diferencia = Number(turno?.monto_diferencia ?? 0);
  const cuadra = Math.abs(diferencia) < 0.01;
  const faltante = diferencia > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[760px] p-0">
      <div className="flex max-h-[85vh] flex-col">
        <div className="shrink-0 border-b border-gray-100 px-6 pt-6 pb-4 dark:border-gray-800">
          <h4 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
            Detalle del turno
          </h4>
          {turno && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {turno.nombre_caja} · {turno.nombre_cajero} ·{" "}
              {formatearFechaHora(turno.fecha_apertura)}
              {turno.fecha_cierre && ` → ${formatearFechaHora(turno.fecha_cierre)}`}
            </p>
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {isLoading || !turno ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Cargando detalle...
            </p>
          ) : (
            <>
              {/* Cierre */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 p-3.5 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Esperado por sistema
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">
                    {formatearSoles(turno.monto_cierre_sistema)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-3.5 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Declarado por el cajero
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">
                    {formatearSoles(turno.monto_cierre_declarado)}
                  </p>
                </div>
                <div
                  className={`rounded-xl border p-3.5 ${
                    cuadra
                      ? "border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10"
                      : faltante
                        ? "border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10"
                        : "border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10"
                  }`}
                >
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {cuadra ? "Cuadró" : faltante ? "Faltante" : "Sobrante"}
                  </p>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      cuadra
                        ? "text-success-700 dark:text-success-400"
                        : faltante
                          ? "text-error-600 dark:text-error-400"
                          : "text-warning-600 dark:text-warning-400"
                    }`}
                  >
                    {formatearSoles(Math.abs(diferencia))}
                  </p>
                </div>
              </div>

              {/* Ventas por medio */}
              <div>
                <h5 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                  Ventas por medio de pago
                </h5>
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-4 dark:border-gray-700">
                  {[
                    { etiqueta: "Efectivo", valor: turno.ventas_efectivo ?? 0 },
                    { etiqueta: "Yape", valor: turno.ventas_yape ?? 0 },
                    { etiqueta: "Tarjeta", valor: turno.ventas_tarjeta ?? 0 },
                    { etiqueta: "Crédito", valor: turno.ventas_credito ?? 0 },
                  ].map((m) => (
                    <div key={m.etiqueta}>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {m.etiqueta}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {formatearSoles(m.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Movimientos */}
              <div>
                <h5 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                  Movimientos de caja ({detalle.movimientos.length})
                </h5>
                {detalle.movimientos.length === 0 ? (
                  <p className="rounded-xl border border-gray-200 px-4 py-5 text-center text-xs text-gray-500 dark:border-gray-700">
                    Sin movimientos registrados
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
                    {detalle.movimientos.map((mov) => {
                      const esIngreso = mov.tipo_movimiento === TIPO_MOVIMIENTO.INGRESO;
                      return (
                        <li
                          key={mov.id}
                          className="flex items-center justify-between px-4 py-2.5"
                        >
                          <div>
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                              {mov.motivo}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatearFechaHora(mov.fecha_creacion)}
                            </p>
                          </div>
                          <span
                            className={`text-sm font-semibold ${
                              esIngreso ? "text-success-600" : "text-error-500"
                            }`}
                          >
                            {esIngreso ? "+" : "−"} {formatearSoles(mov.monto)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Arqueo */}
              <div>
                <h5 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                  Arqueo — total contado {formatearSoles(detalle.total_arqueo)}
                </h5>
                {detalle.arqueo.length === 0 ? (
                  <p className="rounded-xl border border-gray-200 px-4 py-5 text-center text-xs text-gray-500 dark:border-gray-700">
                    No se registró conteo de billetes
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Denominación
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Cantidad
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {detalle.arqueo.map((linea) => (
                          <tr key={linea.id}>
                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                              {formatearSoles(linea.denominacion)}
                            </td>
                            <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">
                              {linea.cantidad}
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-gray-800 dark:text-white">
                              {formatearSoles(linea.monto_subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {turno.observacion && (
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <Icon name="mdi:note-text-outline" size={15} />
                    Observaciones
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {turno.observacion}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
