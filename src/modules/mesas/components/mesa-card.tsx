"use client";
import { Icon } from "@/components/ui/icon";
import type { Mesa } from "../types/mesas.types";

interface MesaCardProps {
  mesa: Mesa;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ESTADO_STYLES: Record<number, { className: string; icon: string; label: string }> = {
  1: {
    className:
      "border-success-300 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-500/10 dark:text-success-400",
    icon: "mdi:check-circle-outline",
    label: "Libre",
  },
  2: {
    className:
      "border-error-300 bg-error-50 text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400",
    icon: "mdi:account-group-outline",
    label: "Ocupada",
  },
  3: {
    className:
      "border-warning-300 bg-warning-50 text-warning-700 dark:border-warning-800 dark:bg-warning-500/10 dark:text-warning-400",
    icon: "mdi:cash-clock",
    label: "Por cobrar",
  },
  4: {
    className:
      "border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
    icon: "mdi:cancel",
    label: "Inhabilitada",
  },
};

export function MesaCard({ mesa, isSelected, onClick, disabled }: MesaCardProps) {
  const estado = ESTADO_STYLES[mesa.estado_mesa] ?? ESTADO_STYLES[1];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer
        ${
          isSelected
            ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:bg-brand-500/10"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
        }
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
      `}
    >
      <span className={`mb-2 rounded-xl border p-2.5 ${estado.className}`}>
        <Icon name={estado.icon} size={24} />
      </span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {mesa.codigo}
      </span>
      <span className="mt-1 text-xs text-gray-500">
        {mesa.capacidad_personas} pers.
      </span>
      <span
        className={`mt-2 rounded-full border px-2 py-0.5 text-xs font-medium ${estado.className}`}
      >
        {estado.label}
      </span>
    </button>
  );
}
