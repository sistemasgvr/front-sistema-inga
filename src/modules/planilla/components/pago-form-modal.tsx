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
  MEDIOS_PAGO_PLANILLA,
  type PagoFormValues,
  type TrabajadorItem,
} from "../types/planilla.types";
import {
  deducirPeriodo,
  etiquetaPeriodo,
  formatearSoles,
  hoyISO,
} from "../utils/formato";

type PagoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: PagoFormValues) => Promise<void>;
  trabajadores: TrabajadorItem[];
  trabajadorPreseleccionado: number | null;
  turnoAbierto: TurnoItem | null;
  isSaving: boolean;
};

/**
 * Registro del pago de una quincena.
 *
 * Dos decisiones de UX que vale la pena explicar:
 *
 * 1. **Muestro a qué quincena se va a imputar el pago, en vivo.** El backend
 *    deduce el período de la fecha, y esa regla no es obvia: un pago del 2 de
 *    octubre corresponde a la 2da quincena de *septiembre*. Si no lo mostrara
 *    antes de guardar, el cajero descubriría el mes equivocado después.
 *
 * 2. **El efectivo exige turno de caja abierto.** Si no hay turno, deshabilito
 *    esa opción en vez de dejar que la API rechace el pago.
 */
export function PagoFormModal({
  isOpen,
  onClose,
  onSubmit,
  trabajadores,
  trabajadorPreseleccionado,
  turnoAbierto,
  isSaving,
}: PagoFormModalProps) {
  const [values, setValues] = useState<PagoFormValues>({
    id_trabajador: null,
    monto: 0,
    fecha_pago: hoyISO(),
    medio_pago: MEDIO_PAGO.EFECTIVO,
    id_turno: null,
    observacion: "",
  });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const hayTurno = Boolean(turnoAbierto);

  useEffect(() => {
    if (!isOpen) return;

    setValues({
      id_trabajador: trabajadorPreseleccionado,
      monto: 0,
      fecha_pago: hoyISO(),
      // Si no hay turno abierto, el efectivo no es viable: arranco en Yape.
      medio_pago: hayTurno ? MEDIO_PAGO.EFECTIVO : MEDIO_PAGO.YAPE,
      id_turno: turnoAbierto?.id ?? null,
      observacion: "",
    });
    setIntentoEnviar(false);
    setServerError(null);
  }, [isOpen, trabajadorPreseleccionado, turnoAbierto, hayTurno]);

  const trabajadorElegido = useMemo(
    () => trabajadores.find((t) => t.id === values.id_trabajador) ?? null,
    [trabajadores, values.id_trabajador],
  );

  /**
   * Al elegir trabajador, sugiero su sueldo referencial si el monto sigue en
   * cero. No piso un monto ya escrito: el pago real puede diferir del sueldo.
   */
  function elegirTrabajador(id: number) {
    setServerError(null);
    const t = trabajadores.find((x) => x.id === id);
    setValues((p) => ({
      ...p,
      id_trabajador: id,
      monto:
        p.monto > 0 ? p.monto : Number(t?.sueldo_referencial) || 0,
    }));
  }

  const periodo = useMemo(
    () => deducirPeriodo(values.fecha_pago || hoyISO()),
    [values.fecha_pago],
  );

  const esEfectivo = values.medio_pago === MEDIO_PAGO.EFECTIVO;

  const errorTrabajador =
    intentoEnviar && !values.id_trabajador
      ? "Selecciona al trabajador."
      : undefined;
  const errorMonto =
    intentoEnviar && values.monto <= 0
      ? "El monto debe ser mayor a cero."
      : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);
    setServerError(null);

    if (!values.id_trabajador || values.monto <= 0) return;

    try {
      await onSubmit({
        ...values,
        // El turno solo viaja si el pago sale del cajón.
        id_turno: esEfectivo ? (turnoAbierto?.id ?? null) : null,
      });
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "No se pudo registrar el pago.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Registrar pago de planilla"
      subtitle="El período se calcula solo a partir de la fecha de pago."
      isSaving={isSaving}
      submitText="Registrar pago"
    >
      {serverError && (
        <Alert variant="error" title="Error" message={serverError} />
      )}

      {!hayTurno && (
        <Alert
          variant="warning"
          title="Sin turno de caja abierto"
          message="No puedes pagar en efectivo porque el egreso no tendría contra qué cuadrar. Abre un turno en Caja, o registra el pago por Yape o transferencia."
        />
      )}

      <div>
        <Label htmlFor="id_trabajador">Trabajador *</Label>
        <Select
          options={trabajadores.map((t) => ({
            value: String(t.id),
            label: t.puesto
              ? `${t.nombre_completo} — ${t.puesto}`
              : t.nombre_completo,
          }))}
          defaultValue={values.id_trabajador ? String(values.id_trabajador) : ""}
          placeholder="Selecciona al trabajador"
          onChange={(value) => elegirTrabajador(Number(value))}
          disabled={isSaving}
          error={Boolean(errorTrabajador)}
          hint={
            errorTrabajador ??
            (trabajadores.length === 0
              ? "No hay personal activo. Regístralo primero en Trabajadores."
              : undefined)
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="monto">Monto (S/) *</Label>
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
              (trabajadorElegido && Number(trabajadorElegido.sueldo_referencial) > 0
                ? `Sueldo habitual: ${formatearSoles(trabajadorElegido.sueldo_referencial)}`
                : undefined)
            }
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="fecha_pago">Fecha de pago *</Label>
          <Input
            id="fecha_pago"
            type="date"
            value={values.fecha_pago}
            max={hoyISO()}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, fecha_pago: e.target.value }));
            }}
            disabled={isSaving}
          />
        </div>
      </div>

      {/* El período deducido, en vivo. Es la pieza clave del modal: evita que
          el pago del día 2 se cargue al mes equivocado sin que nadie lo note. */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3.5 dark:border-brand-500/30 dark:bg-brand-500/10">
        <Icon
          name="mdi:calendar-check-outline"
          size={20}
          className="mt-0.5 shrink-0 text-brand-500"
        />
        <div>
          <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
            Este pago se registrará como
          </p>
          <p className="mt-0.5 text-sm font-bold text-brand-700 dark:text-brand-300">
            {etiquetaPeriodo(periodo.anio, periodo.mes, periodo.quincena)}
          </p>
          <p className="mt-1 text-xs text-brand-600/80 dark:text-brand-400/80">
            {periodo.quincena === 2
              ? "Pagar entre el 1 y el 15 corresponde a la segunda quincena del mes anterior."
              : "Pagar del 16 en adelante corresponde a la primera quincena de este mes."}
          </p>
        </div>
      </div>

      <div>
        <Label>Medio de pago *</Label>
        <div className="grid grid-cols-3 gap-2.5">
          {MEDIOS_PAGO_PLANILLA.map((opcion) => {
            const activo = values.medio_pago === opcion.valor;
            const bloqueado =
              opcion.valor === MEDIO_PAGO.EFECTIVO && !hayTurno;

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
    </FormModal>
  );
}
