"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { TurnoItem } from "@/modules/caja/types/caja.types";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  MEDIO_PAGO,
  MEDIOS_PAGO_ABONO,
  type AbonoFormValues,
  type SaldoProveedor,
} from "../types/cxp.types";
import { formatearSoles, hoyISO } from "../utils/formato";

type AbonoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AbonoFormValues) => Promise<void>;
  proveedores: SaldoProveedor[];
  proveedorElegido: SaldoProveedor | null;
  turnoAbierto: TurnoItem | null;
  isSaving: boolean;
};

/**
 * Registra el abono semanal a un proveedor.
 *
 * Tres decisiones de UX:
 *
 * 1. **Muestro la deuda pendiente y valido contra ella en vivo.** El backend
 *    rechaza un abono que supere el saldo, pero descubrirlo al confirmar es
 *    tarde: acá el usuario ve el tope mientras escribe.
 *
 * 2. **Botón "pagar todo"** que llena el monto con la deuda completa. Es el
 *    caso más frecuente cuando se salda la cuenta de la semana.
 *
 * 3. **El efectivo exige turno de caja abierto.** Si no hay, deshabilito esa
 *    opción en vez de dejar que la API lo rechace.
 */
export function AbonoFormModal({
  isOpen,
  onClose,
  onSubmit,
  proveedores,
  proveedorElegido,
  turnoAbierto,
  isSaving,
}: AbonoFormModalProps) {
  const [values, setValues] = useState<AbonoFormValues>({
    id_persona: null,
    monto: 0,
    medio_pago: MEDIO_PAGO.EFECTIVO,
    id_turno: null,
    fecha_movimiento: hoyISO(),
    num_comprobante: "",
    observacion: "",
  });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const hayTurno = Boolean(turnoAbierto);

  useEffect(() => {
    if (!isOpen) return;

    setValues({
      id_persona: proveedorElegido?.id_persona ?? null,
      monto: 0,
      medio_pago: hayTurno ? MEDIO_PAGO.EFECTIVO : MEDIO_PAGO.YAPE,
      id_turno: turnoAbierto?.id ?? null,
      fecha_movimiento: hoyISO(),
      num_comprobante: "",
      observacion: "",
    });
    setIntentoEnviar(false);
    setServerError(null);
  }, [isOpen, proveedorElegido, turnoAbierto, hayTurno]);

  // Solo ofrezco proveedores con deuda: abonar a quien está en cero no tiene
  // sentido y el backend lo rechazaría.
  const conDeuda = useMemo(
    () => proveedores.filter((p) => Number(p.saldo) > 0),
    [proveedores],
  );

  const elegido = useMemo(
    () => proveedores.find((p) => p.id_persona === values.id_persona) ?? null,
    [proveedores, values.id_persona],
  );

  const deuda = Number(elegido?.saldo ?? 0);
  const excedeDeuda = deuda > 0 && values.monto > deuda;
  const esEfectivo = values.medio_pago === MEDIO_PAGO.EFECTIVO;

  const errorProveedor =
    intentoEnviar && !values.id_persona ? "Selecciona al proveedor." : undefined;
  const errorMonto =
    intentoEnviar && values.monto <= 0
      ? "El monto debe ser mayor a cero."
      : excedeDeuda
        ? `Supera la deuda pendiente (${formatearSoles(deuda)}).`
        : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);
    setServerError(null);

    if (!values.id_persona || values.monto <= 0 || excedeDeuda) return;

    try {
      await onSubmit({
        ...values,
        id_turno: esEfectivo ? (turnoAbierto?.id ?? null) : null,
      });
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
      title="Registrar abono a proveedor"
      subtitle="El pago semanal que reduce lo que le debemos."
      isSaving={isSaving}
      submitText="Registrar abono"
    >
      {serverError && (
        <Alert variant="error" title="Error" message={serverError} />
      )}

      {!hayTurno && (
        <Alert
          variant="warning"
          title="Sin turno de caja abierto"
          message="No puedes abonar en efectivo porque el egreso no tendría contra qué cuadrar. Abre un turno en Caja, o registra el abono por Yape o transferencia."
        />
      )}

      <div>
        <Label htmlFor="id_persona">Proveedor *</Label>
        <Select
          options={conDeuda.map((p) => ({
            value: String(p.id_persona),
            label: `${p.nombre} — debe ${formatearSoles(p.saldo)}`,
          }))}
          defaultValue={values.id_persona ? String(values.id_persona) : ""}
          placeholder="Selecciona al proveedor"
          onChange={(value) => {
            setServerError(null);
            setValues((p) => ({ ...p, id_persona: Number(value) }));
          }}
          disabled={isSaving}
          error={Boolean(errorProveedor)}
          hint={
            errorProveedor ??
            (conDeuda.length === 0
              ? "No hay proveedores con deuda pendiente."
              : undefined)
          }
        />
      </div>

      {/* La deuda pendiente, bien visible: es el tope del abono. */}
      {elegido && deuda > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-error-200 bg-error-50 p-3.5 dark:border-error-500/30 dark:bg-error-500/10">
          <span className="flex items-center gap-2 text-sm font-medium text-error-700 dark:text-error-400">
            <Icon name="mdi:alert-circle-outline" size={18} />
            Deuda pendiente
          </span>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-error-700 dark:text-error-400">
              {formatearSoles(deuda)}
            </span>
            <button
              type="button"
              onClick={() => setValues((p) => ({ ...p, monto: deuda }))}
              disabled={isSaving}
              className="rounded-lg border border-error-300 bg-white px-2.5 py-1 text-xs font-semibold text-error-700 transition-colors hover:bg-error-50 dark:border-error-500/40 dark:bg-gray-900 dark:text-error-400"
            >
              Pagar todo
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="monto">Monto del abono (S/) *</Label>
          <Input
            id="monto"
            type="number"
            step={0.01}
            min="0"
            value={values.monto || ""}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, monto: Number(e.target.value) || 0 }));
            }}
            placeholder="0.00"
            error={Boolean(errorMonto)}
            hint={
              errorMonto ??
              (elegido && values.monto > 0 && values.monto < deuda
                ? `Quedaría debiendo ${formatearSoles(deuda - values.monto)}`
                : undefined)
            }
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
          />
        </div>
      </div>

      <div>
        <Label>Medio de pago *</Label>
        <div className="grid grid-cols-3 gap-2.5">
          {MEDIOS_PAGO_ABONO.map((opcion) => {
            const activo = values.medio_pago === opcion.valor;
            const bloqueado = opcion.valor === MEDIO_PAGO.EFECTIVO && !hayTurno;

            return (
              <button
                key={opcion.valor}
                type="button"
                disabled={isSaving || bloqueado}
                onClick={() => {
                  setServerError(null);
                  setValues((p) => ({ ...p, medio_pago: opcion.valor }));
                }}
                title={
                  bloqueado
                    ? "Necesitas un turno de caja abierto para pagar en efectivo"
                    : undefined
                }
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors ${
                  activo
                    ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <Icon
                  name={opcion.icono}
                  size={20}
                  className={activo ? "text-brand-500" : "text-gray-400"}
                />
                <span className="text-xs font-semibold text-gray-800 dark:text-white/90">
                  {opcion.etiqueta}
                </span>
              </button>
            );
          })}
        </div>

        {esEfectivo && turnoAbierto && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Icon name="mdi:cash-register" size={14} />
            Sale del cajón de{" "}
            <span className="font-semibold">{turnoAbierto.nombre_caja}</span> ·
            disponible {formatearSoles(turnoAbierto.efectivo_esperado ?? 0)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="num_comprobante">N° de comprobante</Label>
          <Input
            id="num_comprobante"
            value={values.num_comprobante}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, num_comprobante: e.target.value }));
            }}
            placeholder="Opcional"
            disabled={isSaving}
          />
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
            placeholder="Opcional"
            disabled={isSaving}
          />
        </div>
      </div>
    </FormModal>
  );
}
