"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe, getStoredUser, logout } from "@/modules/auth/services/auth.service";
import { listSucursales } from "@/modules/sucursales/services/sucursales.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/components/ui/toast/ToastContext";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
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
import type { SucursalOption, User } from "@/modules/users/types/user.types";

const PAGE_SIZE = 10;

export function useEstaciones() {
  const { toast } = useToast();

  const [registros, setRegistros] = useState<EstacionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] = useState<EstacionStatusFilter>("activos");
  const [sucursalFiltro, setSucursalFiltro] = useState<number | undefined>(undefined);

  const [resumen, setResumen] = useState<EstacionesResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingEstacionId, setLoadingEstacionId] = useState<number | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [editingEstacion, setEditingEstacion] = useState<EstacionItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [availableSucursales, setAvailableSucursales] = useState<SucursalOption[]>([]);

  const [confirmEstacion, setConfirmEstacion] = useState<EstacionItem | null>(null);
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

  const loadEstaciones = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listEstaciones({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
        id_sucursal: sucursalFiltro,
      });

      setRegistros(response.registros ?? []);
      setTotal(response.total ?? 0);

      if (response.resumen) {
        setResumen(response.resumen);
      }
    } catch (error) {
      toast("error", "Error de carga", error instanceof Error ? error.message : "Error al obtener estaciones.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, sucursalFiltro, toast]);

  useEffect(() => {
    void loadEstaciones();
  }, [loadEstaciones]);

  useEffect(() => {
    setPagina(1);
  }, [debouncedSearch]);

  function handleFilterStatus(status: EstacionStatusFilter) {
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

    const isValid = await verifyActionAccess(PermisoBanderas.ESTACIONES_CREAR);
    if (!isValid) return;

    setEditingEstacion(null);
    await loadFormCatalogs();
    setIsFormOpen(true);
  }

  async function openEditModal(item: EstacionItem) {
    if (isFormOpen || loadingEstacionId !== null) return;
    setLoadingEstacionId(item.id);

    const isValid = await verifyActionAccess(PermisoBanderas.ESTACIONES_EDITAR);
    if (!isValid) {
      setLoadingEstacionId(null);
      return;
    }

    setEditingEstacion(item);
    await loadFormCatalogs();
    setIsFormOpen(true);
    setLoadingEstacionId(null);
  }

  function closeFormModal() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingEstacion(null);
  }

  async function saveEstacion(values: EstacionFormValues) {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const permissionNeeded = editingEstacion ? PermisoBanderas.ESTACIONES_EDITAR : PermisoBanderas.ESTACIONES_CREAR;
      const isValid = await verifyActionAccess(permissionNeeded);
      if (!isValid) return;

      if (editingEstacion) {
        await updateEstacion(editingEstacion.id, values);
        toast("success", "Estación actualizada", `'${values.nombre}' fue actualizada correctamente.`);
      } else {
        await createEstacion(values);
        toast("success", "Estación registrada", `'${values.nombre}' fue creada exitosamente.`);
      }

      closeFormModal();
      await loadEstaciones();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo procesar la solicitud.";
      toast("error", "Atención", message);
    } finally {
      setIsSaving(false);
    }
  }

  async function openConfirmModal(item: EstacionItem) {
    if (isConfirmOpen || loadingEstacionId !== null) return;
    setLoadingEstacionId(item.id);

    const isActivo = item.estado === 1;
    const requiredPermission = isActivo ? PermisoBanderas.ESTACIONES_ELIMINAR : PermisoBanderas.ESTACIONES_ACTIVAR;

    const isValid = await verifyActionAccess(requiredPermission);
    if (isValid) {
      setConfirmEstacion(item);
      setIsConfirmOpen(true);
    }
    setLoadingEstacionId(null);
  }

  function closeConfirmModal() {
    if (isToggling) return;
    setIsConfirmOpen(false);
    setConfirmEstacion(null);
  }

  async function confirmToggleStatus() {
    if (!confirmEstacion || isToggling) return;
    setIsToggling(true);

    try {
      const isActivo = confirmEstacion.estado === 1;
      const requiredPermission = isActivo ? PermisoBanderas.ESTACIONES_ELIMINAR : PermisoBanderas.ESTACIONES_ACTIVAR;

      const isValid = await verifyActionAccess(requiredPermission);
      if (!isValid) return;

      await toggleEstacionStatus(confirmEstacion);
      const accion = isActivo ? "desactivada" : "activada";
      toast("info", "Estado actualizado", `La estación '${confirmEstacion.nombre}' ha sido ${accion}.`);
      closeConfirmModal();
      await loadEstaciones();
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
    sucursalFiltro,
    setSucursalFiltro,
    resumen,
    isLoading,
    isSaving,
    loadingEstacionId,

    currentUser,

    editingEstacion,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveEstacion,

    availableSucursales,

    confirmEstacion,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}