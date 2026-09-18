"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { FormModal } from "@/components/ui/modal/FormModal";
import { FormEvent, useEffect, useState } from "react";
import type { AbonoCxcFormValues, SaldoCliente } from "../types/cxc.types";
import { formatearSoles, hoyISO } from "../utils/formato";

type AbonoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AbonoCxcFormValues) => Promise<void>;
  /** De la tabla de saldos: solo tiene sentido abonarle a quien ya debe. */
  clientes: SaldoCliente[];
  clienteElegido: SaldoCliente | null;
  isSaving: boolean;
};

/**
 * Registra el pago de la empresa del consorcio, o el descuento por planilla.
 * Reduce lo que el cliente nos debe.
 *
 * A diferencia del abono de CxP, acá NO pido medio de pago ni turno de caja: el
 * consorcio paga por transferencia o vía descuento de planilla, no entra al
 * cajón del día.
 *
 * Uso la lista de saldos y no la del maestro de personas, al revés que el modal
 * de consumo: abonarle a alguien que no debe nada no tiene sentido, y el
 * backend lo rechaza. Mejor que no aparezca en la lista.
 */
export function AbonoFormModal({
  isOpen,
  onClose,
  onSubmit,
  clientes,
  clienteElegido,
  isSaving,
}: AbonoFormModalProps) {
  const [values, setValues] = useState<AbonoCxcFormValues>({
    id_persona: null,
    monto: 0,
    fecha_movimiento: hoyISO(),
    observacion: "",
  });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setValues({
      id_persona: clienteElegido?.id_persona ?? null,
      monto: 0,
      fecha_movimiento: hoyISO(),
      observacion: "",
    });
    setIntentoEnviar(false);
    setServerError(null);
  }, [isOpen, clienteElegido]);

  // Solo ofrezco a quienes tienen deuda: el backend rechaza lo demás, y es
  // mejor que la opción no exista a que exista y falle.
  const conDeuda = clientes.filter((c) => Number(c.saldo) > 0);
  const seleccionado = conDeuda.find((c) => c.id_persona === values.id_persona);
  const deuda = Number(seleccionado?.saldo ?? 0);

  const errorCliente =
    intentoEnviar && !values.id_persona ? "Selecciona al cliente." : undefined;

  // Valido el tope acá además de en el backend. La regla ya está en la base
  // (que es donde tiene que estar), pero repetirla acá evita que alguien
  // escriba un monto de más, confirme y recién ahí se entere.
  const errorMonto =
    intentoEnviar && values.monto <= 0
      ? "El monto debe ser mayor a cero."
      : deuda > 0 && values.monto > deuda
        ? `No puede superar la deuda de ${formatearSoles(deuda)}.`
        : undefined;

  const montoInvalido =
    values.monto <= 0 || (deuda > 0 && values.monto > deuda);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);
    setServerError(null);

    if (!values.id_persona || montoInvalido) return;

    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "No se pudo registrar el abono.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Registrar abono del cliente"
      subtitle="Reduce lo que el consorcio nos debe."
      isSaving={isSaving}
      submitText="Registrar abono"
    >
      {serverError && (
        <Alert variant="error" title="Error" message={serverError} />
      )}

      <div>
        <Label htmlFor="id_persona">Cliente *</Label>
        <Select
          options={conDeuda.map((c) => ({
            value: String(c.id_persona),
            label: `${c.nombre} — debe ${formatearSoles(c.saldo)}`,
          }))}
          defaultValue={values.id_persona ? String(values.id_persona) : ""}
          placeholder="Selecciona al cliente"
          onChange={(value) => {
            setServerError(null);
            setValues((p) => ({ ...p, id_persona: Number(value) }));
          }}
          disabled={isSaving}
          error={Boolean(errorCliente)}
          hint={
            errorCliente ??
            (conDeuda.length === 0
              ? "Ningún cliente tiene deuda pendiente en este momento."
              : undefined)
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="monto">Monto del abono (S/) *</Label>
          <Input
            id="monto"
            type="number"
            step={0.01}
            min="0"
            max={deuda > 0 ? String(deuda) : undefined}
            value={values.monto || ""}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, monto: Number(e.target.value) || 0 }));
            }}
            placeholder="0.00"
            error={Boolean(errorMonto)}
            hint={errorMonto}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="fecha_movimiento">Fecha del abono *</Label>
          <Input
            id="fecha_movimiento"
            type="date"
            value={values.fecha_movimiento}
            max={hoyISO()}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, fecha_movimiento: e.target.value }));
            }}
            disabled={isSaving}
            hint="Define en qué quincena entra al reporte."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="observacion">Observación</Label>
        <Input
          id="observacion"
          value={values.observacion}
          onChange={(e) => {
            setServerError(null);
            setValues((p) => ({ ...p, observacion: e.target.value }));
          }}
          placeholder="Ej. Transferencia consorcio — 2ª quincena de agosto"
          disabled={isSaving}
        />
      </div>

      {/* Atajo para el caso más común: la empresa paga el corte completo.
          Escribir el monto a mano invita a equivocarse en los céntimos. */}
      {seleccionado && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Deuda actual de {seleccionado.nombre}
            </p>
            <p className="text-lg font-bold text-error-600 dark:text-error-400">
              {formatearSoles(deuda)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setServerError(null);
              setValues((p) => ({ ...p, monto: deuda }));
            }}
            disabled={isSaving}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            Pagar todo
          </button>
        </div>
      )}
    </FormModal>
  );
}
