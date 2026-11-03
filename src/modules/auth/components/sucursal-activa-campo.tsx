"use client";

import Label from "@/components/form/Label";
import { Icon } from "@/components/ui/icon";
import { useSucursalActiva } from "../hooks/use-sucursal-activa";

type Props = {
  label?: string;
  /** Nombre ya conocido (p. ej. el del registro que se edita); si no, el de la sesión. */
  nombre?: string | null;
  className?: string;
};

/**
 * Sucursal fija de la sesión, de solo lectura. Se cambia desde «Trabajando en»
 * del encabezado; el backend usa siempre la sucursal de la sesión.
 */
export function SucursalActivaCampo({ label = "Sucursal", nombre, className }: Props) {
  const sucursal = useSucursalActiva();
  const texto = nombre ?? sucursal.nombre;
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div
        title="Se cambia desde «Trabajando en», en el encabezado"
        className="flex h-11 w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
      >
        <Icon name="mdi:store-marker-outline" size={18} />
        <span className="truncate">{texto ?? "Sin sucursal activa"}</span>
      </div>
    </div>
  );
}
