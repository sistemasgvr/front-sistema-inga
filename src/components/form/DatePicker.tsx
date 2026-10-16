"use client";

import { DateRangePicker, type DateRangePickerProps } from "./DateRangePicker";

export type DatePickerProps = Omit<DateRangePickerProps, "value" | "onChange" | "unDia"> & {
  /** Fecha vigente en ISO corto (`YYYY-MM-DD`). */
  value?: string;
  onChange: (fecha: string) => void;
};

/** Selector de una sola fecha con el mismo campo y calendario que `DateRangePicker`. */
export function DatePicker({ value = "", onChange, ...resto }: DatePickerProps) {
  return (
    <DateRangePicker
      {...resto}
      unDia
      value={{ desde: value, hasta: value }}
      onChange={(rango) => onChange(rango.desde)}
    />
  );
}
