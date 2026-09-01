"use client"

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  listAlmacenes,
  createAlmacen,
  updateAlmacen,
  toggleAlmacenStatus,
} from "../services/almacenes.service";
import type {
  AlmacenItem,
  AlmacenFormValues,
  AlmacenStatusFilter,
  AlmacenesResumen,
} from "../types/almacenes.types";

const PAGE_SIZE = 10;

export function useAlmacenes() {
  const [registros, setRegistros] = useState<AlmacenItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] = useState<AlmacenStatusFilter>("activos");
  const [sucursalFiltro, setSucursalFiltro] = useState<number | undefined>(undefined);

  const [resumen, setResumen] = useState<AlmacenesResumen>({ total: 0, activos: 0, inactivos: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error" | "info"; title: string; message: string } | null>(null);

  const [editingAlmacen, setEditingAlmacen] = useState<AlmacenItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmAlmacen, setConfirmAlmacen] = useState<AlmacenItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const loadAlmacenes = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listAlmacenes({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
        id_sucursal: sucursalFiltro,
      });
      setRegistros(result.registros);
      setTotal(result.total);
      if (result.resumen) setResumen(result.resumen);
    } catch {
      setFeedback({ variant: "error", title: "Error al cargar", message: "No se pudieron obtener los almacenes." });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, sucursalFiltro]);

  useEffect(() => {
    void loadAlmacenes();
  }, [loadAlmacenes]);

  function handleFilterStatus(status: AlmacenStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function openCreateModal() {
    setEditingAlmacen(null);
    setIsFormOpen(true);
  }

  function openEditModal(item: AlmacenItem) {
    setEditingAlmacen(item);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingAlmacen(null);
  }

  async function saveAlmacen(values: AlmacenFormValues) {
    setIsSaving(true);
    try {
      if (editingAlmacen) {
        await updateAlmacen(editingAlmacen.id, values);
        setFeedback({ variant: "success", title: "Actualizado", message: `Almacén '${values.nombre}' actualizado con éxito.` });
      } else {
        await createAlmacen(values);
        setFeedback({ variant: "success", title: "Registrado", message: `Almacén '${values.nombre}' creado con éxito.` });
        setPagina(1);
      }
      closeFormModal();
      await loadAlmacenes();
    } catch (error) {
      setFeedback({ variant: "error", title: "Error al guardar", message: error instanceof Error ? error.message : "Error inesperado." });
    } finally {
      setIsSaving(false);
    }
  }

  function openConfirmModal(item: AlmacenItem) {
    setConfirmAlmacen(item);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    setIsConfirmOpen(false);
    setConfirmAlmacen(null);
  }

  async function confirmToggleStatus() {
    if (!confirmAlmacen) return;
    setIsToggling(true);
    try {
      await toggleAlmacenStatus(confirmAlmacen);
      closeConfirmModal();
      await loadAlmacenes();
    } catch (error) {
      setFeedback({ variant: "error", title: "Error", message: error instanceof Error ? error.message : "Error al cambiar estado." });
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
    sucursalFiltro,
    setSucursalFiltro,
    resumen,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    editingAlmacen,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveAlmacen,
    confirmAlmacen,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}