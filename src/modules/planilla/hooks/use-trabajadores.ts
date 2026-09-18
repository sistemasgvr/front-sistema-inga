"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { listSucursales } from "@/modules/sucursales/services/sucursales.service";
import type { Sucursal } from "@/modules/sucursales/types/sucursal.types";
import {
  createTrabajador,
  listTrabajadores,
  toggleTrabajadorStatus,
  updateTrabajador,
} from "../services/planilla.service";
import type {
  TrabajadorFormValues,
  TrabajadorItem,
  TrabajadoresResumen,
  TrabajadorStatusFilter,
} from "../types/planilla.types";

const PAGE_SIZE = 10;

/**
 * Pantalla de personal en planilla.
 *
 * Sigo el mismo molde que `use-personas` y `use-cajas` para que quien ya
 * conoce una pantalla del sistema entienda esta sin leerla entera.
 */
export function useTrabajadores() {
  const [registros, setRegistros] = useState<TrabajadorItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] =
    useState<TrabajadorStatusFilter>("activos");

  const [resumen, setResumen] = useState<TrabajadoresResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
  });

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [editing, setEditing] = useState<TrabajadorItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmItem, setConfirmItem] = useState<TrabajadorItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listTrabajadores({
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
          error instanceof Error
            ? error.message
            : "No se pudo obtener el personal.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    listSucursales({ pagina: 1, limite: 100, estado: "activos" })
      .then((r) => setSucursales(r.registros))
      .catch(() => setSucursales([]));
  }, []);

  function handleFilterStatus(status: TrabajadorStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function openCreateModal() {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEditModal(item: TrabajadorItem) {
    setEditing(item);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditing(null);
  }

  async function save(values: TrabajadorFormValues) {
    setIsSaving(true);
    try {
      const nombre = `${values.nombres} ${values.apellidos}`.trim();
      if (editing) {
        await updateTrabajador(editing.id, values);
        setFeedback({
          variant: "success",
          title: "Actualizado",
          message: `'${nombre}' se actualizó con éxito.`,
        });
      } else {
        await createTrabajador(values);
        setFeedback({
          variant: "success",
          title: "Registrado",
          message: `'${nombre}' se agregó a la planilla.`,
        });
        setPagina(1);
      }
      closeFormModal();
      await load();
    } catch (error) {
      // Relanzo para que el modal muestre el error dentro del formulario y no
      // se cierre: así el usuario corrige sin perder lo que escribió.
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

  function openConfirmModal(item: TrabajadorItem) {
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
      await toggleTrabajadorStatus(confirmItem);
      closeConfirmModal();
      await load();
    } catch (error) {
      closeConfirmModal();
      setFeedback({
        variant: "error",
        title: "No se pudo cambiar el estado",
        message:
          error instanceof Error ? error.message : "Error al cambiar estado.",
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
    editing,
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
    recargar: load,
  };
}
