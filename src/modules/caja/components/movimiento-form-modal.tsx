"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import { FormEvent, useEffect, useState } from "react";
import {
  TIPO_MOVIMIENTO,
  type MovimientoFormValues,
} from "../types/caja.types";
import { formatearSoles } from "../utils/formato";

type MovimientoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: MovimientoFormValues) => Promise<void>;
  efectivoDisponible: number;
  isSaving: boolean;
};

/**
 * Registra un ingreso o egreso de caja que no viene de una venta.
 *
 * El tipo se elige con dos botones grandes en vez de un desplegable: es la
 * decisión que cambia el signo del movimiento y conviene que sea imposible
 * equivocarse. Además el egreso avisa en el momento si supera el efectivo
 * disponible, sin esperar a que el backend lo rechace.
 */
export function MovimientoFormModal({
  isOpen,
  onClose,
  onSubmit,
  efectivoDisponible,
  isSaving,
}: MovimientoFormModalProps) {
  const [tipo, setTipo] = useState<number>(TIPO_MOVIMIENTO.EGRESO);
  const [monto, setMonto] = useState<number>(0);
  const [motivo, setMotivo] = useState("");
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // El egreso es lo más frecuente (gastos del día), así que lo dejo elegido.
      setTipo(TIPO_MOVIMIENTO.EGRESO);
      setMonto(0);
      setMotivo("");
      setIntentoEnviar(false);
      setServerError(null);
    }
  }, [isOpen]);

  const esEgreso = tipo === TIPO_MOVIMIENTO.EGRESO;
  const excedeDisponible = esEgreso && monto > efectivoDisponible;
  const errorMonto =
    intentoEnviar && monto <= 0
      ? "El monto debe ser mayor a cero."
      : excedeDisponible
        ? `Supera el efectivo disponible (${formatearSoles(efectivoDisponible)}).`
        : undefined;
  const errorMotivo =
    intentoEnviar && !motivo.trim() ? "El motivo es obligatorio." : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);
    setServerError(null);

    if (monto <= 0 || !motivo.trim() || excedeDisponible) return;

    try {
      await onSubmit({ tipo_movimiento: tipo, monto, motivo });
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "No se pudo registrar.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Movimiento de caja"
      subtitle="Dinero que entra o sale del cajón sin ser una venta."
      isSaving={isSaving}
      submitText="Registrar"
    >
      {serverError && (
        <Alert variant="error" title="Error" message={serverError} />
      )}

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            valor: TIPO_MOVIMIENTO.EGRESO,
            icono: "mdi:arrow-up-bold-box-outline",
            titulo: "Egreso",
            detalle: "Sale dinero del cajón",
            activoClass: "border-error-500 bg-error-50 dark:bg-error-500/10",
            iconClass: "text-error-500",
          },
          {
            valor: TIPO_MOVIMIENTO.INGRESO,
            icono: "mdi:arrow-down-bold-box-outline",
            titulo: "Ingreso",
            detalle: "Entra dinero al cajón",
            activoClass: "border-success-500 bg-success-50 dark:bg-success-500/10",
            iconClass: "text-success-600",
          },
        ].map((opcion) => {
          const activo = tipo === opcion.valor;
          return (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setTipo(opcion.valor)}
              disabled={isSaving}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                activo
                  ? opcion.activoClass
                  : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
              }`}
            >
              <Icon
                name={opcion.icono}
                size={22}
                className={activo ? opcion.iconClass : "text-gray-400"}
              />
              <span>
                <span className="block text-sm font-semibold text-gray-800 dark:text-white/90">
                  {opcion.titulo}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {opcion.detalle}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <Label htmlFor="monto">Monto (S/) *</Label>
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
          hint={
            errorMonto ??
            (esEgreso
              ? `Disponible en caja: ${formatearSoles(efectivoDisponible)}`
              : undefined)
          }
          disabled={isSaving}
        />
      </div>

      <div>
        <Label htmlFor="motivo">Motivo *</Label>
        <Input
          id="motivo"
          value={motivo}
          onChange={(e) => {
            setServerError(null);
            setMotivo(e.target.value);
          }}
          placeholder={esEgreso ? "Compra de hielo" : "Reposición de sencillo"}
          error={Boolean(errorMotivo)}
          hint={
            errorMotivo ??
            "Sé específico: al cerrar el turno, esto es lo único que explica el movimiento."
          }
          disabled={isSaving}
        />
      </div>
    </FormModal>
  );
}
