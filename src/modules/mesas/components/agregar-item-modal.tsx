"use client";
import { useState, FormEvent } from "react";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import InputField from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { ProductoOption, AgregarItemValues } from "../types/mesas.types";

interface AgregarItemModalProps {
  isOpen: boolean;
  productos: ProductoOption[];
  isSaving: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: AgregarItemValues) => Promise<boolean>;
}

export function AgregarItemModal({
  isOpen,
  productos,
  isSaving,
  error,
  onClose,
  onSubmit,
}: AgregarItemModalProps) {
  const [idProducto, setIdProducto] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [observacion, setObservacion] = useState("");

  const productoOptions = productos.map((p) => ({
    value: String(p.id),
    label: `${p.nombre} - S/ ${p.precio_venta.toFixed(2)}`,
  }));

  const productoSeleccionado = productos.find(
    (p) => String(p.id) === idProducto,
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!idProducto) return;

    const values: AgregarItemValues = {
      id_producto: Number(idProducto),
      cantidad: Number(cantidad) || 1,
      precio_unitario: productoSeleccionado?.precio_venta,
      observacion: observacion.trim() || undefined,
    };

    const success = await onSubmit(values);
    if (success) {
      onClose();
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Agregar ítem"
      subtitle="Selecciona un producto y la cantidad"
      isSaving={isSaving}
      submitDisabled={!idProducto}
      submitText="Agregar"
    >
      <div className="space-y-4">
        <div>
          <Label>Producto</Label>
          <Select
            options={productoOptions}
            defaultValue={idProducto}
            onChange={setIdProducto}
            placeholder="Seleccione un producto"
            searchableThreshold={5}
          />
        </div>

        {productoSeleccionado && (
          <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Precio:</span> S/{" "}
              {productoSeleccionado.precio_venta.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Categoría:</span>{" "}
              {productoSeleccionado.nombre_categoria}
            </p>
          </div>
        )}

        <div>
          <Label>Cantidad</Label>
          <InputField
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            min="1"
            max="999"
          />
        </div>

        <div>
          <Label>Observación (opcional)</Label>
          <TextArea
            value={observacion}
            onChange={setObservacion}
            rows={2}
            placeholder="Ej: Sin sal, bien cocido"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-error-300 bg-error-50 p-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}
      </div>
    </FormModal>
  );
}
