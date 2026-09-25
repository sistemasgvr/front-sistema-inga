"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getMe, getStoredUser, logout } from "@/modules/auth/services/auth.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/components/ui/toast/ToastContext";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
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
import type { User } from "@/modules/users/types/user.types";

const PAGE_SIZE = 10;

export function useSubCategorias() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

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
  const [loadingSubCategoriaId, setLoadingSubCategoriaId] = useState<number | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);

  const [editingSubCategoria, setEditingSubCategoria] = useState<SubCategoriaItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmSubCategoria, setConfirmSubCategoria] = useState<SubCategoriaItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const catIdParam = searchParams.get("id_categoria");
    if (catIdParam) {
      const parsedId = Number(catIdParam);
      if (!isNaN(parsedId)) {
        setFiltroCategoria(parsedId);
        setPagina(1);
      }
    }
  }, [searchParams]);

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

  const loadSubCategorias = useCallback(async () => {
    if (!hasLoadedSession) return;

    const isSuper = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
    const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];
    const hasListPermission =
      isSuper ||
      userPermisos.includes(PermisoBanderas.CATEGORIAS_LISTAR) ||
      userPermisos.includes(PermisoBanderas.SUBCATEGORIAS_LISTAR);

    if (currentUser && !hasListPermission) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await listSubCategorias({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
        id_categoria: filtroCategoria,
      });

      setRegistros(result.registros ?? []);
      setTotal(result.total ?? 0);
      if (result.resumen) setResumen(result.resumen);
    } catch (error) {
      toast(
        "error",
        "Error de carga",
        error instanceof Error ? error.message : "No se pudieron obtener las subcategorías."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearch,
    pagina,
    pageSize,
    estadoFiltro,
    filtroCategoria,
    hasLoadedSession,
    currentUser,
    toast,
  ]);

  useEffect(() => {
    void loadSubCategorias();
  }, [loadSubCategorias]);

  useEffect(() => {
    setPagina(1);
  }, [debouncedSearch]);

  function handleFilterStatus(status: SubCategoriaStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setPagina(1);
  }

  async function verifyActionAccess(requiredPermissions: string[]): Promise<boolean> {
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

      if (isSuper) {
        return true;
      }

      if (requiredPermissions && requiredPermissions.length > 0) {
        const permisosBackend: string[] = freshData.permisos ?? freshData.sesion?.permisos ?? [];
        const hasAny = requiredPermissions.some((p) => permisosBackend.includes(p));
        if (!hasAny) {
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

  async function openCreateModal(idCategoriaPreseleccionada?: number) {
    if (isFormOpen) return;

    const isValid = await verifyActionAccess([
      PermisoBanderas.CATEGORIAS_CREAR,
      PermisoBanderas.SUBCATEGORIAS_CREAR,
    ]);
    if (!isValid) return;

    setEditingSubCategoria(null);

    if (idCategoriaPreseleccionada) {
      setFiltroCategoria(idCategoriaPreseleccionada);
    }
    setIsFormOpen(true);
  }

  async function openEditModal(subcat: SubCategoriaItem) {
    if (isFormOpen || loadingSubCategoriaId !== null) return;
    setLoadingSubCategoriaId(subcat.id);

    const isValid = await verifyActionAccess([
      PermisoBanderas.CATEGORIAS_EDITAR,
      PermisoBanderas.SUBCATEGORIAS_EDITAR,
    ]);
    if (!isValid) {
      setLoadingSubCategoriaId(null);
      return;
    }

    setEditingSubCategoria(subcat);
    setIsFormOpen(true);
    setLoadingSubCategoriaId(null);
  }

  function closeFormModal() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingSubCategoria(null);
  }

  async function openConfirmModal(subcat: SubCategoriaItem) {
    if (isConfirmOpen || loadingSubCategoriaId !== null) return;
    setLoadingSubCategoriaId(subcat.id);

    const isActivo = subcat.estado === 1;
    const requiredPermissions = isActivo
      ? [PermisoBanderas.CATEGORIAS_ELIMINAR, PermisoBanderas.SUBCATEGORIAS_ELIMINAR]
      : [PermisoBanderas.CATEGORIAS_ACTIVAR, PermisoBanderas.SUBCATEGORIAS_ACTIVAR];

    const isValid = await verifyActionAccess(requiredPermissions);
    if (isValid) {
      setConfirmSubCategoria(subcat);
      setIsConfirmOpen(true);
    }
    setLoadingSubCategoriaId(null);
  }

  function closeConfirmModal() {
    if (isToggling) return;
    setIsConfirmOpen(false);
    setConfirmSubCategoria(null);
  }

  async function saveSubCategoria(values: SubCategoriaFormValues) {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const permissionsNeeded = editingSubCategoria
        ? [PermisoBanderas.CATEGORIAS_EDITAR, PermisoBanderas.SUBCATEGORIAS_EDITAR]
        : [PermisoBanderas.CATEGORIAS_CREAR, PermisoBanderas.SUBCATEGORIAS_CREAR];

      const isValid = await verifyActionAccess(permissionsNeeded);
      if (!isValid) return;

      if (editingSubCategoria) {
        await updateSubCategoria(editingSubCategoria.id, values);
        toast("success", "Subcategoría actualizada", `'${values.nombre}' se guardó con éxito.`);
      } else {
        await createSubCategoria(values);
        toast("success", "Subcategoría registrada", `'${values.nombre}' se creó con éxito.`);
        setPagina(1);
      }

      closeFormModal();
      await loadSubCategorias();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo procesar la solicitud.";
      toast("error", "Atención", message);
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmToggleStatus() {
    if (!confirmSubCategoria || isToggling) return;
    setIsToggling(true);

    try {
      const isActivo = confirmSubCategoria.estado === 1;
      const requiredPermissions = isActivo
        ? [PermisoBanderas.CATEGORIAS_ELIMINAR, PermisoBanderas.SUBCATEGORIAS_ELIMINAR]
        : [PermisoBanderas.CATEGORIAS_ACTIVAR, PermisoBanderas.SUBCATEGORIAS_ACTIVAR];

      const isValid = await verifyActionAccess(requiredPermissions);
      if (!isValid) return;

      await toggleSubCategoriaStatus(confirmSubCategoria);
      const accion = isActivo ? "desactivada" : "activada";
      toast("info", "Estado actualizado", `La subcategoría '${confirmSubCategoria.nombre}' ha sido ${accion}.`);
      closeConfirmModal();
      await loadSubCategorias();
    } catch (error) {
      toast("error", "Error al cambiar estado", error instanceof Error ? error.message : "Error inesperado.");
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
    filtroCategoria,
    setFiltroCategoria,
    resumen,
    isLoading,
    isSaving,
    loadingSubCategoriaId,
    currentUser,
    hasLoadedSession,
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