import React, { useId } from "react";
import { Icon } from "@/components/ui/icon";

interface InfoTooltipProps {
  /** Texto de ayuda que se muestra al pasar el mouse o enfocar el ícono. */
  text: string;
  /** Texto accesible del botón. */
  label?: string;
}

/** Ícono "?" con un globo de ayuda. Funciona con mouse y con teclado. */
const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, label = "Más información" }) => {
  const id = useId();

  return (
    <span className="group relative ml-1.5 inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        className="flex items-center text-gray-400 transition-colors hover:text-brand-600 focus:text-brand-600 focus:outline-hidden dark:text-gray-500 dark:hover:text-brand-400"
      >
        <Icon name="mdi:help-circle-outline" size={16} />
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-theme-lg group-hover:block group-focus-within:block dark:bg-gray-800"
      >
        {text}
      </span>
    </span>
  );
};

export default InfoTooltip;
