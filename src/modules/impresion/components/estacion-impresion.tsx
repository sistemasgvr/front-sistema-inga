"use client";

import Switch from "@/components/form/input/Switch";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import type { EstacionItem } from "@/modules/estaciones/types/estaciones.types";
import type { PendienteImpresion } from "../types/impresion.types";
import { useEstacionImpresion } from "../hooks/use-estacion-impresion";

/** Activa o desactiva la impresión de comandas de la estación en esta PC. */
export function ImprimirAquiSwitch({ estacion }: { estacion: EstacionItem }) {
  const { selected, seleccionar } = useEstacionImpresion(estacion);
  const disponible = estacion.estado === 1 && !!estacion.impresora_ip;
  return <Switch
    id={`estacion_imprimir_${estacion.id}`}
    checked={selected}
    disabled={!selected && !disponible}
    onChange={seleccionar}
    title={disponible || selected ? "Imprimir comandas de esta estación en esta PC" : "La estación necesita una impresora con IP"}
  />;
}

type ColaImpresionModalProps = {
  estacion: EstacionItem;
  pendientes: PendienteImpresion[] | null;
  busy: boolean;
  onClose: () => void;
  onResolver: (item: PendienteImpresion, enviado: boolean) => void;
  onDescargar: (item: PendienteImpresion) => void;
};

export function ColaImpresionModal({ estacion, pendientes, busy, onClose, onResolver, onDescargar }: ColaImpresionModalProps) {
  return <Modal isOpen={pendientes !== null} onClose={onClose} className="max-w-[520px] p-6">
    <h4 className="pr-12 text-lg font-bold text-gray-900 dark:text-white">Cola de impresión</h4>
    <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">{estacion.nombre}</p>
    {!pendientes?.length && <p className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-white/[0.03]">Sin comandas pendientes.</p>}
    <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
      {pendientes?.map((item) => <li key={item.id} className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
        <p className="text-gray-800 dark:text-gray-200">#{item.id} · {item.pedido} · <span className="font-medium">{item.estado}</span></p>
        {item.error && <p className="mt-1 text-xs text-error-600">{item.error}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {item.estado !== 'pendiente' && <>
            <Button size="sm" variant="outline" className="!py-1.5" disabled={busy} onClick={() => onResolver(item, false)}>Reintentar envío</Button>
            <Button size="sm" variant="outline" className="!py-1.5" disabled={busy} onClick={() => onResolver(item, true)}>Ya salió en papel</Button>
          </>}
          <Button size="sm" variant="outline" className="!py-1.5" disabled={busy} onClick={() => onDescargar(item)}
            startIcon={<Icon name="mdi:file-pdf-box" size={16} />}>Descargar PDF</Button>
        </div>
      </li>)}
    </ul>
  </Modal>;
}
