"use client";

import { LISTA_IDS, useLista } from "@/modules/listas";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormEvent, useState } from "react";
import type { AlmacenItem, AlmacenFormValues } from "../types/almacenes.types";

type AlmacenFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AlmacenFormValues) => Promise<void>;
  almacen: AlmacenItem | null;
  isSaving: boolean;
};

export function AlmacenFormModal(props: AlmacenFormModalProps) {
  if (!props.isOpen) return null;
  return <AlmacenFormContent key={props.almacen?.id ?? "nuevo"} {...props} />;
}

function AlmacenFormContent({
  isOpen,
  onClose,
  onSubmit,
  almacen,
  isSaving,
}: AlmacenFormModalProps) {
  const tipos = useLista(LISTA_IDS.ALMACEN_TIPO, { enabled: isOpen });
  const [values, setValues] = useState<AlmacenFormValues>({
    id_sucursal: almacen?.id_sucursal ?? 1,
    codigo: almacen?.codigo || "",
    nombre: almacen?.nombre || "",
    descripcion: almacen?.descripcion || "",
    tipo_almacen: almacen?.tipo_almacen ?? 0,
    es_principal: Boolean(almacen?.es_principal),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !values.nombre.trim() ||
      !values.codigo.trim() ||
      tipos.isLoading ||
      tipos.error ||
      !tipos.selectOptions.some((o) => o.value === String(values.tipo_almacen))
    )
      return;
    await onSubmit(values);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[550px] p-6 lg:p-8"
    >
      <form onSubmit={handleSubmit}>
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {almacen ? "Editar Almacén" : "Nuevo Almacén"}
        </h4>
        <p className="text-xs text-gray-500 mb-6">
          Administra los datos físicos y de inventario del almacén.
        </p>

        <div className="space-y-4">
          {(tipos.error ||
            (!tipos.isLoading && tipos.selectOptions.length === 0)) && (
            <div role="alert" className="text-sm text-error-600">
              {tipos.error ?? "No hay tipos activos disponibles."}{" "}
              <button
                type="button"
                onClick={tipos.recargar}
                className="underline"
              >
                Reintentar
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={values.codigo}
                onChange={(e) =>
                  setValues((p) => ({ ...p, codigo: e.target.value }))
                }
                placeholder="Ej. ALM-01"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="tipo_almacen">Tipo de Almacén</Label>
              <select
                id="tipo_almacen"
                value={
                  tipos.selectOptions.some(
                    (o) => o.value === String(values.tipo_almacen),
                  )
                    ? values.tipo_almacen
                    : ""
                }
                onChange={(e) =>
                  setValues((p) => ({
                    ...p,
                    tipo_almacen: Number(e.target.value),
                  }))
                }
                disabled={isSaving || tipos.isLoading || Boolean(tipos.error)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">
                  {tipos.isLoading ? "Cargando tipos..." : "Selecciona un tipo"}
                </option>
                {tipos.selectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="nombre">Nombre del Almacén *</Label>
            <Input
              id="nombre"
              value={values.nombre}
              onChange={(e) =>
                setValues((p) => ({ ...p, nombre: e.target.value }))
              }
              placeholder="Ej. Almacén Principal"
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
              placeholder="Breve descripción..."
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="es_principal"
              checked={values.es_principal}
              onChange={(e) =>
                setValues((p) => ({ ...p, es_principal: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label
              htmlFor="es_principal"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              ¿Es Almacén Principal?
            </label>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t pt-4 dark:border-gray-800">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            type="submit"
            disabled={
              isSaving ||
              tipos.isLoading ||
              Boolean(tipos.error) ||
              !tipos.selectOptions.some(
                (o) => o.value === String(values.tipo_almacen),
              )
            }
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
