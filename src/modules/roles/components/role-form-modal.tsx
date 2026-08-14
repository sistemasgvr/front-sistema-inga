"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormEvent, useEffect, useState } from "react";
import type { RoleItem, RoleFormValues } from "../types/roles.types";

type RoleFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void>;
  role: RoleItem | null;
  isSaving: boolean;
};

const EMPTY_FORM: RoleFormValues = {
  codigo: "",
  nombre: "",
  descripcion: "",
};

export function RoleFormModal({
  isOpen,
  onClose,
  onSubmit,
  role,
  isSaving,
}: RoleFormModalProps) {
  const [values, setValues] = useState<RoleFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof RoleFormValues, string>>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (role) {
      setValues({
        codigo: role.codigo,
        nombre: role.nombre,
        descripcion: role.descripcion ?? "",
      });
    } else {
      setValues(EMPTY_FORM);
    }
    setErrors({});
  }, [isOpen, role]);

  function validate(): boolean {
    const next: Partial<Record<keyof RoleFormValues, string>> = {};

    if (!values.codigo.trim()) {
      next.codigo = "El código es obligatorio.";
    }
    if (!values.nombre.trim()) {
      next.nombre = "El nombre es obligatorio.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(values);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
            {role ? "Editar rol" : "Nuevo rol"}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {role
              ? "Actualiza la información básica del rol."
              : "Registra un nuevo rol para el sistema."}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="codigo">Código del Rol *</Label>
            <Input
              id="codigo"
              value={values.codigo}
              onChange={(e) =>
                setValues((p) => ({ ...p, codigo: e.target.value.toUpperCase() }))
              }
              placeholder="Ej. CAJERO, OPERARIO"
              error={Boolean(errors.codigo)}
              hint={errors.codigo}
              disabled={isSaving || Boolean(role)} // El código no se edita si ya existe
            />
          </div>

          <div>
            <Label htmlFor="nombre">Nombre del Rol *</Label>
            <Input
              id="nombre"
              value={values.nombre}
              onChange={(e) => setValues((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Cajero Principal"
              error={Boolean(errors.nombre)}
              hint={errors.nombre}
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={values.descripcion}
              onChange={(e) =>
                setValues((p) => ({ ...p, descripcion: e.target.value }))
              }
              placeholder="Descripción opcional del alcance..."
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="mt-6 flex w-full items-center justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}