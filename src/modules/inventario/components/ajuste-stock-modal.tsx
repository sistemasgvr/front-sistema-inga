"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Alert from "@/components/ui/alert/Alert";
import { FormModal } from "@/components/ui/modal/FormModal";
import { FormEvent, useEffect, useState } from "react";
import type { StockItem, RegistrarMovimientoValues } from "../types/inventario.types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: RegistrarMovimientoValues) => Promise<void>;
  stockItem: StockItem | null;
  isSaving: boolean;
};

export function AjusteStockModal({ isOpen, onClose, onSubmit, stockItem, isSaving }: Props) {
  const [tipoAccion, setTipoAccion] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [cantidad, setCantidad] = useState<number>(1);
  const [observacion, setObservacion] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTipoAccion("ENTRADA");
      setCantidad(1);
      setObservacion("");
      setServerError(null);
    }
  }, [isOpen]);

  if (!isOpen || !stockItem) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSaving || !stockItem) return;

    if (cantidad <= 0) {
      setServerError("La cantidad debe ser mayor a cero.");
      return;
    }

    try {
      await onSubmit({
        codigo: `AJUSTE-${Date.now().toString().slice(-6)}`,
        id_tipo_movimiento: tipoAccion === "ENTRADA" ? 7 : 8,
        id_motivo_movimiento: tipoAccion === "ENTRADA" ? 1 : 2,
        id_almacen: stockItem.id_almacen,
        id_producto: stockItem.id_producto,
        id_unidad_medida: 1,
        cantidad,
        signo: tipoAccion === "ENTRADA" ? 1 : -1,
        costo_unitario: stockItem.costo_promedio,
        observacion: observacion.trim() || `Ajuste de ${tipoAccion.toLowerCase()}`,
        confirmar: true,
      });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Error al procesar el ajuste.");
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Ajuste Manual de Inventario"
      subtitle={`Producto: ${stockItem.producto_nombre}`}
      isSaving={isSaving}
    >
      {serverError && <Alert variant="error" title="Error" message={serverError} />}
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <Label>Operación *</Label>
          <Select
            options={[
              { value: "ENTRADA", label: "Entrada (+)" },
              { value: "SALIDA", label: "Salida (-) Merma" },
            ]}
            defaultValue={tipoAccion}
            onChange={(val) => setTipoAccion(val as "ENTRADA" | "SALIDA")}
          />
        </div>
        <div>
          <Label htmlFor="cantidad">Cantidad *</Label>
          <Input 
            id="cantidad" 
            type="number" 
            min="0.01" 
            step={0.01} 
            value={cantidad} 
            onChange={(e) => setCantidad(Number(e.target.value))} 
          />
        </div>
      </div>
      <div className="mt-3">
        <Label htmlFor="observacion">Observación</Label>
        <Input id="observacion" value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Motivo del ajuste..." />
      </div>
    </FormModal>
  );
}