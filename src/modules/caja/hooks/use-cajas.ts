"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { listSucursales } from "@/modules/sucursales/services/sucursales.service";
import type { Sucursal } from "@/modules/sucursales/types/sucursal.types";
import {
  createCaja,
  listCajas,
  toggleCajaStatus,
  updateCaja,
} from "../services/caja.service";
import type {
  CajaFormValues,
  CajaItem,
  CajasResumen,
  CajaStatusFilter,
} from "../types/caja.types";

const PAGE_SIZE = 10;

/** Pantalla de administración de cajas físicas. */
export function useCajas() {
  const [registros, setRegistros] = useState<CajaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] = useState<CajaStatusFilter>("activos");
  const [resumen, setResumen] = useState<CajasResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
    abiertas: 0,
  });

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [editingCaja, setEditingCaja] = useState<CajaItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmCaja, setConfirmCaja] = useState<CajaItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const loadCajas = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listCajas({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
      });
      setRegistros(result.registros);
      setTotal(result.total);
      if (result.resumen) setResumen(result.resumen);
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al cargar",
        message:
          error instanceof Error ? error.message : "No se pudieron obtener las cajas.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro]);

  useEffect(() => {
    void loadCajas();
  }, [loadCajas]);

  useEffect(() => {
    listSucursales({ pagina: 1, limite: 100, estado: "activos" })
      .then((r) => setSucursales(r.registros))
      .catch(() => setSucursales([]));
  }, []);

  function handleFilterStatus(status: CajaStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function openCreateModal() {
    setEditingCaja(null);
    setIsFormOpen(true);
  }

  function openEditModal(item: CajaItem) {
    setEditingCaja(item);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingCaja(null);
  }

  async function saveCaja(values: CajaFormValues) {
    setIsSaving(true);
    try {
      if (editingCaja) {
        await updateCaja(editingCaja.id, values);
        setFeedback({
          variant: "success",
          title: "Actualizada",
          message: `Caja '${values.nombre}' actualizada con éxito.`,
        });
      } else {
        await createCaja(values);
        setFeedback({
          variant: "success",
          title: "Registrada",
          message: `Caja '${values.nombre}' creada con éxito.`,
        });
        setPagina(1);
      }
      closeFormModal();
      await loadCajas();
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

  function openConfirmModal(item: CajaItem) {
    setConfirmCaja(item);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    setIsConfirmOpen(false);
    setConfirmCaja(null);
  }

  async function confirmToggleStatus() {
    if (!confirmCaja) return;
    setIsToggling(true);
    try {
      await toggleCajaStatus(confirmCaja);
      closeConfirmModal();
      await loadCajas();
    } catch (error) {
      // El caso típico: "tiene un turno abierto". Lo muestro arriba porque el
      // mensaje del backend ya dice qué hacer.
      closeConfirmModal();
      setFeedback({
        variant: "error",
        title: "No se pudo cambiar el estado",
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
    setPageSize: (size: number) => {
      setPageSize(size);
      setPagina(1);
    },
    totalPages,
    searchInput,
    setSearchInput,
    estadoFiltro,
    handleFilterStatus,
    resumen,
    sucursales,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    editingCaja,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveCaja,
    confirmCaja,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}
