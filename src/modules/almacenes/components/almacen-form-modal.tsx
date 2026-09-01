"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormEvent, useEffect, useState } from "react";
import type { AlmacenItem, AlmacenFormValues } from "../types/almacenes.types";

type AlmacenFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AlmacenFormValues) => Promise<void>;
  almacen: AlmacenItem | null;
  isSaving: boolean;
};

export function AlmacenFormModal({
  isOpen,
  onClose,
  onSubmit,
  almacen,
  isSaving,
}: AlmacenFormModalProps) {
  const [values, setValues] = useState<AlmacenFormValues>({
    id_sucursal: 1,
    codigo: "",
    nombre: "",
    descripcion: "",
    tipo_almacen: 1,
    es_principal: false,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (almacen) {
      setValues({
        id_sucursal: almacen.id_sucursal ?? 1,
        codigo: almacen.codigo || "",
        nombre: almacen.nombre || "",
        descripcion: almacen.descripcion || "",
        tipo_almacen: almacen.tipo_almacen ?? 1,
        es_principal: Boolean(almacen.es_principal),
      });
    } else {
      setValues({
        id_sucursal: 1,
        codigo: "",
        nombre: "",
        descripcion: "",
        tipo_almacen: 1,
        es_principal: false,
      });
    }
  }, [isOpen, almacen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.nombre.trim() || !values.codigo.trim()) return;
    await onSubmit(values);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[550px] p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {almacen ? "Editar Almacén" : "Nuevo Almacén"}
        </h4>
        <p className="text-xs text-gray-500 mb-6">Administra los datos físicos y de inventario del almacén.</p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={values.codigo}
                onChange={(e) => setValues((p) => ({ ...p, codigo: e.target.value }))}
                placeholder="Ej. ALM-01"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="tipo_almacen">Tipo de Almacén</Label>
              <select
                id="tipo_almacen"
                value={values.tipo_almacen}
                onChange={(e) => setValues((p) => ({ ...p, tipo_almacen: Number(e.target.value) }))}
                disabled={isSaving}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value={1}>1 - Crudo / Insumos</option>
                <option value={2}>2 - Producción Cocina</option>
                <option value={3}>3 - Producción Barra</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="nombre">Nombre del Almacén *</Label>
            <Input
              id="nombre"
              value={values.nombre}
              onChange={(e) => setValues((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Almacén Principal"
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
              id="es_principal"
              checked={values.es_principal}
              onChange={(e) => setValues((p) => ({ ...p, es_principal: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="es_principal" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ¿Es Almacén Principal?
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