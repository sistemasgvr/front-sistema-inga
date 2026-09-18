"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import { FormEvent, useEffect, useState } from "react";
import {
  TIPO_GASTO,
  TIPOS_GASTO,
  type CategoriaFormValues,
  type CategoriaGasto,
} from "../types/gastos.types";

type CategoriaFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CategoriaFormValues) => Promise<void>;
  categoria: CategoriaGasto | null;
  /** Raíz bajo la que se creará una subcategoría. */
  padre: CategoriaGasto | null;
  isSaving: boolean;
};

export function CategoriaFormModal({
  isOpen,
  onClose,
  onSubmit,
  categoria,
  padre,
  isSaving,
}: CategoriaFormModalProps) {
  const [values, setValues] = useState<CategoriaFormValues>({
    codigo: "",
    nombre: "",
    tipo_gasto: TIPO_GASTO.FIJO,
    id_categoria_padre: null,
    orden: 0,
  });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const esSubcategoria = Boolean(padre) || Boolean(categoria?.id_categoria_padre);

  useEffect(() => {
    if (!isOpen) return;

    if (categoria) {
      setValues({
        codigo: categoria.codigo,
        nombre: categoria.nombre,
        tipo_gasto: categoria.tipo_gasto,
        id_categoria_padre: categoria.id_categoria_padre ?? null,
        orden: categoria.orden,
      });
    } else {
      setValues({
        codigo: "",
        nombre: "",
        // Una subcategoría hereda el tipo del padre: lo fijo desde el inicio
        // para que el usuario vea el valor correcto y no pueda cambiarlo.
        tipo_gasto: padre?.tipo_gasto ?? TIPO_GASTO.FIJO,
        id_categoria_padre: padre?.id ?? null,
        orden: 0,
      });
    }

    setIntentoEnviar(false);
    setServerError(null);
  }, [isOpen, categoria, padre]);

  const errorCodigo =
    intentoEnviar && !values.codigo.trim()
      ? "El código es obligatorio."
      : values.codigo.trim() && !/^[A-Za-z0-9_-]+$/.test(values.codigo.trim())
        ? "Usa solo letras, números, guion o guion bajo."
        : undefined;
  const errorNombre =
    intentoEnviar && !values.nombre.trim() ? "El nombre es obligatorio." : undefined;

  // Bloqueo cambiar el tipo si ya tiene gastos: cambiaría los totales por tipo
  // de meses ya cerrados. Es la misma regla que valida el backend.
  const bloqueaTipo =
    esSubcategoria || Number(categoria?.gastos_registrados ?? 0) > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);
    setServerError(null);

    if (!values.codigo.trim() || !values.nombre.trim() || errorCodigo) return;

    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "No se pudo guardar.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={
        categoria
          ? "Editar categoría"
          : padre
            ? `Nueva subcategoría de ${padre.nombre}`
            : "Nueva categoría de gasto"
      }
      subtitle={
        padre
          ? "Hereda el tipo de su categoría padre."
          : "Agrupa los gastos para el reporte mensual."
      }
      isSaving={isSaving}
    >
      {serverError && (
        <Alert variant="error" title="Error al guardar" message={serverError} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="codigo">Código *</Label>
          <Input
            id="codigo"
            value={values.codigo}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, codigo: e.target.value.toUpperCase() }));
            }}
            placeholder="LUZ"
            error={Boolean(errorCodigo)}
            hint={errorCodigo}
            disabled={isSaving}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={values.nombre}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, nombre: e.target.value }));
            }}
            placeholder="Luz"
            error={Boolean(errorNombre)}
            hint={errorNombre}
            disabled={isSaving}
          />
        </div>
      </div>

      <div>
        <Label>Tipo de gasto *</Label>
        <div className="grid grid-cols-2 gap-3">
          {TIPOS_GASTO.map((opcion) => {
            const activo = values.tipo_gasto === opcion.valor;
            return (
              <button
                key={opcion.valor}
                type="button"
                disabled={isSaving || bloqueaTipo}
                onClick={() => {
                  setServerError(null);
                  setValues((p) => ({ ...p, tipo_gasto: opcion.valor }));
                }}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  activo
                    ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <Icon
                  name={opcion.icono}
                  size={20}
                  className={activo ? "text-brand-500" : "text-gray-400"}
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-800 dark:text-white/90">
                    {opcion.etiqueta}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    {opcion.detalle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {bloqueaTipo && (
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {esSubcategoria
              ? "Una subcategoría hereda el tipo de su categoría padre."
              : `No se puede cambiar: ya tiene ${categoria?.gastos_registrados} gasto(s) registrado(s) y cambiaría los totales de meses ya cerrados.`}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="orden">Orden</Label>
        <Input
          id="orden"
          type="number"
          min="0"
          value={values.orden}
          onChange={(e) => {
            setServerError(null);
            setValues((p) => ({ ...p, orden: Number(e.target.value) || 0 }));
          }}
          hint="Define la posición en la lista. Menor número aparece primero."
          disabled={isSaving}
        />
      </div>
    </FormModal>
  );
}
