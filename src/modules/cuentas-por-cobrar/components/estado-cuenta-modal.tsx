"use client";

import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import type { EstadoCuentaCxc, MovimientoCxc } from "../types/cxc.types";
import { formatearFecha, formatearSoles, nivelCredito } from "../utils/formato";

type EstadoCuentaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  estadoCuenta: EstadoCuentaCxc | null;
  isLoading: boolean;
  onAnular: (mov: MovimientoCxc) => void;
};

/**
 * Estado de cuenta de un cliente: su saldo, su crédito y todo su historial.
 *
 * Es lo que se le muestra al trabajador del consorcio cuando pregunta "¿cuánto
 * debo?". Por eso el historial va del movimiento más antiguo al más reciente,
 * al revés que el listado general: un estado de cuenta se lee como una cartilla,
 * empieza en cero y va sumando hacia abajo, y la columna de saldo se sigue con
 * el dedo.
 */
export function EstadoCuentaModal({
  isOpen,
  onClose,
  estadoCuenta,
  isLoading,
  onAnular,
}: EstadoCuentaModalProps) {
  const persona = estadoCuenta?.persona;
  const credito = nivelCredito(
    Number(persona?.saldo ?? 0),
    persona?.limite_credito ?? null,
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[760px] p-6">
      <div className="mb-5">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Estado de cuenta
        </h4>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {persona
            ? persona.convenio
              ? `${persona.nombre} — ${persona.convenio}`
              : persona.nombre
            : "Cargando..."}
        </p>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500">
          Cargando estado de cuenta...
        </p>
      ) : !estadoCuenta || !persona ? (
        <p className="py-10 text-center text-sm text-gray-500">
          No se pudo cargar el estado de cuenta.
        </p>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div
              className={`rounded-xl border p-4 ${
                Number(persona.saldo) > 0
                  ? "border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10"
                  : "border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10"
              }`}
            >
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Debe ahora
              </p>
              <p
                className={`mt-1 text-xl font-bold ${
                  Number(persona.saldo) > 0
                    ? "text-error-700 dark:text-error-400"
                    : "text-success-700 dark:text-success-400"
                }`}
              >
                {formatearSoles(persona.saldo)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Consumido
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-700 dark:text-gray-200">
                {formatearSoles(estadoCuenta.total_cargos)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Abonado</p>
              <p className="mt-1 text-lg font-semibold text-gray-700 dark:text-gray-200">
                {formatearSoles(estadoCuenta.total_abonos)}
              </p>
            </div>

            {/* El crédito disponible en una barra, no solo en números: de un
                vistazo se ve si le queda margen para el resto de la quincena. */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Crédito
              </p>
              {credito.nivel === "sin-tope" ? (
                <p className="mt-1 text-sm text-gray-400">Sin tope definido</p>
              ) : (
                <>
                  <p
                    className={`mt-1 text-lg font-semibold ${
                      credito.nivel === "excedido"
                        ? "text-error-600 dark:text-error-400"
                        : credito.nivel === "atencion"
                          ? "text-warning-600 dark:text-warning-400"
                          : "text-success-600 dark:text-success-400"
                    }`}
                  >
                    {credito.porcentaje}%
                  </p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full rounded-full ${
                        credito.nivel === "excedido"
                          ? "bg-error-500"
                          : credito.nivel === "atencion"
                            ? "bg-warning-500"
                            : "bg-success-500"
                      }`}
                      style={{
                        width: `${Math.min(credito.porcentaje ?? 0, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    de {formatearSoles(persona.limite_credito)}
                  </p>
                </>
              )}
            </div>
          </div>

          {persona.supera_limite && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-warning-200 bg-warning-50 p-3.5 dark:border-warning-500/30 dark:bg-warning-500/10">
              <Icon
                name="mdi:alert-outline"
                size={18}
                className="mt-0.5 shrink-0 text-warning-600 dark:text-warning-400"
              />
              <p className="text-sm text-warning-700 dark:text-warning-300">
                Pasó el límite de crédito de su convenio. Se le sigue atendiendo,
                pero conviene avisar a la empresa antes del próximo corte.
              </p>
            </div>
          )}

          <p className="mb-2 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
            Movimientos
          </p>

          <div className="max-h-[340px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800">
            {estadoCuenta.movimientos.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Todavía no tiene movimientos registrados.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {estadoCuenta.movimientos.map((mov) => {
                  const esConsumo = mov.tipo_movimiento === 1;
                  // Un consumo que viene de un pedido no se puede anular por
                  // acá: hay que anular la venta. Lo dejo visible como candado
                  // en vez de esconder el botón, para que se entienda por qué.
                  const ligadoAPedido = mov.id_pedido !== null;

                  return (
                    <li
                      key={mov.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                          esConsumo
                            ? "bg-error-50 text-error-500 dark:bg-error-500/15"
                            : "bg-success-50 text-success-600 dark:bg-success-500/15"
                        }`}
                      >
                        <Icon
                          name={
                            esConsumo ? "mdi:silverware-fork-knife" : "mdi:cash-check"
                          }
                          size={16}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {mov.tipo_movimiento_nombre}
                          <span className="ml-2 text-xs font-normal text-gray-400">
                            {mov.quincena}ª quincena
                          </span>
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {formatearFecha(mov.fecha_creacion)}
                          {mov.observacion ? ` — ${mov.observacion}` : ""}
                        </p>
                      </div>

                      <div className="text-end">
                        <p
                          className={`text-sm font-semibold ${
                            esConsumo
                              ? "text-error-600 dark:text-error-400"
                              : "text-success-600 dark:text-success-400"
                          }`}
                        >
                          {esConsumo ? "+" : "−"}
                          {formatearSoles(mov.monto)}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Saldo: {formatearSoles(mov.saldo_resultante)}
                        </p>
                      </div>

                      {ligadoAPedido ? (
                        <span
                          className="text-gray-300 dark:text-gray-600"
                          title="Viene de un pedido. Para revertirlo, anula la venta."
                        >
                          <Icon name="mdi:lock-outline" size={17} />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAnular(mov)}
                          className="text-gray-400 transition-colors hover:text-error-500"
                          title="Anular movimiento"
                        >
                          <Icon name="mdi:close-circle-outline" size={17} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
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
