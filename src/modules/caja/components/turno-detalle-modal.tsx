"use client";

import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { TIPO_MOVIMIENTO, type ResumenTurno } from "../types/caja.types";
import { formatearFechaHora, formatearSoles } from "../utils/formato";
import { mensajeQuienPuedeCerrar } from "../utils/permisos-cierre";
import { ResumenFlujo, TONO_FLUJO } from "./resumen-flujo";

type TurnoDetalleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  detalle: ResumenTurno | null;
  isLoading: boolean;
  /** El usuario abrió la caja o es administrador. */
  puedeCerrar?: boolean;
  /** Si llega, un turno abierto ofrece cerrarse desde el detalle. */
  onCerrarTurno?: () => void;
};

/**
 * Detalle de un turno: es el "comprobante" que revisa el administrador
 * cuando quiere entender por qué una caja no cuadró. Entradas en verde y
 * salidas en rojo, con ícono y signo, para no confundir una venta con un pago.
 *
 * Uso Modal directo y no FormModal porque acá no hay nada que guardar, solo que
 * leer. Poner un botón "Guardar" en una vista de solo lectura confunde.
 */
export function TurnoDetalleModal({
  isOpen,
  onClose,
  detalle,
  isLoading,
  puedeCerrar = false,
  onCerrarTurno,
}: TurnoDetalleModalProps) {
  const turno = detalle?.turno;
  // `monto_diferencia` viene del backend como `sistema − declarado`:
  // positiva = faltante, negativa = sobrante.
  const diferencia = Number(turno?.monto_diferencia ?? 0);
  const cuadra = Math.abs(diferencia) < 0.01;
  const faltante = diferencia > 0;
  const abierto = turno?.estado_turno !== 2 && !turno?.fecha_cierre;

  // Mismo cálculo que el backend (caj_calcular_totales_turno); se usa su
  // efectivo_esperado y solo se recalcula si no llegó.
  type LineaCajon = { etiqueta: string; valor: number; tipo?: "entrada" | "salida" };
  const cuentaCajon: LineaCajon[] = turno
    ? ([
        { etiqueta: "Apertura", valor: Number(turno.monto_apertura ?? 0) },
        { etiqueta: "Ventas en efectivo", valor: Number(turno.ventas_efectivo ?? 0), tipo: "entrada" },
        { etiqueta: "Cobranzas en efectivo", valor: Number(turno.cobranzas_efectivo ?? 0), tipo: "entrada" },
        { etiqueta: "Ingresos manuales", valor: Number(turno.ingresos_caja ?? 0), tipo: "entrada" },
        { etiqueta: "Pagos y gastos en efectivo", valor: Number(turno.pagos_efectivo ?? 0), tipo: "salida" },
        { etiqueta: "Egresos manuales", valor: Number(turno.egresos_caja ?? 0), tipo: "salida" },
      ] satisfies LineaCajon[]).filter((l: LineaCajon) => !l.tipo || l.valor !== 0 || l.etiqueta === "Ventas en efectivo")
    : [];
  const esperado = Number(
    turno?.efectivo_esperado ??
      cuentaCajon.reduce((s, l) => s + (l.tipo === "salida" ? -l.valor : l.valor), 0),
  );

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
              {/* Cierre. Un turno abierto todavía no tiene montos de cierre:
                  mostrar "Cuadró S/ 0.00" ahí haría creer que ya se contó. */}
              {abierto ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5 dark:border-blue-500/30 dark:bg-blue-500/10">
                  <div className="flex items-center gap-2.5">
                    <Icon name="mdi:lock-open-variant-outline" size={20} className="text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Turno abierto</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        El cuadre (declarado y diferencia) se calcula al cerrar el turno.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Efectivo esperado ahora</p>
                    <p className={`text-lg font-bold ${esperado < 0 ? "text-error-600" : "text-gray-800 dark:text-white"}`}>
                      {formatearSoles(esperado)}
                    </p>
                  </div>
                </div>
              ) : (
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
              )}

              {/* Cuenta del cajón: de dónde sale el efectivo esperado. */}
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                  <Icon name="mdi:cash-register" size={18} className="text-gray-500" />
                  Efectivo del cajón
                </h5>
                <dl className="space-y-1.5 text-sm">
                  {cuentaCajon.map((linea) => (
                    <div key={linea.etiqueta} className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        {linea.tipo && (
                          <Icon name={TONO_FLUJO[linea.tipo].icono} size={14} className={TONO_FLUJO[linea.tipo].texto} />
                        )}
                        {linea.etiqueta}
                      </dt>
                      <dd className={`font-medium ${linea.tipo && linea.valor ? TONO_FLUJO[linea.tipo].texto : "text-gray-700 dark:text-gray-300"}`}>
                        {linea.tipo && linea.valor ? `${TONO_FLUJO[linea.tipo].signo} ` : ""}
                        {formatearSoles(linea.valor)}
                      </dd>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-2 dark:border-gray-700">
                    <dt className="font-semibold text-gray-800 dark:text-white">
                      {abierto ? "Debería haber ahora" : "Esperado al cierre"}
                    </dt>
                    <dd className={`font-bold ${esperado < 0 ? "text-error-600" : "text-gray-900 dark:text-white"}`}>
                      {formatearSoles(esperado)}
                    </dd>
                  </div>
                </dl>
                {esperado < 0 && (
                  <p className="mt-2 text-xs text-error-600 dark:text-error-400">
                    Salió más efectivo del que entró: revisa si algún pago debió registrarse por Yape o transferencia.
                  </p>
                )}
              </div>

              <ResumenFlujo
                tipo="entrada"
                titulo="Entradas · ventas"
                descripcion="Lo cobrado en el turno, por medio de pago"
                filas={[
                  { etiqueta: "Efectivo", valor: turno.ventas_efectivo ?? 0 },
                  { etiqueta: "Yape", valor: turno.ventas_yape ?? 0 },
                  { etiqueta: "Tarjeta", valor: turno.ventas_tarjeta ?? 0 },
                  { etiqueta: "Crédito", valor: turno.ventas_credito ?? 0, neutro: true, nota: "Queda por cobrar, no entra a caja" },
                ]}
                etiquetaTotal="Total cobrado"
                pie="Solo el efectivo entra al cajón."
              />

              {(turno.total_cobranzas ?? 0) > 0 && (
                <ResumenFlujo
                  tipo="entrada"
                  titulo="Entradas · cobranzas"
                  descripcion="Abonos de cuentas por cobrar recibidos en el turno"
                  filas={[
                    { etiqueta: "Efectivo", valor: turno.cobranzas_efectivo ?? 0 },
                    { etiqueta: "Yape", valor: turno.cobranzas_yape ?? 0 },
                    { etiqueta: "Transferencia", valor: turno.cobranzas_tarjeta ?? 0 },
                  ]}
                  etiquetaTotal="Total cobrado"
                  pie="Solo el efectivo entra al cajón."
                />
              )}

              <ResumenFlujo
                tipo="salida"
                titulo="Salidas · pagos y gastos"
                descripcion="Compras del día, gastos, proveedores y planilla pagados en el turno"
                filas={[
                  { etiqueta: "Efectivo", valor: turno.pagos_efectivo ?? 0 },
                  { etiqueta: "Yape", valor: turno.pagos_yape ?? 0 },
                  { etiqueta: "Transferencia", valor: turno.pagos_tarjeta ?? 0 },
                ]}
                etiquetaTotal="Total pagado"
                pie="Solo el efectivo sale del cajón."
              />

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
                      const tocaCajon = (mov.medio_pago ?? 1) === 1;
                      const tono = TONO_FLUJO[esIngreso ? "entrada" : "salida"];
                      return (
                        <li
                          key={mov.clave ?? mov.id}
                          className="flex items-center justify-between gap-3 px-4 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tono.insignia}`}
                            title={esIngreso ? "Entrada" : "Salida"}
                          >
                            <Icon name={tono.icono} size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                              {mov.motivo}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatearFechaHora(mov.fecha_creacion)}
                              {mov.origen_nombre && ` · ${mov.origen_nombre}`}
                              {mov.medio_pago_nombre && ` · ${mov.medio_pago_nombre}`}
                              {!tocaCajon && " · No toca el cajón"}
                            </p>
                          </div>
                          </div>
                          <span
                            className={`shrink-0 text-sm font-semibold ${
                              !tocaCajon
                                ? "text-gray-500 dark:text-gray-400"
                                : esIngreso
                                  ? "text-success-600"
                                  : "text-error-500"
                            }`}
                            title={tocaCajon ? undefined : "No toca el cajón"}
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

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          {turno && abierto && onCerrarTurno && (
            puedeCerrar ? (
              <button
                type="button"
                onClick={onCerrarTurno}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                <Icon name="mdi:lock-outline" size={17} />
                Cerrar turno
              </button>
            ) : (
              <p className="mr-auto flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Icon name="mdi:lock-outline" size={15} className="shrink-0" />
                {mensajeQuienPuedeCerrar(turno)}
              </p>
            )
          )}
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
