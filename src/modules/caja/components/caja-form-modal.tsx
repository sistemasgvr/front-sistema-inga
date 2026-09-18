"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { Sucursal } from "@/modules/sucursales/types/sucursal.types";
import { FormEvent, useEffect, useState } from "react";
import type { CajaFormValues, CajaItem } from "../types/caja.types";

type CajaFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CajaFormValues) => Promise<void>;
  caja: CajaItem | null;
  sucursales: Sucursal[];
  isSaving: boolean;
};

export function CajaFormModal({
  isOpen,
  onClose,
  onSubmit,
  caja,
  sucursales,
  isSaving,
}: CajaFormModalProps) {
  const [values, setValues] = useState<CajaFormValues>({
    id_sucursal: null,
    codigo: "",
    nombre: "",
  });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (caja) {
      setValues({
        id_sucursal: caja.id_sucursal,
        codigo: caja.codigo,
        nombre: caja.nombre,
      });
    } else {
      setValues({
        id_sucursal: sucursales[0]?.id ?? null,
        codigo: "",
        nombre: "",
      });
    }

    setIntentoEnviar(false);
    setServerError(null);
  }, [isOpen, caja, sucursales]);

  const errorCodigo =
    intentoEnviar && !values.codigo.trim() ? "El código es obligatorio." : undefined;
  const errorNombre =
    intentoEnviar && !values.nombre.trim() ? "El nombre es obligatorio." : undefined;
  const errorSucursal =
    intentoEnviar && !values.id_sucursal ? "Selecciona una sucursal." : undefined;

  // Bloqueo el cambio de sucursal si la caja tiene un turno abierto: es la
  // misma regla que valida el backend, y acá evito que lo intente siquiera.
  const bloqueaSucursal = Boolean(caja?.tiene_turno_abierto);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);
    setServerError(null);

    if (!values.codigo.trim() || !values.nombre.trim() || !values.id_sucursal) return;

    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "No se pudo guardar la caja.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={caja ? "Editar caja" : "Nueva caja"}
      subtitle="Cada caja física del local sobre la que se abren turnos."
      isSaving={isSaving}
    >
      {serverError && (
        <Alert variant="error" title="Error al guardar" message={serverError} />
      )}

      <div>
        <Label htmlFor="id_sucursal">Sucursal *</Label>
        <Select
          options={sucursales.map((s) => ({
            value: String(s.id),
            label: s.nombre,
          }))}
          defaultValue={values.id_sucursal ? String(values.id_sucursal) : ""}
          placeholder="Selecciona la sucursal"
          onChange={(value) => {
            setServerError(null);
            setValues((p) => ({ ...p, id_sucursal: Number(value) }));
          }}
          disabled={isSaving || bloqueaSucursal}
          error={Boolean(errorSucursal)}
          hint={
            errorSucursal ??
            (bloqueaSucursal
              ? "No se puede cambiar mientras la caja tenga un turno abierto."
              : undefined)
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="codigo">Código *</Label>
          <Input
            id="codigo"
            value={values.codigo}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, codigo: e.target.value.toUpperCase() }));
            }}
            placeholder="CAJA-01"
            error={Boolean(errorCodigo)}
            hint={errorCodigo ?? "Único dentro de la sucursal."}
            disabled={isSaving}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={values.nombre}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, nombre: e.target.value }));
            }}
            placeholder="Caja principal"
            error={Boolean(errorNombre)}
            hint={errorNombre}
            disabled={isSaving}
          />
        </div>
      </div>
    </FormModal>
  );
}
