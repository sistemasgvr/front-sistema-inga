"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import { FormEvent, useEffect, useState } from "react";
import type { SaldoCliente } from "../types/cxc.types";
import { formatearSoles } from "../utils/formato";

type AjusteFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (monto: number, motivo: string) => Promise<void>;
  cliente: SaldoCliente | null;
  isSaving: boolean;
};

/**
 * Corrección manual del saldo de un cliente.
 *
 * Es la válvula de escape del módulo: una nota de crédito, un almuerzo cargado
 * dos veces, o un consumo de una quincena ya cerrada que no se puede anular.
 *
 * Dos decisiones de diseño:
 *
 * 1. No pido un monto con signo en un solo campo. Escribir "-15" en una caja de
 *    texto es fácil de equivocar y difícil de leer después. En su lugar pregunto
 *    primero la dirección (aumentar o reducir) con dos botones grandes, y el
 *    monto siempre en positivo. El signo lo armo yo al enviar.
 *
 * 2. El motivo es obligatorio y va en un textarea, no en un input de una línea.
 *    Un ajuste sin explicación es un agujero en la auditoría, y el tamaño del
 *    campo comunica que se espera una frase, no dos palabras.
 */
export function AjusteFormModal({
  isOpen,
  onClose,
  onSubmit,
  cliente,
  isSaving,
}: AjusteFormModalProps) {
  const [direccion, setDireccion] = useState<"aumentar" | "reducir">("reducir");
  const [monto, setMonto] = useState(0);
  const [motivo, setMotivo] = useState("");
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Arranco en "reducir" porque es el caso frecuente: casi todos los ajustes
    // nacen de un consumo cargado de más.
    setDireccion("reducir");
    setMonto(0);
    setMotivo("");
    setIntentoEnviar(false);
    setServerError(null);
  }, [isOpen]);

  const saldoActual = Number(cliente?.saldo ?? 0);
  const delta = direccion === "aumentar" ? monto : -monto;
  const saldoProyectado = saldoActual + delta;

  const errorMonto =
    intentoEnviar && monto <= 0
      ? "El monto debe ser mayor a cero."
      : direccion === "reducir" && monto > saldoActual
        ? `Dejaría la cuenta en negativo. El saldo actual es ${formatearSoles(saldoActual)}.`
        : undefined;

  const errorMotivo =
    intentoEnviar && motivo.trim().length === 0
      ? "Explica por qué se ajusta el saldo."
      : undefined;

  const invalido =
    monto <= 0 ||
    motivo.trim().length === 0 ||
    (direccion === "reducir" && monto > saldoActual);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);
    setServerError(null);

    if (!cliente || invalido) return;

    try {
      await onSubmit(delta, motivo);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "No se pudo registrar el ajuste.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Ajustar saldo"
      subtitle={
        cliente
          ? `Corrección manual de la cuenta de ${cliente.nombre}.`
          : "Corrección manual del saldo."
      }
      isSaving={isSaving}
      submitText="Registrar ajuste"
    >
      {serverError && (
        <Alert variant="error" title="Error" message={serverError} />
      )}

      <Alert
        variant="info"
        title="El ajuste queda en el historial"
        message="No borra nada: agrega un movimiento marcado como AJUSTE con el motivo que escribas. Es lo que se ve después al revisar por qué cambió el saldo."
      />

      <div>
        <Label>¿Qué hace este ajuste? *</Label>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              {
                valor: "reducir" as const,
                titulo: "Reduce la deuda",
                detalle: "Se le cargó de más",
                icono: "mdi:trending-down",
                activo: "border-success-500 bg-success-50 dark:bg-success-500/10",
                texto: "text-success-700 dark:text-success-400",
              },
              {
                valor: "aumentar" as const,
                titulo: "Aumenta la deuda",
                detalle: "Faltó cargarle algo",
                icono: "mdi:trending-up",
                activo: "border-error-500 bg-error-50 dark:bg-error-500/10",
                texto: "text-error-700 dark:text-error-400",
              },
            ]
          ).map((op) => {
            const elegido = direccion === op.valor;
            return (
              <button
                key={op.valor}
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setServerError(null);
                  setDireccion(op.valor);
                }}
                className={`rounded-xl border-2 p-3 text-start transition-colors disabled:opacity-50 ${
                  elegido
                    ? op.activo
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name={op.icono}
                    size={18}
                    className={elegido ? op.texto : "text-gray-400"}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      elegido ? op.texto : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {op.titulo}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {op.detalle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="monto">Monto del ajuste (S/) *</Label>
        <Input
          id="monto"
          type="number"
          step={0.01}
          min="0"
          value={monto || ""}
          onChange={(e) => {
            setServerError(null);
            setMonto(Number(e.target.value) || 0);
          }}
          placeholder="0.00"
          error={Boolean(errorMonto)}
          hint={errorMonto ?? "Siempre en positivo. La dirección la eliges arriba."}
          disabled={isSaving}
        />
      </div>

      <div>
        <Label htmlFor="motivo">Motivo *</Label>
        <TextArea
          value={motivo}
          onChange={(value) => {
            setServerError(null);
            setMotivo(value);
          }}
          rows={3}
          placeholder="Ej. Se cargó dos veces el almuerzo del 12/09"
          error={Boolean(errorMotivo)}
          hint={errorMotivo}
          disabled={isSaving}
        />
      </div>

      {/* El antes y después, para que nadie confirme un ajuste sin ver en qué
          deja la cuenta. */}
      {cliente && monto > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Saldo actual</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {formatearSoles(saldoActual)}
            </p>
          </div>
          <Icon name="mdi:arrow-right" size={18} className="text-gray-400" />
          <div className="text-end">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Quedaría en
            </p>
            <p
              className={`text-lg font-bold ${
                saldoProyectado > 0
                  ? "text-error-600 dark:text-error-400"
                  : "text-success-600 dark:text-success-400"
              }`}
            >
              {formatearSoles(saldoProyectado)}
            </p>
          </div>
        </div>
      )}
    </FormModal>
  );
}
