"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createCategoria,
  listCategorias,
  toggleCategoriaStatus,
  updateCategoria,
} from "../services/gastos.service";
import type {
  CategoriaFormValues,
  CategoriaGasto,
  CategoriasResumen,
} from "../types/gastos.types";

/** Pantalla de configuración de categorías de gasto. */
export function useCategoriasGasto() {
  const [registros, setRegistros] = useState<CategoriaGasto[]>([]);
  const [resumen, setResumen] = useState<CategoriasResumen>({
    total: 0,
    fijos: 0,
    variables: 0,
    inactivos: 0,
  });

  const [estadoFiltro, setEstadoFiltro] = useState<
    "todos" | "activos" | "inactivos"
  >("activos");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [editing, setEditing] = useState<CategoriaGasto | null>(null);
  /** Cuando se crea una subcategoría, acá va la raíz elegida. */
  const [padreParaNueva, setPadreParaNueva] = useState<CategoriaGasto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmItem, setConfirmItem] = useState<CategoriaGasto | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listCategorias(undefined, estadoFiltro);
      setRegistros(result.registros);
      setResumen(result.resumen);
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al cargar",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron obtener las categorías.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [estadoFiltro]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreateModal(padre?: CategoriaGasto) {
    setEditing(null);
    setPadreParaNueva(padre ?? null);
    setIsFormOpen(true);
  }

  function openEditModal(item: CategoriaGasto) {
    setEditing(item);
    setPadreParaNueva(null);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditing(null);
    setPadreParaNueva(null);
  }

  async function save(values: CategoriaFormValues) {
    setIsSaving(true);
    try {
      if (editing) {
        await updateCategoria(editing.id, values);
        setFeedback({
          variant: "success",
          title: "Actualizada",
          message: `'${values.nombre}' se actualizó con éxito.`,
        });
      } else {
        await createCategoria(values);
        setFeedback({
          variant: "success",
          title: "Creada",
          message: `'${values.nombre}' se agregó a las categorías.`,
        });
      }
      closeFormModal();
      await load();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al guardar",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  function openConfirmModal(item: CategoriaGasto) {
    setConfirmItem(item);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    setIsConfirmOpen(false);
    setConfirmItem(null);
  }

  async function confirmToggleStatus() {
    if (!confirmItem) return;
    setIsToggling(true);
    try {
      await toggleCategoriaStatus(confirmItem);
      closeConfirmModal();
      await load();
    } catch (error) {
      // Rechazos típicos: "tiene N gastos registrados" o "tiene subcategorías
      // activas". El backend ya explica qué hacer.
      closeConfirmModal();
      setFeedback({
        variant: "error",
        title: "No se pudo cambiar el estado",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setIsToggling(false);
    }
  }

  return {
    registros,
    resumen,
    estadoFiltro,
    setEstadoFiltro,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    editing,
    padreParaNueva,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    save,
    confirmItem,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}
