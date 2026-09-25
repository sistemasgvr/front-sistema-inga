"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import { FormModal } from "@/components/ui/modal/FormModal";
import { FormEvent, useEffect, useState } from "react";
import type { CategoriaItem, CategoriaFormValues } from "../types/categorias.types";

type CategoriaFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CategoriaFormValues) => Promise<void>;
  categoria: CategoriaItem | null;
  isSaving: boolean;
};

const EMPTY_FORM: CategoriaFormValues = {
  codigo: "",
  nombre: "",
  descripcion: "",
  es_carta: false,
  orden: 10,
};

export function CategoriaFormModal({
  isOpen,
  onClose,
  onSubmit,
  categoria,
  isSaving,
}: CategoriaFormModalProps) {
  const [values, setValues] = useState<CategoriaFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CategoriaFormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CategoriaFormValues, boolean>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (categoria) {
      setValues({
        codigo: categoria.codigo || "",
        nombre: categoria.nombre || "",
        descripcion: categoria.descripcion || "",
        es_carta: Boolean(categoria.es_carta),
        orden: categoria.orden ?? 10,
      });
    } else {
      setValues(EMPTY_FORM);
    }
    setErrors({});
    setTouched({});
    setIsSubmitted(false);
  }, [isOpen, categoria]);

  function handleBlur(field: keyof CategoriaFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function validate(currentValues: CategoriaFormValues = values): boolean {
    const next: Partial<Record<keyof CategoriaFormValues, string>> = {};

    if (!currentValues.codigo.trim()) {
      next.codigo = "El código es obligatorio.";
    }
    if (!currentValues.nombre.trim()) {
      next.nombre = "El nombre de la categoría es obligatorio.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  useEffect(() => {
    if (isOpen) {
      validate(values);
    }
  }, [values]);

  function showError(field: keyof CategoriaFormValues): string | undefined {
    return (isSubmitted || touched[field]) ? errors[field] : undefined;
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
      title={categoria ? "Editar Categoría" : "Nueva Categoría"}
      subtitle={
        categoria
          ? "Actualiza la información de agrupación principal."
          : "Completa la información requerida para registrar una nueva categoría."
      }
      isSaving={isSaving}
      maxWidth="max-w-[550px]"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              value={values.codigo}
              onChange={(e) =>
                setValues((p) => ({ ...p, codigo: e.target.value.toUpperCase() }))
              }
              onBlur={() => handleBlur("codigo")}
              placeholder="Ej. CAT-01"
              error={Boolean(showError("codigo"))}
              hint={showError("codigo")}
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="orden">Orden / Prioridad</Label>
            <Input
              id="orden"
              type="number"
              value={values.orden}
              onChange={(e) =>
                setValues((p) => ({ ...p, orden: Number(e.target.value) }))
              }
              onBlur={() => handleBlur("orden")}
              placeholder="Ej. 10, 20, 30"
              disabled={isSaving}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Recomendación: usa incrementos de 10 en 10 (10, 20, 30) para facilitar reordenamientos futuros.
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="nombre">Nombre de la Categoría *</Label>
          <Input
            id="nombre"
            value={values.nombre}
            onChange={(e) => setValues((p) => ({ ...p, nombre: e.target.value }))}
            onBlur={() => handleBlur("nombre")}
            placeholder="Ej. Platos Principales"
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
            placeholder="Breve descripción orientativa..."
            disabled={isSaving}
          />
        </div>

        <div className="pt-2">
          <Checkbox
            id="es_carta"
            label="¿Visible en Carta del Restaurante?"
            checked={values.es_carta}
            onChange={(checked) =>
              setValues((p) => ({ ...p, es_carta: checked }))
            }
            disabled={isSaving}
          />
        </div>
      </div>
    </FormModal>
  );
}