"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMe,
  getStoredUser,
  logout,
} from "@/modules/auth/services/auth.service";
import { useDebounce } from "@/hooks/useDebounce";
import {
  createSucursal,
  listSucursales,
  toggleSucursalStatus,
  updateSucursal,
} from "../services/sucursales.service";
import type {
  Sucursal,
  SucursalFormValues,
  SucursalStatusFilter,
  SucursalesFeedback,
  SucursalesResumen,
} from "../types/sucursal.types";
import type { User } from "@/modules/users/types/user.types";

const PAGE_SIZE = 10;

export function useSucursales() {
  const [registros, setRegistros] = useState<Sucursal[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] =
    useState<SucursalStatusFilter>("activos");

  const [resumen, setResumen] = useState<SucursalesResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<SucursalesFeedback>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);

  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmSucursal, setConfirmSucursal] = useState<Sucursal | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    async function syncSessionUser() {
      const stored = getStoredUser();
      if (stored) {
        const storedAny = stored as any;
        const isSuperStored = Boolean(
          storedAny.es_super_admin || storedAny.sesion?.es_super_admin,
        );

        setCurrentUser({
          id: stored.id,
          username: stored.username,
          email: stored.email,
          nombres: stored.nombres,
          apellidos: stored.apellidos,
          telefono: stored.telefono ?? null,
          id_sucursal_default: stored.id_sucursal_default ?? null,
          es_super_admin: isSuperStored,
          permisos: stored.permisos ?? [],
          estado: storedAny.estado ?? storedAny.sesion?.estado ?? 1,
        });
      }

      try {
        const fresh = await getMe();
        if (fresh) {
          const freshData = fresh as any;
          const userEstado = freshData.estado ?? freshData.sesion?.estado ?? 1;

          if (userEstado === 0) {
            await logout();
            return;
          }

          const isSuper = Boolean(
            freshData.es_super_admin ||
            freshData.esSuperAdmin ||
            freshData.sesion?.es_super_admin,
          );

          setCurrentUser({
            id: freshData.id ?? freshData.sesion?.id_usuario ?? 1,
            username:
              freshData.username ?? freshData.sesion?.nombre_usuario ?? "",
            email: freshData.email ?? freshData.sesion?.correo ?? "",
            nombres: freshData.nombres ?? freshData.sesion?.nombres ?? "",
            apellidos: freshData.apellidos ?? freshData.sesion?.apellidos ?? "",
            telefono: freshData.telefono ?? null,
            id_sucursal_default: freshData.id_sucursal_default ?? null,
            es_super_admin: isSuper,
            permisos: freshData.permisos ?? [],
            estado: userEstado,
          });
        }
      } catch {
      } finally {
        setHasLoadedSession(true);
      }
    }

    void syncSessionUser();
  }, []);

  const loadSucursales = useCallback(async () => {
    if (!hasLoadedSession) return;

    const isSuper = Boolean(currentUser?.es_super_admin);
    const hasListPermission =
      currentUser?.permisos?.includes("SUCURSALES_LISTAR");

    if (currentUser && !isSuper && !hasListPermission) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await listSucursales({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
      });

      setRegistros(response.registros);
      setTotal(response.total);

      if (response.resumen) {
        setResumen(response.resumen);
      }
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error de carga",
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener sucursales.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearch,
    pagina,
    pageSize,
    estadoFiltro,
    hasLoadedSession,
    currentUser,
  ]);

  useEffect(() => {
    void loadSucursales();
  }, [loadSucursales]);

  useEffect(() => {
    setPagina(1);
  }, [debouncedSearch]);

  function handleFilterStatus(status: SucursalStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setPagina(1);
  }

  async function openCreateModal() {
    setEditingSucursal(null);
    setIsFormOpen(true);
  }

  async function openEditModal(sucursal: Sucursal) {
    setEditingSucursal(sucursal);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingSucursal(null);
  }

  async function openConfirmModal(sucursal: Sucursal) {
    setConfirmSucursal(sucursal);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    if (isToggling) return;
    setIsConfirmOpen(false);
    setConfirmSucursal(null);
  }

  async function saveSucursal(values: SucursalFormValues) {
    setIsSaving(true);
    try {
      if (editingSucursal) {
        await updateSucursal(editingSucursal.id, values);
        setFeedback({
          variant: "success",
          title: "Sucursal actualizada",
          message: `La sucursal ${values.nombre} ha sido actualizada.`,
        });
      } else {
        await createSucursal(values);
        setFeedback({
          variant: "success",
          title: "Sucursal registrada",
          message: `La sucursal ${values.nombre} ha sido creada exitosamente.`,
        });
      }

      closeFormModal();
      await loadSucursales();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo guardar",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmToggleStatus() {
    if (!confirmSucursal) return;

    setIsToggling(true);
    try {
      await toggleSucursalStatus(confirmSucursal);
      const accion = confirmSucursal.estado === 1 ? "desactivada" : "activada";

      setFeedback({
        variant: "info",
        title: "Estado actualizado",
        message: `La sucursal ${confirmSucursal.nombre} ha sido ${accion}.`,
      });

      closeConfirmModal();
      await loadSucursales();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al cambiar estado",
        message: error instanceof Error ? error.message : "Error inesperado.",
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
    setPageSize: handlePageSizeChange,
    totalPages,
    searchInput,
    setSearchInput,
    estadoFiltro,
    handleFilterStatus,
    resumen,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),

    currentUser,

    editingSucursal,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveSucursal,

    confirmSucursal,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}
