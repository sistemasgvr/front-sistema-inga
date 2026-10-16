"use client";

import { useErrorNotification } from "@/shared/hooks/use-error-notification";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { TurnoItem } from "@/modules/caja/types/caja.types";
import { FormEvent, useEffect, useState } from "react";
import {
  MEDIO_PAGO,
  MEDIOS_PAGO_ABONO,
  type AbonoCxcFormValues,
  type MovimientoCxc,
  type SaldoCliente,
} from "../types/cxc.types";
import { formatearSoles, hoyISO } from "../utils/formato";

type AbonoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AbonoCxcFormValues) => Promise<void>;
  /** De la tabla de saldos: solo tiene sentido abonarle a quien ya debe. */
  clientes: SaldoCliente[];
  clienteElegido: SaldoCliente | null;
  /** Turno de caja del usuario: el abono entra a la caja por acá. */
  turnoAbierto: TurnoItem | null;
  isSaving: boolean;
  /**
   * Cuando viene, el abono es una corrección: se precarga el monto del cargo y
   * se manda el id del pedido para que quede trazado. Sin esto el modal arranca
   * siempre en cero, que es lo correcto para un abono de quincena normal.
   */
  correccion?: MovimientoCxc | null;
};

/**
 * Registra el pago de la empresa del consorcio, o el descuento por planilla.
 * Reduce lo que el cliente nos debe.
 *
 * Pido el medio de pago para que el cobro se refleje en la caja, con la misma
 * regla que el abono de CxP: el efectivo exige turno abierto (entra al cajón y
 * suma al efectivo esperado); Yape y transferencia se registran en el turno si
 * hay uno, para que salgan en su resumen, pero no tocan el cajón.
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
  turnoAbierto,
  isSaving,
  correccion,
}: AbonoFormModalProps) {
  const [values, setValues] = useState<AbonoCxcFormValues>({
    id_persona: null,
    monto: 0,
    medio_pago: MEDIO_PAGO.EFECTIVO,
    id_turno: null,
    fecha_movimiento: hoyISO(),
    observacion: "",
  });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const notifyError = useErrorNotification("Error");

  const hayTurno = Boolean(turnoAbierto);

  useEffect(() => {
    if (!isOpen) return;

    // En modo corrección el monto y el pedido vienen del cargo que se está
    // devolviendo; el cajero solo confirma la fecha y ajusta el texto.
    setValues(
      correccion
        ? {
            id_persona: correccion.id_persona,
            monto: Number(correccion.monto),
            medio_pago: hayTurno ? MEDIO_PAGO.EFECTIVO : MEDIO_PAGO.YAPE,
            id_turno: turnoAbierto?.id ?? null,
            fecha_movimiento: hoyISO(),
            observacion: "",
            id_pedido: correccion.id_pedido,
          }
        : {
            id_persona: clienteElegido?.id_persona ?? null,
            monto: 0,
            medio_pago: hayTurno ? MEDIO_PAGO.EFECTIVO : MEDIO_PAGO.YAPE,
            id_turno: turnoAbierto?.id ?? null,
            fecha_movimiento: hoyISO(),
            observacion: "",
            id_pedido: null,
          },
    );
    setIntentoEnviar(false);

  }, [isOpen, clienteElegido, correccion, turnoAbierto, hayTurno]);

  // Solo ofrezco a quienes tienen deuda: el backend rechaza lo demás, y es
  // mejor que la opción no exista a que exista y falle.
  const conDeuda = clientes.filter((c) => Number(c.saldo) > 0);
  // Busco en TODOS, no solo en conDeuda: en una corrección el cliente viene del
  // cargo y su saldo es el dato que valida el monto que se está devolviendo.
  const seleccionado = clientes.find((c) => c.id_persona === values.id_persona);
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

  const esEfectivo = values.medio_pago === MEDIO_PAGO.EFECTIVO;

  const montoInvalido =
    values.monto <= 0 || (deuda > 0 && values.monto > deuda);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);

    if (!values.id_persona || montoInvalido) return;
    if (esEfectivo && !hayTurno) return;

    try {
      // El turno va siempre que haya uno, no solo en efectivo: así el Yape o la
      // transferencia también salen en el resumen de la caja.
      await onSubmit({ ...values, id_turno: turnoAbierto?.id ?? null });
    } catch (error) {
      notifyError(
        error instanceof Error ? error.message : "No se pudo registrar el abono.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={correccion ? "Corregir crédito del pedido" : "Registrar abono del cliente"}
      subtitle={correccion
        ? "La venta queda como fue: se devuelve el monto que se llevó a cuenta por cobrar."
        : "Reduce lo que el consorcio nos debe."}
      isSaving={isSaving}
      submitText={correccion ? "Registrar corrección" : "Registrar abono"}
    >

      {!hayTurno && (
        <Alert
          variant="warning"
          title="Sin turno de caja abierto"
          message="No puedes registrar un abono en efectivo porque el ingreso no tendría contra qué cuadrar. Abre una caja, o registra el abono por Yape o transferencia."
        />
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

            setValues((p) => ({ ...p, id_persona: Number(value) }));
          }}
          disabled={isSaving || Boolean(correccion)}
          error={Boolean(errorCliente)}
          hint={
            errorCliente ??
            (correccion
              ? "El cliente viene del cargo que se está corrigiendo."
              : conDeuda.length === 0
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

              setValues((p) => ({ ...p, fecha_movimiento: e.target.value }));
            }}
            disabled={isSaving}
            hint="Define en qué quincena entra al reporte."
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
                  setValues((p) => ({ ...p, medio_pago: opcion.valor }));
                }}
                title={
                  bloqueado
                    ? "Necesitas un turno de caja abierto para cobrar en efectivo"
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

        {turnoAbierto && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Icon name="mdi:cash-register" size={14} />
            {esEfectivo ? "Entra al cajón de" : "Se registra en el turno de"}{" "}
            <span className="font-semibold">{turnoAbierto.nombre_caja}</span>
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="observacion">Observación</Label>
        <Input
          id="observacion"
          value={values.observacion}
          onChange={(e) => {

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
