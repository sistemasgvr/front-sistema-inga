"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { useSucursalActiva } from "../hooks/use-sucursal-activa";

type Props = {
  /** null = todas las sucursales de la empresa. */
  value: number | null;
  onChange: (idSucursal: number | null) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Filtro opcional de sucursal para lo que es de la empresa (ventas, reportes,
 * gastos administrativos). Solo ofrece las sucursales del usuario; con una sola
 * no se muestra, porque «todas» ya es esa sucursal.
 */
export function FiltroSucursal({ value, onChange, disabled, className }: Props) {
  const { sucursales } = useSucursalActiva();
  if (sucursales.length < 2) return null;
  return (
    <div className={className}>
      <Label>Sucursal</Label>
      <Select
        options={[
          { value: "", label: "Todas las sucursales" },
          ...sucursales.map((s) => ({ value: String(s.id), label: s.nombre })),
        ]}
        defaultValue={value ? String(value) : ""}
        disabled={disabled}
        onChange={(v) => onChange(v ? Number(v) : null)}
      />
    </div>
  );
}
