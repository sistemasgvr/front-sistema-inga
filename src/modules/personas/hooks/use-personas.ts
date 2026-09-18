"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { listConvenios } from "@/modules/convenios/services/convenios.service";
import type { ConvenioItem } from "@/modules/convenios/types/convenios.types";
import {
  createPersona,
  listPersonas,
  togglePersonaStatus,
  updatePersona,
} from "../services/personas.service";
import type {
  PersonaFormValues,
  PersonaItem,
  PersonaRolFilter,
  PersonasResumen,
  PersonaStatusFilter,
} from "../types/personas.types";

const PAGE_SIZE = 10;

export function usePersonas() {
  const [registros, setRegistros] = useState<PersonaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] = useState<PersonaStatusFilter>("activos");
  const [rolFiltro, setRolFiltro] = useState<PersonaRolFilter>("todos");

  const [resumen, setResumen] = useState<PersonasResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
    clientes: 0,
    proveedores: 0,
  });

  /**
   * Convenios activos para el selector del formulario.
   * Pido 100 de una vez porque son pocos (hoy son 4) y así el formulario no
   * tiene que paginar un desplegable.
   */
  const [convenios, setConvenios] = useState<ConvenioItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [editingPersona, setEditingPersona] = useState<PersonaItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmPersona, setConfirmPersona] = useState<PersonaItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const loadPersonas = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listPersonas({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
        rol: rolFiltro,
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
            : "No se pudieron obtener las personas.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, rolFiltro]);

  useEffect(() => {
    void loadPersonas();
  }, [loadPersonas]);

  useEffect(() => {
    listConvenios({ pagina: 1, limite: 100, estado: "activos" })
      .then((r) => setConvenios(r.registros))
      .catch(() => setConvenios([]));
  }, []);

  function handleFilterStatus(status: PersonaStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function handleFilterRol(rol: PersonaRolFilter) {
    setRolFiltro(rol);
    setPagina(1);
  }

  function openCreateModal() {
    setEditingPersona(null);
    setIsFormOpen(true);
  }

  function openEditModal(item: PersonaItem) {
    setEditingPersona(item);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingPersona(null);
  }

  async function savePersona(values: PersonaFormValues) {
    setIsSaving(true);
    try {
      const nombreMostrado =
        values.tipo_persona === 2
          ? values.razon_social
          : `${values.nombres} ${values.apellido_paterno}`.trim();

      if (editingPersona) {
        await updatePersona(editingPersona.id, values);
        setFeedback({
          variant: "success",
          title: "Actualizado",
          message: `'${nombreMostrado}' se actualizó con éxito.`,
        });
      } else {
        await createPersona(values);
        setFeedback({
          variant: "success",
          title: "Registrado",
          message: `'${nombreMostrado}' se registró con éxito.`,
        });
        setPagina(1);
      }
      closeFormModal();
      await loadPersonas();
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

  function openConfirmModal(item: PersonaItem) {
    setConfirmPersona(item);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    setIsConfirmOpen(false);
    setConfirmPersona(null);
  }

  async function confirmToggleStatus() {
    if (!confirmPersona) return;
    setIsToggling(true);
    try {
      await togglePersonaStatus(confirmPersona);
      closeConfirmModal();
      await loadPersonas();
    } catch (error) {
      // Los dos motivos típicos de rechazo son "tiene saldo pendiente" y
      // "su convenio está inactivo". Los muestro arriba, con el texto que
      // manda el backend, que ya explica qué hacer.
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
    rolFiltro,
    handleFilterRol,
    resumen,
    convenios,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    editingPersona,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    savePersona,
    confirmPersona,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}
