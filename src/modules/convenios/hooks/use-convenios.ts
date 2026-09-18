"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  createConvenio,
  listCondicionesPago,
  listConvenios,
  toggleConvenioStatus,
  updateConvenio,
} from "../services/convenios.service";
import type {
  CondicionPagoItem,
  ConvenioFormValues,
  ConvenioItem,
  ConveniosResumen,
  ConvenioStatusFilter,
} from "../types/convenios.types";

const PAGE_SIZE = 10;

/**
 * Concentra todo el estado de la pantalla de convenios: listado, filtros,
 * modal de formulario y confirmación de baja.
 *
 * Sigo el mismo molde que `use-almacenes` para que quien ya conoce una pantalla
 * del sistema entienda esta sin leerla entera.
 */
export function useConvenios() {
  const [registros, setRegistros] = useState<ConvenioItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  // Espero 400 ms desde la última tecla para no disparar una consulta por letra.
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] =
    useState<ConvenioStatusFilter>("activos");
  const [resumen, setResumen] = useState<ConveniosResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  // Catálogo del selector del formulario. Lo cargo una sola vez al montar.
  const [condicionesPago, setCondicionesPago] = useState<CondicionPagoItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [editingConvenio, setEditingConvenio] = useState<ConvenioItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmConvenio, setConfirmConvenio] = useState<ConvenioItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const loadConvenios = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listConvenios({
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
            : "No se pudieron obtener los convenios.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro]);

  useEffect(() => {
    void loadConvenios();
  }, [loadConvenios]);

  useEffect(() => {
    // Si esto falla no rompo la pantalla: el selector queda vacío y el
    // formulario avisa que no hay condiciones de pago disponibles.
    listCondicionesPago().then(setCondicionesPago).catch(() => setCondicionesPago([]));
  }, []);

  function handleFilterStatus(status: ConvenioStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function openCreateModal() {
    setEditingConvenio(null);
    setIsFormOpen(true);
  }

  function openEditModal(item: ConvenioItem) {
    setEditingConvenio(item);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingConvenio(null);
  }

  async function saveConvenio(values: ConvenioFormValues) {
    setIsSaving(true);
    try {
      if (editingConvenio) {
        await updateConvenio(editingConvenio.id, values);
        setFeedback({
          variant: "success",
          title: "Actualizado",
          message: `Convenio '${values.nombre}' actualizado con éxito.`,
        });
      } else {
        await createConvenio(values);
        setFeedback({
          variant: "success",
          title: "Registrado",
          message: `Convenio '${values.nombre}' creado con éxito.`,
        });
        // Vuelvo a la primera página: el listado va por nombre y el registro
        // nuevo puede caer en cualquier lado, pero al menos así lo busca desde
        // el inicio y no se queda mirando una página que no cambió.
        setPagina(1);
      }
      closeFormModal();
      await loadConvenios();
    } catch (error) {
      // No cierro el modal: dejo los datos escritos para que el usuario
      // corrija lo que la API rechazó sin volver a llenar todo.
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

  function openConfirmModal(item: ConvenioItem) {
    setConfirmConvenio(item);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    setIsConfirmOpen(false);
    setConfirmConvenio(null);
  }

  async function confirmToggleStatus() {
    if (!confirmConvenio) return;
    setIsToggling(true);
    try {
      await toggleConvenioStatus(confirmConvenio);
      closeConfirmModal();
      await loadConvenios();
    } catch (error) {
      // Acá cae, por ejemplo, "tiene 3 cliente(s) asignado(s)". Cierro el
      // diálogo y muestro el motivo arriba, donde se lee sin estorbar.
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
    condicionesPago,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    editingConvenio,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveConvenio,
    confirmConvenio,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}
