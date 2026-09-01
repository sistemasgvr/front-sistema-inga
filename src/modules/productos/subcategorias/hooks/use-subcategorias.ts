"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  listSubCategorias,
  createSubCategoria,
  updateSubCategoria,
  toggleSubCategoriaStatus,
} from "../services/subcategorias.service";
import type {
  SubCategoriaItem,
  SubCategoriaFormValues,
  SubCategoriaStatusFilter,
  SubCategoriasResumen,
} from "../types/subcategorias.types";

const PAGE_SIZE = 10;

export function useSubCategorias() {
  const [registros, setRegistros] = useState<SubCategoriaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] = useState<SubCategoriaStatusFilter>("activos");
  const [filtroCategoria, setFiltroCategoria] = useState<number | undefined>(undefined);

  const [resumen, setResumen] = useState<SubCategoriasResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error" | "info"; title: string; message: string } | null>(null);

  const [editingSubCategoria, setEditingSubCategoria] = useState<SubCategoriaItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmSubCategoria, setConfirmSubCategoria] = useState<SubCategoriaItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const loadSubCategorias = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listSubCategorias({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
        id_categoria: filtroCategoria,
      });
      setRegistros(result.registros);
      setTotal(result.total);
      if (result.resumen) setResumen(result.resumen);
    } catch {
      setFeedback({
        variant: "error",
        title: "Error al cargar",
        message: "No se pudieron obtener las subcategorías.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, filtroCategoria]);

  useEffect(() => {
    void loadSubCategorias();
  }, [loadSubCategorias]);

  function handleFilterStatus(status: SubCategoriaStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function openCreateModal() {
    setEditingSubCategoria(null);
    setIsFormOpen(true);
  }

  function openEditModal(subcat: SubCategoriaItem) {
    setEditingSubCategoria(subcat);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingSubCategoria(null);
  }

  async function saveSubCategoria(values: SubCategoriaFormValues) {
    setIsSaving(true);
    try {
      if (editingSubCategoria) {
        await updateSubCategoria(editingSubCategoria.id, values);
        setFeedback({ variant: "success", title: "Actualizado", message: `Subcategoría '${values.nombre}' actualizada con éxito.` });
      } else {
        await createSubCategoria(values);
        setFeedback({ variant: "success", title: "Registrado", message: `Subcategoría '${values.nombre}' creada con éxito.` });
        setPagina(1);
      }
      closeFormModal();
      await loadSubCategorias();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al guardar",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function openConfirmModal(subcat: SubCategoriaItem) {
    setConfirmSubCategoria(subcat);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    setIsConfirmOpen(false);
    setConfirmSubCategoria(null);
  }

  async function confirmToggleStatus() {
    if (!confirmSubCategoria) return;
    setIsToggling(true);
    try {
      await toggleSubCategoriaStatus(confirmSubCategoria);
      closeConfirmModal();
      await loadSubCategorias();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Error al cambiar estado.",
      });
    } finally {
      setIsToggling(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    registros,
    total,
    pagina,
    setPagina,
    pageSize,
    setPageSize: (size: number) => { setPageSize(size); setPagina(1); },
    totalPages,
    searchInput,
    setSearchInput,
    estadoFiltro,
    handleFilterStatus,
    filtroCategoria,
    setFiltroCategoria,
    resumen,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    editingSubCategoria,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveSubCategoria,
    confirmSubCategoria,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}