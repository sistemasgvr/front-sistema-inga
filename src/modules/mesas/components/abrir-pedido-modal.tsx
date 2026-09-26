"use client";
import { useState, FormEvent } from "react";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import InputField from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { Mesa, AbrirPedidoValues } from "../types/mesas.types";
import { TIPOS_PEDIDO } from "../types/mesas.types";

interface AbrirPedidoModalProps {
  isOpen: boolean;
  mesa: Mesa;
  mozos: { id: number; nombre: string }[];
  turnoActivo: { id: number } | null;
  isSaving: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: AbrirPedidoValues) => Promise<boolean>;
}

export function AbrirPedidoModal({
  isOpen,
  mesa,
  mozos,
  turnoActivo,
  isSaving,
  error,
  onClose,
  onSubmit,
}: AbrirPedidoModalProps) {
  const [tipoPedido, setTipoPedido] = useState("");
  const [idMozo, setIdMozo] = useState("");
  const [numComensales, setNumComensales] = useState("2");
  const [observacion, setObservacion] = useState("");

  const mozoOptions = mozos.map((m) => ({
    value: String(m.id),
    label: m.nombre,
  }));

  const tipoOptions = Object.entries(TIPOS_PEDIDO).map(([value, info]) => ({
    value,
    label: info.label,
  }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!idMozo || !turnoActivo || !tipoPedido) return;

    const values: AbrirPedidoValues = {
      tipo_pedido: Number(tipoPedido) as 1 | 2 | 3,
      id_mesa: mesa.id,
      id_mozo: Number(idMozo),
      id_turno: turnoActivo.id,
      num_comensales: Number(numComensales) || undefined,
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
      title={`Abrir pedido - Mesa ${mesa.codigo}`}
      subtitle="Completa los datos para abrir un nuevo pedido"
      isSaving={isSaving}
      submitDisabled={!idMozo || !turnoActivo || !tipoPedido}
      submitText="Abrir pedido"
    >
      <div className="space-y-4">
        <div>
          <Label>Tipo de pedido</Label>
          <Select
            options={tipoOptions}
            defaultValue={tipoPedido}
            onChange={setTipoPedido}
            placeholder="Seleccione un tipo"
          />
        </div>

        <div>
          <Label>Mozo</Label>
          <Select
            options={mozoOptions}
            defaultValue={idMozo}
            onChange={setIdMozo}
            placeholder="Seleccione un mozo"
          />
        </div>

        <div>
          <Label>Número de comensales</Label>
          <InputField
            type="number"
            value={numComensales}
            onChange={(e) => setNumComensales(e.target.value)}
            min="1"
            max="20"
          />
        </div>

        <div>
          <Label>Observación (opcional)</Label>
          <TextArea
            value={observacion}
            onChange={setObservacion}
            rows={2}
            placeholder="Ej: Mesa cerca de la ventana"
          />
        </div>

        {!turnoActivo && (
          <div className="rounded-xl border border-warning-300 bg-warning-50 p-3 text-sm text-warning-700 dark:border-warning-800 dark:bg-warning-500/10 dark:text-warning-400">
            No tienes un turno abierto. Debes abrir un turno en caja antes de
            crear pedidos.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-error-300 bg-error-50 p-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}
      </div>
    </FormModal>
  );
}
