"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { PersonaBusquedaItem } from "@/modules/personas/types/personas.types";
import { FormEvent, useEffect, useState } from "react";
import type { ConsumoFormValues, SaldoCliente } from "../types/cxc.types";
import { formatearSoles, hoyISO, quincenaDe } from "../utils/formato";

type ConsumoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ConsumoFormValues) => Promise<void>;
  /** Del maestro de personas (M05): incluye clientes sin movimientos aún. */
  clientes: PersonaBusquedaItem[];
  clienteElegido: SaldoCliente | null;
  isSaving: boolean;
};

/**
 * Registra un consumo a crédito, que aumenta lo que el cliente nos debe.
 *
 * Hoy se carga a mano. Cuando exista M12 (Ventas), ese módulo generará este
 * mismo consumo automáticamente al cobrar un pedido con medio de pago
 * "crédito", y esta pantalla quedará para las correcciones y cargas puntuales.
 *
 * Uso la lista del maestro de personas y no la de saldos a propósito: hay que
 * poder cargarle un almuerzo a alguien que recién entra al convenio y por lo
 * tanto todavía no aparece en la tabla de saldos.
 */
export function ConsumoFormModal({
  isOpen,
  onClose,
  onSubmit,
  clientes,
  clienteElegido,
  isSaving,
}: ConsumoFormModalProps) {
  const [values, setValues] = useState<ConsumoFormValues>({
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

  // Datos del cliente seleccionado, para mostrar su crédito antes de guardar.
  // Prefiero el registro de saldos (tiene el saldo real) y si no, el del
  // maestro, que al menos trae el convenio y el tope.
  const seleccionado = clientes.find((c) => c.id === values.id_persona);
  const saldoActual =
    clienteElegido?.id_persona === values.id_persona
      ? Number(clienteElegido?.saldo ?? 0)
      : Number(seleccionado?.saldo_credito ?? 0);
  const limite = Number(
    clienteElegido?.id_persona === values.id_persona
      ? (clienteElegido?.limite_credito ?? 0)
      : (seleccionado?.limite_credito ?? 0),
  );
  const saldoProyectado = saldoActual + (values.monto || 0);
  const superaria = limite > 0 && saldoProyectado > limite;

  const errorCliente =
    intentoEnviar && !values.id_persona ? "Selecciona al cliente." : undefined;
  const errorMonto =
    intentoEnviar && values.monto <= 0
      ? "El monto debe ser mayor a cero."
      : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);
    setServerError(null);

    if (!values.id_persona || values.monto <= 0) return;

    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el consumo.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Registrar consumo a crédito"
      subtitle="Aumenta lo que el cliente del consorcio nos debe."
      isSaving={isSaving}
      submitText="Registrar consumo"
    >
      {serverError && (
        <Alert variant="error" title="Error" message={serverError} />
      )}

      <div>
        <Label htmlFor="id_persona">Cliente *</Label>
        <Select
          options={clientes.map((c) => ({
            value: String(c.id),
            label: c.nombre_convenio
              ? `${c.nombre_completo ?? `Cliente ${c.id}`} — ${c.nombre_convenio}`
              : (c.nombre_completo ?? `Cliente ${c.id}`),
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
            (clientes.length === 0
              ? "No hay clientes registrados. Créalos en Personas, márcalos como cliente y asígnales un convenio."
              : "El consumo se carga contra el convenio de su empresa.")
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="monto">Monto del consumo (S/) *</Label>
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
            hint={errorMonto}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="fecha_movimiento">Fecha del consumo *</Label>
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
            hint={`Entra en la ${quincenaDe(values.fecha_movimiento)}ª quincena.`}
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
          placeholder="Ej. Almuerzo menú del 18/09"
          disabled={isSaving}
        />
      </div>

      {/* Muestro cómo queda su crédito ANTES de guardar.
          Decidimos que pasarse del tope advierte y no bloquea, así que el mejor
          momento para que alguien lo note es acá, no después de confirmar. */}
      {values.id_persona !== null && limite > 0 && (
        <Alert
          variant={superaria ? "warning" : "info"}
          title={
            superaria
              ? "Este consumo pasa su límite de crédito"
              : "Crédito del cliente"
          }
          message={
            superaria
              ? `Quedaría en ${formatearSoles(saldoProyectado)} de un tope de ${formatearSoles(limite)}. Se puede registrar igual, pero conviene avisar a la empresa.`
              : `Debe ${formatearSoles(saldoActual)} de un tope de ${formatearSoles(limite)}. Con este consumo quedaría en ${formatearSoles(saldoProyectado)}.`
          }
        />
      )}
    </FormModal>
  );
}
