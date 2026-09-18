"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { PersonaBusquedaItem } from "@/modules/personas/types/personas.types";
import { FormEvent, useEffect, useState } from "react";
import type { CategoriaInsumos, InsumoFormValues } from "../types/gdo.types";

type InsumoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: InsumoFormValues) => Promise<void>;
  categorias: CategoriaInsumos[];
  proveedores: PersonaBusquedaItem[];
  isSaving: boolean;
};

/**
 * Alta rápida de un insumo en la lista maestra.
 *
 * Es deliberadamente corto: el alcance pide que el cajero pueda crear el
 * producto "al vuelo" cuando no está en la lista. Solo nombre y categoría son
 * obligatorios — cualquier cosa más convertiría la creación en un trámite y el
 * cajero terminaría poniendo todo en "Otros".
 *
 * NO pido unidad de medida a propósito: el mismo insumo se compra en kg un día
 * y en paquete otro, así que la unidad se elige en cada compra.
 */
export function InsumoFormModal({
  isOpen,
  onClose,
  onSubmit,
  categorias,
  proveedores,
  isSaving,
}: InsumoFormModalProps) {
  const [values, setValues] = useState<InsumoFormValues>({
    id_categoria: null,
    nombre: "",
    precio_referencial: 0,
    id_proveedor_habitual: null,
  });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setValues({
      id_categoria: null,
      nombre: "",
      precio_referencial: 0,
      id_proveedor_habitual: null,
    });
    setIntentoEnviar(false);
    setServerError(null);
  }, [isOpen]);

  const errorCategoria =
    intentoEnviar && !values.id_categoria ? "Selecciona la categoría." : undefined;
  const errorNombre =
    intentoEnviar && !values.nombre.trim() ? "El nombre es obligatorio." : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);
    setServerError(null);

    if (!values.id_categoria || !values.nombre.trim()) return;

    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "No se pudo crear el insumo.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Nuevo insumo"
      subtitle="Se agrega a la lista para que esté disponible en las próximas compras."
      isSaving={isSaving}
      submitText="Crear insumo"
    >
      {serverError && (
        <Alert variant="error" title="Error" message={serverError} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="id_categoria">Categoría *</Label>
          <Select
            options={categorias.map((c) => ({
              value: String(c.id),
              label: c.nombre,
            }))}
            defaultValue={values.id_categoria ? String(values.id_categoria) : ""}
            placeholder="Selecciona la categoría"
            onChange={(value) => {
              setServerError(null);
              setValues((p) => ({ ...p, id_categoria: Number(value) }));
            }}
            disabled={isSaving}
            error={Boolean(errorCategoria)}
            hint={errorCategoria}
          />
        </div>

        <div>
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={values.nombre}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, nombre: e.target.value }));
            }}
            placeholder="Sal"
            error={Boolean(errorNombre)}
            hint={errorNombre}
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="precio_referencial">Precio habitual (S/)</Label>
          <Input
            id="precio_referencial"
            type="number"
            step={0.01}
            min="0"
            value={values.precio_referencial || ""}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({
                ...p,
                precio_referencial: Number(e.target.value) || 0,
              }));
            }}
            placeholder="0.00"
            hint="Opcional. Se actualiza solo con cada compra."
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="id_proveedor_habitual">Proveedor habitual</Label>
          <Select
            options={proveedores.map((p) => ({
              value: String(p.id),
              label: p.nombre_completo ?? `Proveedor ${p.id}`,
            }))}
            defaultValue={
              values.id_proveedor_habitual
                ? String(values.id_proveedor_habitual)
                : ""
            }
            placeholder="Sin proveedor fijo"
            onChange={(value) => {
              setServerError(null);
              setValues((p) => ({
                ...p,
                id_proveedor_habitual: value ? Number(value) : null,
              }));
            }}
            disabled={isSaving}
            hint="Opcional. Se preselecciona al comprar a crédito."
          />
        </div>
      </div>
    </FormModal>
  );
}
