"use client";

import { LISTA_IDS, useLista } from "@/modules/listas";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormEvent, useState } from "react";
import type {
  EstacionItem,
  EstacionFormValues,
} from "../types/estaciones.types";

type EstacionFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: EstacionFormValues) => Promise<void>;
  estacion: EstacionItem | null;
  isSaving: boolean;
};

export function EstacionFormModal(props: EstacionFormModalProps) {
  if (!props.isOpen) return null;
  return <EstacionFormContent key={props.estacion?.id ?? "nuevo"} {...props} />;
}

function EstacionFormContent({
  isOpen,
  onClose,
  onSubmit,
  estacion,
  isSaving,
}: EstacionFormModalProps) {
  const tipos = useLista(LISTA_IDS.ESTACION_TIPO, { enabled: isOpen });
  const [values, setValues] = useState<EstacionFormValues>({
    id_sucursal: estacion?.id_sucursal ?? 1,
    codigo: estacion?.codigo || "",
    nombre: estacion?.nombre || "",
    tipo_estacion: estacion?.tipo_estacion ?? 0,
    impresora_nombre: estacion?.impresora_nombre || "",
    impresora_ip: estacion?.impresora_ip || "",
    usa_kds: Boolean(estacion?.usa_kds),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !values.nombre.trim() ||
      !values.codigo.trim() ||
      tipos.isLoading ||
      tipos.error ||
      !tipos.selectOptions.some((o) => o.value === String(values.tipo_estacion))
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
          {estacion ? "Editar Estación" : "Nueva Estación"}
        </h4>
        <p className="text-xs text-gray-500 mb-6">
          Administra las configuraciones de impresión y KDS de la estación.
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
                placeholder="Ej. EST-COC"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="tipo_estacion">Tipo de Estación</Label>
              <select
                id="tipo_estacion"
                value={
                  tipos.selectOptions.some(
                    (o) => o.value === String(values.tipo_estacion),
                  )
                    ? values.tipo_estacion
                    : ""
                }
                onChange={(e) =>
                  setValues((p) => ({
                    ...p,
                    tipo_estacion: Number(e.target.value),
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
            <Label htmlFor="nombre">Nombre de la Estación *</Label>
            <Input
              id="nombre"
              value={values.nombre}
              onChange={(e) =>
                setValues((p) => ({ ...p, nombre: e.target.value }))
              }
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
                onChange={(e) =>
                  setValues((p) => ({ ...p, impresora_nombre: e.target.value }))
                }
                placeholder="Ej. Ticketera Cocina"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="impresora_ip">IP Impresora</Label>
              <Input
                id="impresora_ip"
                value={values.impresora_ip}
                onChange={(e) =>
                  setValues((p) => ({ ...p, impresora_ip: e.target.value }))
                }
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
              onChange={(e) =>
                setValues((p) => ({ ...p, usa_kds: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label
              htmlFor="usa_kds"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              ¿Utiliza pantalla KDS?
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
                (o) => o.value === String(values.tipo_estacion),
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
