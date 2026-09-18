"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { Sucursal } from "@/modules/sucursales/types/sucursal.types";
import { FormEvent, useEffect, useState } from "react";
import type {
  TrabajadorFormValues,
  TrabajadorItem,
} from "../types/planilla.types";
import { formatearSoles } from "../utils/formato";

type TrabajadorFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TrabajadorFormValues) => Promise<void>;
  trabajador: TrabajadorItem | null;
  sucursales: Sucursal[];
  isSaving: boolean;
};

const VALORES_INICIALES: TrabajadorFormValues = {
  nombres: "",
  apellidos: "",
  num_documento: "",
  puesto: "",
  sueldo_referencial: 0,
  id_sucursal: null,
};

/**
 * Alta y edición de personal en planilla.
 *
 * Deliberadamente corto: el cliente pidió el registro mínimo. Solo nombres y
 * apellidos son obligatorios; el resto ayuda pero no estorba si se deja vacío.
 */
export function TrabajadorFormModal({
  isOpen,
  onClose,
  onSubmit,
  trabajador,
  sucursales,
  isSaving,
}: TrabajadorFormModalProps) {
  const [values, setValues] = useState<TrabajadorFormValues>(VALORES_INICIALES);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (trabajador) {
      setValues({
        nombres: trabajador.nombres,
        apellidos: trabajador.apellidos,
        num_documento: trabajador.num_documento ?? "",
        puesto: trabajador.puesto ?? "",
        sueldo_referencial: Number(trabajador.sueldo_referencial) || 0,
        id_sucursal: trabajador.id_sucursal,
      });
    } else {
      setValues({
        ...VALORES_INICIALES,
        // Si hay una sola sucursal (el caso de Inga hoy), la elijo sola.
        id_sucursal: sucursales.length === 1 ? sucursales[0].id : null,
      });
    }

    setIntentoEnviar(false);
    setServerError(null);
  }, [isOpen, trabajador, sucursales]);

  const doc = values.num_documento.trim();
  const errorNombres =
    intentoEnviar && !values.nombres.trim()
      ? "Los nombres son obligatorios."
      : undefined;
  const errorApellidos =
    intentoEnviar && !values.apellidos.trim()
      ? "Los apellidos son obligatorios."
      : undefined;
  // El documento es opcional, pero si lo escriben tiene que ser válido.
  const errorDoc =
    doc && !/^[A-Za-z0-9]{8,12}$/.test(doc)
      ? "Debe tener entre 8 y 12 caracteres, solo letras y números."
      : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);
    setServerError(null);

    if (!values.nombres.trim() || !values.apellidos.trim() || errorDoc) return;

    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "No se pudo guardar.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={trabajador ? "Editar trabajador" : "Nuevo trabajador"}
      subtitle="Registro mínimo: solo lo necesario para pagarle la quincena."
      isSaving={isSaving}
    >
      {serverError && (
        <Alert variant="error" title="Error al guardar" message={serverError} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nombres">Nombres *</Label>
          <Input
            id="nombres"
            value={values.nombres}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, nombres: e.target.value }));
            }}
            placeholder="María"
            error={Boolean(errorNombres)}
            hint={errorNombres}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="apellidos">Apellidos *</Label>
          <Input
            id="apellidos"
            value={values.apellidos}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, apellidos: e.target.value }));
            }}
            placeholder="Quispe Rojas"
            error={Boolean(errorApellidos)}
            hint={errorApellidos}
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="num_documento">Documento</Label>
          <Input
            id="num_documento"
            value={values.num_documento}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({
                ...p,
                num_documento: e.target.value.slice(0, 12),
              }));
            }}
            placeholder="45612345"
            error={Boolean(errorDoc)}
            hint={errorDoc ?? "Opcional. Evita registrar dos veces a la misma persona."}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="puesto">Puesto</Label>
          <Input
            id="puesto"
            value={values.puesto}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, puesto: e.target.value }));
            }}
            placeholder="Cocinera"
            hint="Opcional. Ayuda a ubicar a la persona en la lista."
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="sueldo_referencial">Sueldo por quincena (S/)</Label>
          <Input
            id="sueldo_referencial"
            type="number"
            step={0.01}
            min="0"
            value={values.sueldo_referencial || ""}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({
                ...p,
                sueldo_referencial: Number(e.target.value) || 0,
              }));
            }}
            placeholder="0.00"
            // Es solo una sugerencia: el pago real puede diferir y el sistema
            // no obliga a que coincida. Lo digo explícito para que nadie piense
            // que está fijando un monto inamovible.
            hint={
              values.sueldo_referencial > 0
                ? `Se sugerirá ${formatearSoles(values.sueldo_referencial)} al pagar, pero puedes cambiarlo.`
                : "Opcional. Solo sugiere el monto al registrar el pago."
            }
            disabled={isSaving}
          />
        </div>

        {sucursales.length > 1 && (
          <div>
            <Label htmlFor="id_sucursal">Sucursal</Label>
            <Select
              options={sucursales.map((s) => ({
                value: String(s.id),
                label: s.nombre,
              }))}
              defaultValue={values.id_sucursal ? String(values.id_sucursal) : ""}
              placeholder="Sin asignar"
              onChange={(value) => {
                setServerError(null);
                setValues((p) => ({
                  ...p,
                  id_sucursal: value ? Number(value) : null,
                }));
              }}
              disabled={isSaving}
            />
          </div>
        )}
      </div>
    </FormModal>
  );
}
