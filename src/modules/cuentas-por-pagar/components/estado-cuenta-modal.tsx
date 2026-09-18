"use client";

import Badge from "@/components/ui/badge/Badge";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { TIPO_MOVIMIENTO, type EstadoCuenta, type MovimientoCxp } from "../types/cxp.types";
import { formatearFecha, formatearSoles } from "../utils/formato";

type EstadoCuentaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  estadoCuenta: EstadoCuenta | null;
  isLoading: boolean;
  onAnular: (mov: MovimientoCxp) => void;
};

/**
 * Estado de cuenta de un proveedor.
 *
 * Es el documento que se le enseña al proveedor cuando hay discrepancia sobre
 * cuánto se le debe: muestra cada movimiento con el saldo que quedó después.
 *
 * Uso Modal directo y no FormModal porque no hay nada que guardar, solo leer.
 *
 * El botón de anular solo aparece en el primer movimiento de la lista (el más
 * reciente), que es el único que el backend permite anular: anular uno del
 * medio dejaría inconsistentes los saldos guardados de los posteriores.
 */
export function EstadoCuentaModal({
  isOpen,
  onClose,
  estadoCuenta,
  isLoading,
  onAnular,
}: EstadoCuentaModalProps) {
  const prov = estadoCuenta?.proveedor;
  const movimientos = estadoCuenta?.movimientos ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[780px] p-0">
      <div className="flex max-h-[85vh] flex-col">
        <div className="shrink-0 border-b border-gray-100 px-6 pt-6 pb-4 dark:border-gray-800">
          <h4 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
            Estado de cuenta
          </h4>
          {prov && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {prov.nombre}
              {prov.num_documento && ` · ${prov.num_documento}`}
              {prov.telefono && ` · ${prov.telefono}`}
            </p>
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {isLoading || !prov ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Cargando estado de cuenta...
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div
                  className={`rounded-xl border p-3.5 ${
                    Number(prov.saldo) > 0
                      ? "border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10"
                      : "border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10"
                  }`}
                >
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {Number(prov.saldo) > 0 ? "Deuda pendiente" : "Al día"}
                  </p>
                  <p
                    className={`mt-1 text-xl font-bold ${
                      Number(prov.saldo) > 0
                        ? "text-error-700 dark:text-error-400"
                        : "text-success-700 dark:text-success-400"
                    }`}
                  >
                    {formatearSoles(prov.saldo)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-3.5 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total comprado
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white">
                    {formatearSoles(prov.total_cargos)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-3.5 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total abonado
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white">
                    {formatearSoles(prov.total_abonos)}
                  </p>
                </div>
              </div>

              <div>
                <h5 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                  Últimos movimientos ({movimientos.length})
                </h5>

                {movimientos.length === 0 ? (
                  <p className="rounded-xl border border-gray-200 px-4 py-6 text-center text-xs text-gray-500 dark:border-gray-700">
                    Sin movimientos registrados
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Fecha
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Movimiento
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Monto
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Saldo
                          </th>
                          <th className="px-4 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {movimientos.map((mov, idx) => {
                          const esCargo =
                            mov.tipo_movimiento === TIPO_MOVIMIENTO.CARGO;
                          // Solo el primero (más reciente) es anulable.
                          const esUltimo = idx === 0;

                          return (
                            <tr key={mov.id}>
                              <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                                <span className="block text-xs">
                                  {formatearFecha(mov.fecha_movimiento)}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  Sem. {mov.semana}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge
                                  size="sm"
                                  color={esCargo ? "error" : "success"}
                                >
                                  {mov.tipo_movimiento_nombre}
                                </Badge>
                                {mov.observacion && (
                                  <span className="mt-0.5 block max-w-[220px] truncate text-[11px] text-gray-500 dark:text-gray-400">
                                    {mov.observacion}
                                  </span>
                                )}
                              </td>
                              <td
                                className={`px-4 py-2.5 text-right font-semibold ${
                                  esCargo
                                    ? "text-error-600 dark:text-error-400"
                                    : "text-success-600 dark:text-success-400"
                                }`}
                              >
                                {esCargo ? "+" : "−"} {formatearSoles(mov.monto)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-300">
                                {formatearSoles(mov.saldo_resultante)}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                {esUltimo && (
                                  <button
                                    type="button"
                                    onClick={() => onAnular(mov)}
                                    className="text-gray-400 transition-colors hover:text-error-600"
                                    title="Anular este movimiento (solo el más reciente)"
                                  >
                                    <Icon
                                      name="mdi:close-circle-outline"
                                      size={17}
                                    />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Icon name="mdi:information-outline" size={14} className="mt-0.5 shrink-0" />
                  Solo se puede anular el movimiento más reciente. Anular uno
                  anterior dejaría los saldos del historial inconsistentes; para
                  corregir algo más viejo, registra un ajuste.
                </p>
              </div>
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
