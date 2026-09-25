"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe, getStoredUser, logout } from "@/modules/auth/services/auth.service";
import { listSucursales } from "@/modules/sucursales/services/sucursales.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/components/ui/toast/ToastContext";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
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
import type { SucursalOption, User } from "@/modules/users/types/user.types";

const PAGE_SIZE = 10;

export function useAlmacenes() {
  const { toast } = useToast();

  const [registros, setRegistros] = useState<AlmacenItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] = useState<AlmacenStatusFilter>("activos");

  const [resumen, setResumen] = useState<AlmacenesResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingAlmacenId, setLoadingAlmacenId] = useState<number | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [editingAlmacen, setEditingAlmacen] = useState<AlmacenItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [availableSucursales, setAvailableSucursales] = useState<SucursalOption[]>([]);

  const [confirmAlmacen, setConfirmAlmacen] = useState<AlmacenItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    async function syncSessionUser() {
      const stored = getStoredUser();
      if (stored) {
        const storedAny = stored as any;
        const isSuperStored = Boolean(storedAny.es_super_admin || storedAny.sesion?.es_super_admin);
        const permisosStored: string[] = storedAny.permisos ?? storedAny.sesion?.permisos ?? [];

        setCurrentUser({
          id: stored.id,
          username: stored.username,
          email: stored.email,
          nombres: stored.nombres,
          apellidos: stored.apellidos,
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
        }
      } catch {
        // Fallback silencioso
      }
    }

    void syncSessionUser();
  }, []);

  const loadFormCatalogs = useCallback(async () => {
    try {
      const res = await listSucursales({ pagina: 1, limite: 100, estado: "activos" });
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.registros)
          ? (res as any).registros
          : Array.isArray((res as any)?.data)
            ? (res as any).data
            : [];

      const sucursalesMapeadas = rawList.map((suc: any) => ({
        id: suc.id,
        nombre: suc.nombre,
      }));
      setAvailableSucursales(sucursalesMapeadas);
    } catch {
      setAvailableSucursales([]);
    }
  }, []);

  const loadAlmacenes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listAlmacenes({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
      });

      setRegistros(response.registros ?? []);
      setTotal(response.total ?? 0);

      if (response.resumen) {
        setResumen(response.resumen);
      }
    } catch (error) {
      toast("error", "Error de carga", error instanceof Error ? error.message : "Error al obtener almacenes.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, toast]);

  useEffect(() => {
    void loadAlmacenes();
  }, [loadAlmacenes]);

  useEffect(() => {
    setPagina(1);
  }, [debouncedSearch]);

  function handleFilterStatus(status: AlmacenStatusFilter) {
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

    const isValid = await verifyActionAccess(PermisoBanderas.ALMACENES_CREAR);
    if (!isValid) return;

    setEditingAlmacen(null);
    await loadFormCatalogs();
    setIsFormOpen(true);
  }

  async function openEditModal(item: AlmacenItem) {
    if (isFormOpen || loadingAlmacenId !== null) return;
    setLoadingAlmacenId(item.id);

    const isValid = await verifyActionAccess(PermisoBanderas.ALMACENES_EDITAR);
    if (!isValid) {
      setLoadingAlmacenId(null);
      return;
    }

    setEditingAlmacen(item);
    await loadFormCatalogs();
    setIsFormOpen(true);
    setLoadingAlmacenId(null);
  }

  function closeFormModal() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingAlmacen(null);
  }

  async function saveAlmacen(values: AlmacenFormValues) {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const permissionNeeded = editingAlmacen ? PermisoBanderas.ALMACENES_EDITAR : PermisoBanderas.ALMACENES_CREAR;
      const isValid = await verifyActionAccess(permissionNeeded);
      if (!isValid) return;

      if (editingAlmacen) {
        await updateAlmacen(editingAlmacen.id, values);
        toast("success", "Almacén actualizado", `'${values.nombre}' fue actualizado correctamente.`);
      } else {
        await createAlmacen(values);
        toast("success", "Almacén registrado", `'${values.nombre}' fue creado exitosamente.`);
      }

      closeFormModal();
      await loadAlmacenes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo procesar la solicitud.";
      toast("error", "Atención", message);
    } finally {
      setIsSaving(false);
    }
  }

  async function openConfirmModal(item: AlmacenItem) {
    if (isConfirmOpen || loadingAlmacenId !== null) return;
    setLoadingAlmacenId(item.id);

    const isActivo = item.estado === 1;
    const requiredPermission = isActivo ? PermisoBanderas.ALMACENES_ELIMINAR : PermisoBanderas.ALMACENES_ACTIVAR;

    const isValid = await verifyActionAccess(requiredPermission);
    if (isValid) {
      setConfirmAlmacen(item);
      setIsConfirmOpen(true);
    }
    setLoadingAlmacenId(null);
  }

  function closeConfirmModal() {
    if (isToggling) return;
    setIsConfirmOpen(false);
    setConfirmAlmacen(null);
  }

  async function confirmToggleStatus() {
    if (!confirmAlmacen || isToggling) return;
    setIsToggling(true);

    try {
      const isActivo = confirmAlmacen.estado === 1;
      const requiredPermission = isActivo ? PermisoBanderas.ALMACENES_ELIMINAR : PermisoBanderas.ALMACENES_ACTIVAR;

      const isValid = await verifyActionAccess(requiredPermission);
      if (!isValid) return;

      await toggleAlmacenStatus(confirmAlmacen);
      const accion = isActivo ? "desactivado" : "activado";
      toast("info", "Estado actualizado", `El almacén '${confirmAlmacen.nombre}' ha sido ${accion}.`);
      closeConfirmModal();
      await loadAlmacenes();
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
    resumen,
    isLoading,
    isSaving,
    loadingAlmacenId,

    currentUser,

    editingAlmacen,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveAlmacen,

    availableSucursales,

    confirmAlmacen,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}