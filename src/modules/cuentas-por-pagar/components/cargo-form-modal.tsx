"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { PersonaBusquedaItem } from "@/modules/personas/types/personas.types";
import { FormEvent, useEffect, useState } from "react";
import type { CargoFormValues, SaldoProveedor } from "../types/cxp.types";
import { hoyISO } from "../utils/formato";

type CargoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CargoFormValues) => Promise<void>;
  /** Del maestro de personas (M05): incluye proveedores sin movimientos aún. */
  proveedores: PersonaBusquedaItem[];
  proveedorElegido: SaldoProveedor | null;
  isSaving: boolean;
};

/**
 * Registra una compra a crédito, que aumenta la deuda con el proveedor.
 *
 * Hoy se carga a mano. Cuando exista M14 (Gastos Diarios Operativos), ese
 * módulo generará este mismo cargo automáticamente al marcar un ítem como
 * "a crédito", y esta pantalla quedará para las correcciones y cargas
 * puntuales.
 *
 * Uso la lista del maestro de personas y no la de saldos a propósito: hay que
 * poder cargarle una compra a un proveedor que todavía no tiene movimientos y
 * por lo tanto no aparece en la tabla de saldos.
 */
export function CargoFormModal({
  isOpen,
  onClose,
  onSubmit,
  proveedores,
  proveedorElegido,
  isSaving,
}: CargoFormModalProps) {
  const [values, setValues] = useState<CargoFormValues>({
    id_persona: null,
    monto: 0,
    fecha_movimiento: hoyISO(),
    num_comprobante: "",
    observacion: "",
  });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setValues({
      id_persona: proveedorElegido?.id_persona ?? null,
      monto: 0,
      fecha_movimiento: hoyISO(),
      num_comprobante: "",
      observacion: "",
    });
    setIntentoEnviar(false);
    setServerError(null);
  }, [isOpen, proveedorElegido]);

  const errorProveedor =
    intentoEnviar && !values.id_persona ? "Selecciona al proveedor." : undefined;
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
        error instanceof Error ? error.message : "No se pudo registrar el cargo.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Registrar compra a crédito"
      subtitle="Aumenta lo que le debemos al proveedor."
      isSaving={isSaving}
      submitText="Registrar cargo"
    >
      {serverError && (
        <Alert variant="error" title="Error" message={serverError} />
      )}

      <div>
        <Label htmlFor="id_persona">Proveedor *</Label>
        <Select
          options={proveedores.map((p) => ({
            value: String(p.id),
            label: p.nombre_completo ?? `Proveedor ${p.id}`,
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
            (proveedores.length === 0
              ? "No hay proveedores registrados. Créalos en Personas y márcalos como proveedor."
              : undefined)
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="monto">Monto de la compra (S/) *</Label>
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
          <Label htmlFor="fecha_movimiento">Fecha de la compra *</Label>
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
            hint="Define en qué semana entra al reporte."
          />
        </div>
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
            placeholder="Ej. Pollo semana 38"
            disabled={isSaving}
          />
        </div>
      </div>
    </FormModal>
  );
}
