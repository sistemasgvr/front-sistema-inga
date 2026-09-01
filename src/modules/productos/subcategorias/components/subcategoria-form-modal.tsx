"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormEvent, useEffect, useState } from "react";
import type { SubCategoriaItem, SubCategoriaFormValues } from "../types/subcategorias.types";
import type { CategoriaItem } from "../../categorias/types/categorias.types";

type SubCategoriaFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: SubCategoriaFormValues) => Promise<void>;
  subcategoria: SubCategoriaItem | null;
  categorias: CategoriaItem[];
  isSaving: boolean;
};

export function SubCategoriaFormModal({
  isOpen,
  onClose,
  onSubmit,
  subcategoria,
  categorias,
  isSaving,
}: SubCategoriaFormModalProps) {
  const [values, setValues] = useState<SubCategoriaFormValues>({
    id_categoria: categorias[0]?.id ?? 1,
    codigo: "",
    nombre: "",
    orden: 0,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (subcategoria) {
      setValues({
        id_categoria: subcategoria.id_categoria,
        codigo: subcategoria.codigo || "",
        nombre: subcategoria.nombre || "",
        orden: subcategoria.orden ?? 0,
      });
    } else {
      setValues({
        id_categoria: categorias[0]?.id ?? 1,
        codigo: "",
        nombre: "",
        orden: 0,
      });
    }
  }, [isOpen, subcategoria, categorias]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.nombre.trim() || !values.codigo.trim() || !values.id_categoria) return;
    await onSubmit(values);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[550px] p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {subcategoria ? "Editar Subcategoría" : "Nueva Subcategoría"}
        </h4>
        <p className="text-xs text-gray-500 mb-6">Asigna la subcategoría a su categoría correspondiente.</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="id_categoria">Categoría Padre *</Label>
            <select
              id="id_categoria"
              value={values.id_categoria}
              onChange={(e) => setValues((p) => ({ ...p, id_categoria: Number(e.target.value) }))}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              disabled={isSaving}
            >
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre} ({cat.codigo})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={values.codigo}
                onChange={(e) => setValues((p) => ({ ...p, codigo: e.target.value }))}
                placeholder="Ej. ENT-CRI"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="orden">Orden</Label>
              <Input
                id="orden"
                type="number"
                value={values.orden}
                onChange={(e) => setValues((p) => ({ ...p, orden: Number(e.target.value) }))}
                disabled={isSaving}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="nombre">Nombre de la Subcategoría *</Label>
            <Input
              id="nombre"
              value={values.nombre}
              onChange={(e) => setValues((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Entradas Criollas"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button size="sm" type="submit" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
        </div>
      </form>
    </Modal>
  );
}