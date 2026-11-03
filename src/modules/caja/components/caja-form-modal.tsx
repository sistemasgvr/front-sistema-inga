"use client";

import { useErrorNotification } from "@/shared/hooks/use-error-notification";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { Sucursal } from "@/modules/sucursales/types/sucursal.types";
import { FormEvent, useEffect, useState } from "react";
import type { CajaFormValues, CajaItem } from "../types/caja.types";
import { SucursalActivaCampo, getSucursalActiva } from "@/modules/auth";

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
    nombre: "",
  });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const notifyError = useErrorNotification("Error al guardar");

  useEffect(() => {
    if (!isOpen) return;

    if (caja) {
      setValues({
        id_sucursal: caja.id_sucursal,
        nombre: caja.nombre,
      });
    } else {
      setValues({
        // El backend usa la sucursal de la sesión; se envía la misma.
        id_sucursal: getSucursalActiva() ?? sucursales[0]?.id ?? null,
        nombre: "",
      });
    }

    setIntentoEnviar(false);

  }, [isOpen, caja, sucursales]);

  const errorNombre =
    intentoEnviar && !values.nombre.trim() ? "El nombre es obligatorio." : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);

    if (!values.nombre.trim()) return;

    try {
      await onSubmit(values);
    } catch (error) {
      notifyError(
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

      <div>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input
          id="nombre"
          value={values.nombre}
          onChange={(e) => {

            setValues((p) => ({ ...p, nombre: e.target.value }));
          }}
          placeholder="Caja principal"
          error={Boolean(errorNombre)}
          hint={errorNombre ?? "Único dentro de la sucursal."}
          disabled={isSaving}
        />
      </div>

      <SucursalActivaCampo
        label="Sucursal"
        nombre={caja?.nombre_sucursal}
      />
    </FormModal>
  );
}
