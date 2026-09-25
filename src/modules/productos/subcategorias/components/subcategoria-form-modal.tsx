// subcategoria-form-modal.tsx
"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { FormModal } from "@/components/ui/modal/FormModal";
import { FormEvent, useEffect, useState } from "react";
import type { SubCategoriaItem, SubCategoriaFormValues } from "../types/subcategorias.types";
import type { CategoriaItem } from "../../categorias/types/categorias.types";

type SubCategoriaFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: SubCategoriaFormValues) => Promise<void>;
  subcategoria: SubCategoriaItem | null;
  categorias: CategoriaItem[];
  filtroCategoria?: number;
  isSaving: boolean;
};

export function SubCategoriaFormModal({
  isOpen,
  onClose,
  onSubmit,
  subcategoria,
  categorias = [],
  filtroCategoria,
  isSaving,
}: SubCategoriaFormModalProps) {
  const [values, setValues] = useState<SubCategoriaFormValues>({
    id_categoria: filtroCategoria ?? categorias[0]?.id ?? 1,
    codigo: "",
    nombre: "",
    orden: 10,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SubCategoriaFormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SubCategoriaFormValues, boolean>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (subcategoria) {
      setValues({
        id_categoria: subcategoria.id_categoria,
        codigo: subcategoria.codigo || "",
        nombre: subcategoria.nombre || "",
        orden: subcategoria.orden ?? 10,
      });
    } else {
      setValues({
        id_categoria: filtroCategoria ?? categorias[0]?.id ?? 1,
        codigo: "",
        nombre: "",
        orden: 10,
      });
    }
    setErrors({});
    setTouched({});
    setIsSubmitted(false);
  }, [isOpen, subcategoria, categorias, filtroCategoria]);

  function handleBlur(field: keyof SubCategoriaFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function validate(currentValues: SubCategoriaFormValues = values): boolean {
    const next: Partial<Record<keyof SubCategoriaFormValues, string>> = {};

    if (!currentValues.nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!currentValues.codigo.trim()) next.codigo = "El código es obligatorio.";
    if (!currentValues.id_categoria) next.id_categoria = "Debes seleccionar una categoría padre." as any;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  useEffect(() => {
    if (isOpen) validate(values);
  }, [values]);

  function showError(field: keyof SubCategoriaFormValues): string | undefined {
    return (isSubmitted || touched[field]) ? errors[field] : undefined;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIsSubmitted(true);

    if (!validate()) return;
    await onSubmit(values);
  }

  const categoriaOptions = categorias.map((cat) => ({
    value: String(cat.id),
    label: `${cat.nombre} (${cat.codigo})`,
  }));

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={subcategoria ? "Editar subcategoría" : "Nueva subcategoría"}
      subtitle={
        subcategoria
          ? "Actualiza la subcategoría en su categoría correspondiente."
          : "Completa la información requerida para registrar una subcategoría."
      }
      isSaving={isSaving}
    >
      <div className="space-y-4">
        <div>
          <Label>Categoría Padre *</Label>
          <Select
            options={categoriaOptions}
            defaultValue={values.id_categoria ? String(values.id_categoria) : ""}
            placeholder={categorias.length === 0 ? "Cargando categorías..." : "Selecciona categoría..."}
            disabled={isSaving || categorias.length === 0}
            error={Boolean(showError("id_categoria"))}
            hint={showError("id_categoria")}
            onChange={(val) => {
              setValues((p) => ({ ...p, id_categoria: Number(val) }));
              handleBlur("id_categoria");
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              value={values.codigo}
              onChange={(e) => setValues((p) => ({ ...p, codigo: e.target.value }))}
              onBlur={() => handleBlur("codigo")}
              placeholder="Ej. ENT-CRI"
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
              onChange={(e) => setValues((p) => ({ ...p, orden: Number(e.target.value) }))}
              placeholder="Ej. 10, 20, 30"
              disabled={isSaving}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Recomendación: usa incrementos de 10 en 10 (10, 20, 30) para facilitar reordenamientos futuros.
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="nombre">Nombre de Subcategoría *</Label>
          <Input
            id="nombre"
            value={values.nombre}
            onChange={(e) => setValues((p) => ({ ...p, nombre: e.target.value }))}
            onBlur={() => handleBlur("nombre")}
            placeholder="Ej. Entradas Criollas"
            error={Boolean(showError("nombre"))}
            hint={showError("nombre")}
            disabled={isSaving}
          />
        </div>
      </div>
    </FormModal>
  );
}