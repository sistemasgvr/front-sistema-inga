import React from "react";
import { twMerge } from "tailwind-merge";
import { Icon } from "@/components/ui/icon";

interface AddOptionButtonProps {
  /** Texto accesible y del tooltip, p. ej. "Añadir categoría". */
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Mensaje que se muestra al pasar el mouse cuando está deshabilitado. */
  disabledReason?: string;
  className?: string;
}

/**
 * Botón cuadrado "+" que acompaña a un Select para crear una opción nueva
 * sin salir del formulario. Tiene la misma altura que los inputs (h-11).
 */
const AddOptionButton: React.FC<AddOptionButtonProps> = ({
  label,
  onClick,
  disabled = false,
  disabledReason,
  className,
}) => {
  const title = disabled && disabledReason ? disabledReason : label;

  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={twMerge(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-500",
        className,
      )}
    >
      <Icon name="mdi:plus" size={20} />
    </button>
  );
};

export default AddOptionButton;
