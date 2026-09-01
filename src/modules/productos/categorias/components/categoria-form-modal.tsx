"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormEvent, useEffect, useState } from "react";
import type { CategoriaItem, CategoriaFormValues } from "../types/categorias.types";

type CategoriaFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CategoriaFormValues) => Promise<void>;
  categoria: CategoriaItem | null;
  isSaving: boolean;
};

export function CategoriaFormModal({
  isOpen,
  onClose,
  onSubmit,
  categoria,
  isSaving,
}: CategoriaFormModalProps) {
  const [values, setValues] = useState<CategoriaFormValues>({
    codigo: "",
    nombre: "",
    descripcion: "",
    es_carta: false,
    orden: 0,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (categoria) {
      setValues({
        codigo: categoria.codigo || "",
        nombre: categoria.nombre || "",
        descripcion: categoria.descripcion || "",
        es_carta: Boolean(categoria.es_carta),
        orden: categoria.orden ?? 0,
      });
    } else {
      setValues({
        codigo: "",
        nombre: "",
        descripcion: "",
        es_carta: false,
        orden: 0,
      });
    }
  }, [isOpen, categoria]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.nombre.trim() || !values.codigo.trim()) return;
    await onSubmit(values);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[550px] p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {categoria ? "Editar Categoría" : "Nueva Categoría"}
        </h4>
        <p className="text-xs text-gray-500 mb-6">Administra los datos de agrupación principal.</p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={values.codigo}
                onChange={(e) => setValues((p) => ({ ...p, codigo: e.target.value }))}
                placeholder="Ej. CAT-01"
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
            <Label htmlFor="nombre">Nombre de la Categoría *</Label>
            <Input
              id="nombre"
              value={values.nombre}
              onChange={(e) => setValues((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Platos Principales"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={values.descripcion}
              onChange={(e) => setValues((p) => ({ ...p, descripcion: e.target.value }))}
              placeholder="Breve descripción..."
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="es_carta"
              checked={values.es_carta}
              onChange={(e) => setValues((p) => ({ ...p, es_carta: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="es_carta" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ¿Visible en Carta del Restaurante?
            </label>
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