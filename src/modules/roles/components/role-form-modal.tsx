"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { FormModal } from "@/components/ui/modal/FormModal";
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
  const [touched, setTouched] = useState<Partial<Record<keyof RoleFormValues, boolean>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    setTouched({});
    setIsSubmitted(false);
  }, [isOpen, role]);

  function handleBlur(field: keyof RoleFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function validate(currentValues: RoleFormValues = values): boolean {
    const next: Partial<Record<keyof RoleFormValues, string>> = {};

    if (!currentValues.codigo.trim()) {
      next.codigo = "El código es obligatorio.";
    }
    if (!currentValues.nombre.trim()) {
      next.nombre = "El nombre es obligatorio.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  useEffect(() => {
    if (isOpen) {
      validate(values);
    }
  }, [values]);

  function showError(field: keyof RoleFormValues): string | undefined {
    if (isSubmitted || touched[field]) {
      return errors[field];
    }
    return undefined;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIsSubmitted(true);

    if (!validate()) return;
    await onSubmit(values);
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={role ? "Editar rol" : "Nuevo rol"}
      subtitle={
        role
          ? "Actualiza la información básica del rol."
          : "Registra un nuevo rol para el sistema."
      }
      isSaving={isSaving}
      maxWidth="max-w-[500px]"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="codigo">Código del Rol *</Label>
          <Input
            id="codigo"
            value={values.codigo}
            onChange={(e) =>
              setValues((p) => ({ ...p, codigo: e.target.value.toUpperCase() }))
            }
            onBlur={() => handleBlur("codigo")}
            placeholder="Ej. CAJERO, OPERARIO"
            error={Boolean(showError("codigo"))}
            hint={showError("codigo")}
            disabled={isSaving || Boolean(role)}
          />
        </div>

        <div>
          <Label htmlFor="nombre">Nombre del Rol *</Label>
          <Input
            id="nombre"
            value={values.nombre}
            onChange={(e) => setValues((p) => ({ ...p, nombre: e.target.value }))}
            onBlur={() => handleBlur("nombre")}
            placeholder="Ej. Cajero Principal"
            error={Boolean(showError("nombre"))}
            hint={showError("nombre")}
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
    </FormModal>
  );
}