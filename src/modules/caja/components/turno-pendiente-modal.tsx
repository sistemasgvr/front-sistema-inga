"use client";

import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import type { TurnoItem } from "../types/caja.types";
import { formatearFecha, formatearFechaHora, formatearSoles } from "../utils/formato";

type TurnoPendienteModalProps = {
  isOpen: boolean;
  turno: TurnoItem;
  onCerrar: () => void;
  onContinuar: () => void;
};

export function TurnoPendienteModal({
  isOpen,
  turno,
  onCerrar,
  onContinuar,
}: TurnoPendienteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      showCloseButton={false}
      className="max-w-[560px] overflow-hidden"
    >
      <div className="bg-brand-500 px-6 py-6 text-center text-white sm:px-8">
        <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
          <Icon name="mdi:alert-outline" size={40} />
        </span>
        <h3 className="text-xl font-bold sm:text-2xl">Caja pendiente de cierre</h3>
        <p className="mt-1 text-sm text-white/90">
          Tienes una caja abierta del {formatearFecha(turno.fecha_apertura)}
        </p>
      </div>

      <div className="px-6 py-6 sm:px-8">
        <div className="mb-5 space-y-2 rounded-xl  p-4 text-sm dark:border-warning-500/30 dark:bg-warning-500/10">
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 dark:text-gray-400">Caja</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {turno.nombre_caja}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 dark:text-gray-400">Abierta</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatearFechaHora(turno.fecha_apertura)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 dark:text-gray-400">Efectivo esperado</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatearSoles(turno.efectivo_esperado ?? 0)}
            </span>
          </div>
        </div>

        <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
          ¿Deseas cerrar esa caja ahora o seguir trabajando con la caja de ese
          día?
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1"
            type="button"
            onClick={onCerrar}
            startIcon={<Icon name="mdi:lock-outline" size={18} />}
          >
            Cerrar caja
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            type="button"
            onClick={onContinuar}
            startIcon={<Icon name="mdi:arrow-right" size={18} />}
          >
            Continuar con esa caja
          </Button>
        </div>
      </div>
    </Modal>
  );
}
