"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { FormModal } from "@/components/ui/modal/FormModal";
import { FormEvent, useEffect, useState } from "react";
import type { Sucursal, SucursalFormValues } from "../types/sucursal.types";

type SucursalFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: SucursalFormValues) => Promise<void>;
  sucursal: Sucursal | null;
  isSaving: boolean;
};

export function SucursalFormModal({
  isOpen,
  onClose,
  onSubmit,
  sucursal,
  isSaving,
}: SucursalFormModalProps) {
  const [values, setValues] = useState<SucursalFormValues>({
    idEmpresa: 1,
    codigo: "",
    nombre: "",
    direccion: "",
    telefono: "",
    esPrincipal: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SucursalFormValues, string>>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (sucursal) {
      setValues({
        idEmpresa: sucursal.idEmpresa || 1,
        codigo: sucursal.codigo || "",
        nombre: sucursal.nombre || "",
        direccion: sucursal.direccion ?? "",
        telefono: sucursal.telefono ?? "",
        esPrincipal: sucursal.esPrincipal ?? false,
      });
    } else {
      setValues({
        idEmpresa: 1,
        codigo: "",
        nombre: "",
        direccion: "",
        telefono: "",
        esPrincipal: false,
      });
    }
    setErrors({});
  }, [isOpen, sucursal]);

  function validate(): boolean {
    const next: Partial<Record<keyof SucursalFormValues, string>> = {};

    if (!values.codigo.trim()) next.codigo = "El código es obligatorio.";
    if (!values.nombre.trim()) next.nombre = "El nombre es obligatorio.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(values);
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={sucursal ? "Editar sucursal" : "Nueva sucursal"}
      subtitle={
        sucursal
          ? "Actualiza la información del local en el sistema."
          : "Completa la información requerida para registrar un nuevo local."
      }
      isSaving={isSaving}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="codigo">Código *</Label>
          <Input
            id="codigo"
            value={values.codigo}
            onChange={(e) => setValues((p) => ({ ...p, codigo: e.target.value }))}
            placeholder="SUC-001"
            error={Boolean(errors.codigo)}
            hint={errors.codigo}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="nombre">Nombre de Sede *</Label>
          <Input
            id="nombre"
            value={values.nombre}
            onChange={(e) => setValues((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Sede Miraflores"
            error={Boolean(errors.nombre)}
            hint={errors.nombre}
            disabled={isSaving}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          value={values.direccion}
          onChange={(e) => setValues((p) => ({ ...p, direccion: e.target.value }))}
          placeholder="Av. Principal 123"
          disabled={isSaving}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            value={values.telefono}
            onChange={(e) => setValues((p) => ({ ...p, telefono: e.target.value }))}
            placeholder="014567890"
            disabled={isSaving}
          />
        </div>

        <div className="flex items-center pt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.esPrincipal}
              onChange={(e) => setValues((p) => ({ ...p, esPrincipal: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              disabled={isSaving}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Es sede principal
            </span>
          </label>
        </div>
      </div>
    </FormModal>
  );
}