"use client"

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  listEstaciones,
  createEstacion,
  updateEstacion,
  toggleEstacionStatus,
} from "../services/estaciones.service";
import type {
  EstacionItem,
  EstacionFormValues,
  EstacionStatusFilter,
  EstacionesResumen,
} from "../types/estaciones.types";

const PAGE_SIZE = 10;

export function useEstaciones() {
  const [registros, setRegistros] = useState<EstacionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] = useState<EstacionStatusFilter>("activos");
  const [sucursalFiltro, setSucursalFiltro] = useState<number | undefined>(undefined);

  const [resumen, setResumen] = useState<EstacionesResumen>({ total: 0, activos: 0, inactivos: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error" | "info"; title: string; message: string } | null>(null);

  const [editingEstacion, setEditingEstacion] = useState<EstacionItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmEstacion, setConfirmEstacion] = useState<EstacionItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const loadEstaciones = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listEstaciones({
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
      setFeedback({ variant: "error", title: "Error al cargar", message: "No se pudieron obtener las estaciones." });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, sucursalFiltro]);

  useEffect(() => {
    void loadEstaciones();
  }, [loadEstaciones]);

  function handleFilterStatus(status: EstacionStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function openCreateModal() {
    setEditingEstacion(null);
    setIsFormOpen(true);
  }

  function openEditModal(item: EstacionItem) {
    setEditingEstacion(item);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingEstacion(null);
  }

  async function saveEstacion(values: EstacionFormValues) {
    setIsSaving(true);
    try {
      if (editingEstacion) {
        await updateEstacion(editingEstacion.id, values);
        setFeedback({ variant: "success", title: "Actualizado", message: `Estación '${values.nombre}' actualizada con éxito.` });
      } else {
        await createEstacion(values);
        setFeedback({ variant: "success", title: "Registrado", message: `Estación '${values.nombre}' creada con éxito.` });
        setPagina(1);
      }
      closeFormModal();
      await loadEstaciones();
    } catch (error) {
      setFeedback({ variant: "error", title: "Error al guardar", message: error instanceof Error ? error.message : "Error inesperado." });
    } finally {
      setIsSaving(false);
    }
  }

  function openConfirmModal(item: EstacionItem) {
    setConfirmEstacion(item);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    setIsConfirmOpen(false);
    setConfirmEstacion(null);
  }

  async function confirmToggleStatus() {
    if (!confirmEstacion) return;
    setIsToggling(true);
    try {
      await toggleEstacionStatus(confirmEstacion);
      closeConfirmModal();
      await loadEstaciones();
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
    editingEstacion,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveEstacion,
    confirmEstacion,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}