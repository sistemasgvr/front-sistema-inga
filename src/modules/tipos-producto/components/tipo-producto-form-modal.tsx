"use client";
import { FormModal } from "@/components/ui/modal/FormModal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Alert from "@/components/ui/alert/Alert";
import { useTipoProductoForm } from "../hooks/use-tipo-producto-form";
import type { TipoProducto } from "../types/tipos-producto.types";

const indicadores = [
  ["permite_venta", "Permite venta"],
  ["requiere_receta", "Requiere receta"],
  ["requiere_estacion", "Requiere estación"],
  ["permite_stock_inicial", "Permite stock inicial"],
] as const;

export function TipoProductoFormModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (tipo: TipoProducto) => void;
}) {
  const form = useTipoProductoForm(onCreated);
  return (
    <FormModal
      isOpen
      onClose={() => {
        if (!form.isSaving) onClose();
      }}
      title="Añadir tipo de producto"
      subtitle="Define cómo se configurarán los productos de este tipo."
      isSaving={form.isSaving}
      maxWidth="max-w-[460px]"
      onSubmit={(event) => {
        event.preventDefault();
        void form.save();
      }}
    >
      {form.error && (
        <Alert
          variant="error"
          title="No se pudo guardar"
          message={form.error}
        />
      )}
      <div>
        <Label htmlFor="nombre_tipo_producto">Nombre *</Label>
        <Input
          id="nombre_tipo_producto"
          value={form.values.nombre}
          disabled={form.isSaving}
          onChange={(event) =>
            form.setValues((values) => ({
              ...values,
              nombre: event.target.value,
            }))
          }
        />
      </div>
      {indicadores.map(([key, label]) => (
        <Checkbox
          key={key}
          id={`tipo_${key}`}
          label={label}
          checked={form.values[key]}
          disabled={form.isSaving}
          onChange={(checked) =>
            form.setValues((values) => ({ ...values, [key]: checked }))
          }
        />
      ))}
    </FormModal>
  );
}
