"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe, getStoredUser, logout } from "@/modules/auth/services/auth.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/components/ui/toast/ToastContext";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
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
import type { User } from "@/modules/users/types/user.types";

const PAGE_SIZE = 10;

export function useCategorias() {
  const { toast } = useToast();

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
  const [loadingCategoriaId, setLoadingCategoriaId] = useState<number | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);

  const [editingCategoria, setEditingCategoria] = useState<CategoriaItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmCategoria, setConfirmCategoria] = useState<CategoriaItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncSessionUser() {
      const stored = getStoredUser();
      if (stored && isMounted) {
        const storedAny = stored as any;
        const isSuperStored = Boolean(storedAny.es_super_admin || storedAny.sesion?.es_super_admin);
        const permisosStored: string[] = storedAny.permisos ?? storedAny.sesion?.permisos ?? [];

        setCurrentUser({
          id: stored.id,
          username: stored.username,
          email: stored.email,
          nombres: stored.nombres ?? "",
          apellidos: stored.apellidos ?? "",
          telefono: stored.telefono ?? null,
          id_sucursal_default: stored.id_sucursal_default ?? null,
          es_super_admin: isSuperStored,
          permisos: permisosStored,
          estado: storedAny.estado ?? storedAny.sesion?.estado ?? 1,
          fecha_creacion: storedAny.fecha_creacion ?? "",
        });
      }

      try {
        const fresh = await getMe();
        if (fresh && isMounted) {
          const freshData = fresh as any;
          const userEstado = freshData.estado ?? freshData.sesion?.estado ?? 1;

          if (userEstado === 0) {
            await logout();
            return;
          }

          const isSuper = Boolean(
            freshData.es_super_admin || 
            freshData.esSuperAdmin || 
            freshData.sesion?.es_super_admin
          );

          const permisosBackend: string[] = freshData.permisos ?? freshData.sesion?.permisos ?? [];

          setCurrentUser({
            id: freshData.id ?? freshData.sesion?.id_usuario ?? 1,
            username: freshData.username ?? freshData.sesion?.nombre_usuario ?? "",
            email: freshData.email ?? freshData.sesion?.correo ?? "",
            nombres: freshData.nombres ?? freshData.sesion?.nombres ?? "",
            apellidos: freshData.apellidos ?? freshData.sesion?.apellidos ?? "",
            telefono: freshData.telefono ?? null,
            id_sucursal_default: freshData.id_sucursal_default ?? null,
            es_super_admin: isSuper,
            permisos: permisosBackend,
            estado: userEstado,
            fecha_creacion: freshData.fecha_creacion ?? "",
          });
        } else if (!fresh && isMounted) {
          await logout();
        }
      } catch {
        // Fallback silencioso
      } finally {
        if (isMounted) {
          setHasLoadedSession(true);
        }
      }
    }

    void syncSessionUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadCategorias = useCallback(async () => {
    if (!hasLoadedSession) return;

    const isSuper = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
    const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];
    const hasListPermission = isSuper || userPermisos.includes(PermisoBanderas.CATEGORIAS_LISTAR);

    if (currentUser && !hasListPermission) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await listCategorias({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
        es_carta: filtroEsCarta,
      });
      setRegistros(result.registros ?? []);
      setTotal(result.total ?? 0);
      if (result.resumen) setResumen(result.resumen);
    } catch (error) {
      toast("error", "Error de carga", error instanceof Error ? error.message : "No se pudieron obtener las categorías.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, filtroEsCarta, hasLoadedSession, currentUser, toast]);

  useEffect(() => {
    void loadCategorias();
  }, [loadCategorias]);

  useEffect(() => {
    setPagina(1);
  }, [debouncedSearch]);

  function handleFilterStatus(status: CategoriaStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setPagina(1);
  }

  async function verifyActionAccess(requiredPermission?: string): Promise<boolean> {
    try {
      const fresh = await getMe();
      const freshData = fresh as any;
      const userEstado = freshData?.estado ?? freshData?.sesion?.estado ?? 1;

      if (!fresh || userEstado === 0) {
        toast("error", "Acceso denegado", "Tu usuario ha sido inactivado o tu sesión ya no es válida.");
        await logout();
        return false;
      }

      const isSuper = Boolean(
        freshData.es_super_admin || 
        freshData.esSuperAdmin || 
        freshData.sesion?.es_super_admin
      );

      if (isSuper) return true;

      if (requiredPermission) {
        const permisosBackend: string[] = freshData.permisos ?? freshData.sesion?.permisos ?? [];
        if (!permisosBackend.includes(requiredPermission)) {
          toast("error", "Permiso denegado", "No cuentas con el permiso necesario para realizar esta acción.");
          return false;
        }
      }

      return true;
    } catch {
      toast("error", "Atención", "No se pudo verificar el permiso en el servidor.");
      return false;
    }
  }

  async function openCreateModal() {
    if (isFormOpen) return;
    const isValid = await verifyActionAccess(PermisoBanderas.CATEGORIAS_CREAR);
    if (!isValid) return;

    setEditingCategoria(null);
    setIsFormOpen(true);
  }

  async function openEditModal(cat: CategoriaItem) {
    if (isFormOpen || loadingCategoriaId !== null) return;
    setLoadingCategoriaId(cat.id);

    const isValid = await verifyActionAccess(PermisoBanderas.CATEGORIAS_EDITAR);
    if (!isValid) {
      setLoadingCategoriaId(null);
      return;
    }

    setEditingCategoria(cat);
    setIsFormOpen(true);
    setLoadingCategoriaId(null);
  }

  function closeFormModal() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingCategoria(null);
  }

  async function saveCategoria(values: CategoriaFormValues) {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const permissionNeeded = editingCategoria ? PermisoBanderas.CATEGORIAS_EDITAR : PermisoBanderas.CATEGORIAS_CREAR;
      const isValid = await verifyActionAccess(permissionNeeded);
      if (!isValid) return;

      if (editingCategoria) {
        await updateCategoria(editingCategoria.id, values);
        toast("success", "Categoría actualizada", `'${values.nombre}' se guardó con éxito.`);
      } else {
        await createCategoria(values);
        toast("success", "Categoría registrada", `'${values.nombre}' se creó con éxito.`);
        setPagina(1);
      }
      closeFormModal();
      await loadCategorias();
    } catch (error) {
      toast("error", "Atención", error instanceof Error ? error.message : "No se pudo procesar la solicitud.");
    } finally {
      setIsSaving(false);
    }
  }

  async function openConfirmModal(cat: CategoriaItem) {
    if (isConfirmOpen || loadingCategoriaId !== null) return;
    setLoadingCategoriaId(cat.id);

    const isActivo = cat.estado === 1;
    const requiredPermission = isActivo ? PermisoBanderas.CATEGORIAS_ELIMINAR : PermisoBanderas.CATEGORIAS_ACTIVAR;

    const isValid = await verifyActionAccess(requiredPermission);
    if (isValid) {
      setConfirmCategoria(cat);
      setIsConfirmOpen(true);
    }
    setLoadingCategoriaId(null);
  }

  function closeConfirmModal() {
    if (isToggling) return;
    setIsConfirmOpen(false);
    setConfirmCategoria(null);
  }

  async function confirmToggleStatus() {
    if (!confirmCategoria || isToggling) return;
    setIsToggling(true);
    try {
      const isActivo = confirmCategoria.estado === 1;
      const requiredPermission = isActivo 
        ? PermisoBanderas.CATEGORIAS_ELIMINAR 
        : PermisoBanderas.CATEGORIAS_ACTIVAR;

      const isValid = await verifyActionAccess(requiredPermission);
      if (!isValid) return;

      await toggleCategoriaStatus(confirmCategoria);
      const accion = isActivo ? "desactivada" : "activada";
      toast("info", "Estado actualizado", `La categoría '${confirmCategoria.nombre}' ha sido ${accion}.`);
      closeConfirmModal();
      await loadCategorias();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al cambiar estado.";
      toast("error", "Atención", message);
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
    filtroEsCarta,
    setFiltroEsCarta,
    resumen,
    isLoading,
    isSaving,
    loadingCategoriaId,
    currentUser,
    hasLoadedSession,
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