"use client";
import { useState, FormEvent } from "react";
import Label from "@/components/form/Label";
import InputField from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { FormModal } from "@/components/ui/modal/FormModal";
import Alert from "@/components/ui/alert/Alert";
import type { Mesa, AbrirPedidoValues } from "../types/mesas.types";
import { LISTA_IDS, ListaSelect } from "@/modules/listas";
import { getStoredUser } from "@/modules/auth/services/auth.service";

// Desde una mesa el pedido siempre es de tipo MESA; llevar y delivery tienen su propio modal.
const TIPO_MESA = "1";
const CODIGOS_TIPO_MESA = ["MESA"];

interface AbrirPedidoModalProps {
  isOpen: boolean;
  mesa: Mesa;
  turnoActivo: { id: number } | null;
  isSaving: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: AbrirPedidoValues) => Promise<boolean>;
}

export function AbrirPedidoModal(props: AbrirPedidoModalProps) {
  if (!props.isOpen) return null;
  return <AbrirPedidoContent key={props.mesa.id} {...props} />;
}

function AbrirPedidoContent({
  isOpen,
  mesa,
  turnoActivo,
  isSaving,
  error,
  onClose,
  onSubmit,
}: AbrirPedidoModalProps) {
  // El mozo es el usuario de la sesión: coincide con auth_usuario.id y no se puede cambiar.
  const [usuario] = useState(getStoredUser);
  const idMozo = usuario?.id ?? null;
  const nombreMozo = usuario ? [usuario.nombres, usuario.apellidos].filter(Boolean).join(" ") : "";
  const tipoPedido = TIPO_MESA;
  const [numComensales, setNumComensales] = useState("2");
  const [observacion, setObservacion] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      isSaving ||
      !idMozo ||
      !turnoActivo ||
      Number(numComensales) <= 0
    )
      return;

    const values: AbrirPedidoValues = {
      tipo_pedido: 1,
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
      submitDisabled={!idMozo || !turnoActivo}
      submitText="Abrir pedido"
    >
      <div className="space-y-4">
        <div>
          <Label>Tipo de pedido</Label>
          <ListaSelect
            idLista={LISTA_IDS.PEDIDO_TIPO}
            campoEtiqueta="codigo"
            codigos={CODIGOS_TIPO_MESA}
            disabled
            onChange={() => undefined}
            defaultValue={tipoPedido}
            placeholder="Seleccione un tipo"
          />
        </div>

        <div>
          <Label>Mozo</Label>
          <InputField value={nombreMozo} disabled placeholder="Sin sesión activa" />
          {!idMozo && (
            <p className="mt-1 text-xs text-error-500">
              No se encontró el usuario de la sesión. Vuelve a iniciar sesión.
            </p>
          )}
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
          <Alert
            variant="error"
            title="No se pudo abrir el pedido"
            message={error}
          />
        )}
      </div>
    </FormModal>
  );
}
