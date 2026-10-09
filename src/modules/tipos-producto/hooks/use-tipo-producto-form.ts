"use client";
import { useRef, useState } from "react";
import { createTipoProducto } from "../services/tipos-producto.service";
import type { TipoProducto } from "../types/tipos-producto.types";

export function useTipoProductoForm(onCreated: (tipo: TipoProducto) => void) {
  const [values, setValues] = useState({
    nombre: "",
    permite_venta: false,
    requiere_receta: false,
    requiere_estacion: false,
    permite_stock_inicial: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  async function save() {
    if (saving.current) return;
    if (!values.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    saving.current = true;
    setIsSaving(true);
    setError(null);
    try {
      onCreated(await createTipoProducto(values));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo crear el tipo.",
      );
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }
  return { values, setValues, isSaving, error, save };
}
