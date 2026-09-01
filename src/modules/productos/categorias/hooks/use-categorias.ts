"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  listCategorias,
  createCategoria,
  updateCategoria,
  toggleCategoriaStatus,
} from "../services/categorias.service";
import type {
  CategoriaItem,
  CategoriaFormValues,
  CategoriaStatusFilter,
  CategoriasResumen,
} from "../types/categorias.types";

const PAGE_SIZE = 10;

export function useCategorias() {
  const [registros, setRegistros] = useState<CategoriaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] = useState<CategoriaStatusFilter>("activos");
  const [filtroEsCarta, setFiltroEsCarta] = useState<boolean | undefined>(undefined);

  const [resumen, setResumen] = useState<CategoriasResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error" | "info"; title: string; message: string } | null>(null);

  const [editingCategoria, setEditingCategoria] = useState<CategoriaItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmCategoria, setConfirmCategoria] = useState<CategoriaItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const loadCategorias = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listCategorias({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
        es_carta: filtroEsCarta,
      });
      setRegistros(result.registros);
      setTotal(result.total);
      if (result.resumen) setResumen(result.resumen);
    } catch {
      setFeedback({
        variant: "error",
        title: "Error al cargar",
        message: "No se pudieron obtener las categorías.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, filtroEsCarta]);

  useEffect(() => {
    void loadCategorias();
  }, [loadCategorias]);

  function handleFilterStatus(status: CategoriaStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function openCreateModal() {
    setEditingCategoria(null);
    setIsFormOpen(true);
  }

  function openEditModal(cat: CategoriaItem) {
    setEditingCategoria(cat);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingCategoria(null);
  }

  async function saveCategoria(values: CategoriaFormValues) {
    setIsSaving(true);
    try {
      if (editingCategoria) {
        await updateCategoria(editingCategoria.id, values);
        setFeedback({ variant: "success", title: "Actualizado", message: `Categoría '${values.nombre}' actualizada con éxito.` });
      } else {
        await createCategoria(values);
        setFeedback({ variant: "success", title: "Registrado", message: `Categoría '${values.nombre}' creada con éxito.` });
        setPagina(1);
      }
      closeFormModal();
      await loadCategorias();
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

  function openConfirmModal(cat: CategoriaItem) {
    setConfirmCategoria(cat);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    setIsConfirmOpen(false);
    setConfirmCategoria(null);
  }

  async function confirmToggleStatus() {
    if (!confirmCategoria) return;
    setIsToggling(true);
    try {
      await toggleCategoriaStatus(confirmCategoria);
      closeConfirmModal();
      await loadCategorias();
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
    filtroEsCarta,
    setFiltroEsCarta,
    resumen,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    editingCategoria,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveCategoria,
    confirmCategoria,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}