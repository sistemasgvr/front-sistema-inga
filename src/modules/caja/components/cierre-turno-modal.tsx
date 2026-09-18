"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  DENOMINACIONES_SOLES,
  type ArqueoLinea,
  type TurnoItem,
} from "../types/caja.types";
import { formatearSoles } from "../utils/formato";

type CierreTurnoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    detalle: ArqueoLinea[],
    montoContado: number,
    observacion?: string,
  ) => Promise<void>;
  turno: TurnoItem;
  isSaving: boolean;
};

/**
 * Modal de cierre de turno con arqueo por denominaciones.
 *
 * La idea es que el cajero no haga ninguna cuenta: pone cuántos billetes y
 * monedas tiene de cada valor, y la pantalla va sumando sola. El total contado
 * se compara contra el efectivo esperado y muestra la diferencia en vivo, en
 * verde o rojo, ANTES de confirmar.
 *
 * Esto es a propósito: si la diferencia recién apareciera después de cerrar,
 * el cajero ya no podría volver a contar. Mostrarla antes le da la oportunidad
 * de revisar, que es justo lo que uno quiere que pase.
 */
export function CierreTurnoModal({
  isOpen,
  onClose,
  onSubmit,
  turno,
  isSaving,
}: CierreTurnoModalProps) {
  // Guardo las cantidades por denominación en un objeto simple.
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [observacion, setObservacion] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCantidades({});
      setObservacion("");
      setServerError(null);
    }
  }, [isOpen]);

  const totalContado = useMemo(
    () =>
      DENOMINACIONES_SOLES.reduce(
        (suma, den) => suma + den * (cantidades[den] || 0),
        0,
      ),
    [cantidades],
  );

  const esperado = Number(turno.efectivo_esperado ?? 0);
  // Uso la misma resta que guarda el backend (`sistema − declarado`) para que el
  // número que ve el cajero acá sea exactamente el que queda registrado.
  // Con esta convención: positiva = FALTANTE, negativa = SOBRANTE.
  const diferencia = esperado - totalContado;
  // Comparo con un centavo de tolerancia para no marcar descuadre por errores
  // de redondeo de los decimales.
  const cuadra = Math.abs(diferencia) < 0.01;
  const faltante = diferencia > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setServerError(null);

    const detalle: ArqueoLinea[] = DENOMINACIONES_SOLES.filter(
      (den) => (cantidades[den] || 0) > 0,
    ).map((den) => ({ denominacion: den, cantidad: cantidades[den] }));

    // El backend exige al menos una línea. Si el cajón quedó realmente vacío,
    // mando una línea en cero de la denominación más chica para dejar
    // constancia del conteo en lugar de bloquear el cierre.
    if (detalle.length === 0) {
      detalle.push({ denominacion: 0.1, cantidad: 0 });
    }

    try {
      await onSubmit(detalle, totalContado, observacion);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "No se pudo cerrar el turno.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Cerrar turno"
      subtitle="Cuenta el efectivo del cajón. El sistema calcula el total y la diferencia."
      isSaving={isSaving}
      maxWidth="max-w-[760px]"
      submitText={cuadra ? "Cerrar turno" : "Cerrar con diferencia"}
    >
      {serverError && (
        <Alert variant="error" title="Error al cerrar" message={serverError} />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Tabla de conteo */}
        <div>
          <Label>Conteo de billetes y monedas</Label>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Valor
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Cantidad
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {DENOMINACIONES_SOLES.map((den) => {
                  const cantidad = cantidades[den] || 0;
                  return (
                    <tr key={den}>
                      <td className="px-3 py-1.5 font-medium text-gray-700 dark:text-gray-300">
                        {formatearSoles(den)}
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          min={0}
                          value={cantidad || ""}
                          placeholder="0"
                          disabled={isSaving}
                          onChange={(e) => {
                            const valor = Math.max(0, Number(e.target.value) || 0);
                            setCantidades((p) => ({ ...p, [den]: valor }));
                          }}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1 text-center text-sm focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-400">
                        {cantidad > 0 ? formatearSoles(den * cantidad) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comparación en vivo */}
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Efectivo esperado
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {formatearSoles(esperado)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Total contado
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {formatearSoles(totalContado)}
              </span>
            </div>

            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
              {/* Faltante en rojo, sobrante en ámbar: que falte plata es más
                  grave que que sobre, y el color debe decirlo sin leer. */}
              <div
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                  cuadra
                    ? "bg-success-50 dark:bg-success-500/10"
                    : faltante
                      ? "bg-error-50 dark:bg-error-500/10"
                      : "bg-warning-50 dark:bg-warning-500/10"
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Icon
                    name={
                      cuadra
                        ? "mdi:check-circle-outline"
                        : faltante
                          ? "mdi:alert-circle-outline"
                          : "mdi:trending-up"
                    }
                    size={18}
                    className={
                      cuadra
                        ? "text-success-600"
                        : faltante
                          ? "text-error-500"
                          : "text-warning-500"
                    }
                  />
                  <span
                    className={
                      cuadra
                        ? "text-success-700 dark:text-success-400"
                        : faltante
                          ? "text-error-600 dark:text-error-400"
                          : "text-warning-600 dark:text-warning-400"
                    }
                  >
                    {cuadra ? "Cuadra" : faltante ? "Faltante" : "Sobrante"}
                  </span>
                </span>
                <span
                  className={`text-lg font-bold ${
                    cuadra
                      ? "text-success-700 dark:text-success-400"
                      : faltante
                        ? "text-error-600 dark:text-error-400"
                        : "text-warning-600 dark:text-warning-400"
                  }`}
                >
                  {formatearSoles(Math.abs(diferencia))}
                </span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="observacion">
              Observación {!cuadra && <span className="text-error-500">*</span>}
            </Label>
            <Input
              id="observacion"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder={
                cuadra
                  ? "Opcional"
                  : "Explica la diferencia (ej. vuelto mal dado)"
              }
              disabled={isSaving}
            />
          </div>

          {!cuadra && (
            <Alert
              variant="warning"
              title="El turno no cuadra"
              message="Puedes cerrarlo igual, pero la diferencia queda registrada y el administrador la verá en el historial. Si aún puedes, vuelve a contar."
            />
          )}
        </div>
      </div>
    </FormModal>
  );
}
