"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormEvent, useEffect, useState } from "react";
import type { EstacionItem, EstacionFormValues } from "../types/estaciones.types";

type EstacionFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: EstacionFormValues) => Promise<void>;
  estacion: EstacionItem | null;
  isSaving: boolean;
};

export function EstacionFormModal({
  isOpen,
  onClose,
  onSubmit,
  estacion,
  isSaving,
}: EstacionFormModalProps) {
  const [values, setValues] = useState<EstacionFormValues>({
    id_sucursal: 1,
    codigo: "",
    nombre: "",
    tipo_estacion: 1,
    impresora_nombre: "",
    impresora_ip: "",
    usa_kds: false,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (estacion) {
      setValues({
        id_sucursal: estacion.id_sucursal ?? 1,
        codigo: estacion.codigo || "",
        nombre: estacion.nombre || "",
        tipo_estacion: estacion.tipo_estacion ?? 1,
        impresora_nombre: estacion.impresora_nombre || "",
        impresora_ip: estacion.impresora_ip || "",
        usa_kds: Boolean(estacion.usa_kds),
      });
    } else {
      setValues({
        id_sucursal: 1,
        codigo: "",
        nombre: "",
        tipo_estacion: 1,
        impresora_nombre: "",
        impresora_ip: "",
        usa_kds: false,
      });
    }
  }, [isOpen, estacion]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.nombre.trim() || !values.codigo.trim()) return;
    await onSubmit(values);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[550px] p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {estacion ? "Editar Estación" : "Nueva Estación"}
        </h4>
        <p className="text-xs text-gray-500 mb-6">Administra las configuraciones de impresión y KDS de la estación.</p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={values.codigo}
                onChange={(e) => setValues((p) => ({ ...p, codigo: e.target.value }))}
                placeholder="Ej. EST-COC"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="tipo_estacion">Tipo de Estación</Label>
              <select
                id="tipo_estacion"
                value={values.tipo_estacion}
                onChange={(e) => setValues((p) => ({ ...p, tipo_estacion: Number(e.target.value) }))}
                disabled={isSaving}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value={1}>1 - Cocina</option>
                <option value={2}>2 - Barra</option>
                <option value={3}>3 - Caja / Administración</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="nombre">Nombre de la Estación *</Label>
            <Input
              id="nombre"
              value={values.nombre}
              onChange={(e) => setValues((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Cocina Principal"
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="impresora_nombre">Nombre Impresora</Label>
              <Input
                id="impresora_nombre"
                value={values.impresora_nombre}
                onChange={(e) => setValues((p) => ({ ...p, impresora_nombre: e.target.value }))}
                placeholder="Ej. Ticketera Cocina"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="impresora_ip">IP Impresora</Label>
              <Input
                id="impresora_ip"
                value={values.impresora_ip}
                onChange={(e) => setValues((p) => ({ ...p, impresora_ip: e.target.value }))}
                placeholder="Ej. 192.168.1.50"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="usa_kds"
              checked={values.usa_kds}
              onChange={(e) => setValues((p) => ({ ...p, usa_kds: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="usa_kds" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ¿Utiliza pantalla KDS?
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