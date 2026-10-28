"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

type Props = {
  isOpen: boolean;
  numero: string;
  /** Factura → comunicación de baja; boleta → resumen diario con estado «anular». */
  tipoComprobante: number;
  enviando: boolean;
  onClose: () => void;
  onConfirmar: (motivo: string) => Promise<boolean>;
};

/** Pide el motivo de la baja (SUNAT lo exige, hasta 100 caracteres). */
export function BajaSunatModal({ isOpen, numero, tipoComprobante, enviando, onClose, onConfirmar }: Props) {
  const [motivo, setMotivo] = useState("");

  async function confirmar() {
    if (!motivo.trim()) return;
    if (await onConfirmar(motivo)) {
      setMotivo("");
      onClose();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { if (!enviando) onClose(); }} className="max-w-[480px] p-6">
      <h4 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">Dar de baja {numero} en SUNAT</h4>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {tipoComprobante === 2
          ? "Se enviará una comunicación de baja."
          : "Se enviará un resumen diario que anula la boleta."}{" "}
        SUNAT la procesa en unos minutos. Esta acción no se puede deshacer.
      </p>
      <Label htmlFor="baja_motivo">Motivo *</Label>
      <Input id="baja_motivo" value={motivo} maxLength={100} disabled={enviando}
        placeholder="Ej. ERROR EN EL RUC DEL CLIENTE"
        onChange={(e) => setMotivo(e.target.value.toUpperCase())} />
      <div className="mt-5 flex justify-end gap-2">
        <Button size="sm" variant="outline" disabled={enviando} onClick={onClose}>Cancelar</Button>
        <Button size="sm" disabled={!motivo.trim() || enviando} onClick={() => void confirmar()}>
          {enviando ? "Enviando..." : "Enviar baja"}
        </Button>
      </div>
    </Modal>
  );
}
