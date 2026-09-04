"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe, getStoredUser, logout } from "@/modules/auth/services/auth.service";
import { listRoles } from "@/modules/roles/services/roles.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/components/ui/toast/ToastContext";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import {
  createUser,
  listUsers,
  toggleUserStatus,
  updateUser,
} from "../services/users.service";
import type {
  SucursalOption,
  User,
  UserFormValues,
  UserStatusFilter,
  UsersResumen,
} from "../types/user.types";
import type { RoleItem } from "@/modules/roles/types/roles.types";
import { listSucursales } from "@/modules/sucursales/services/sucursales.service";

const PAGE_SIZE = 10;

export function useUsers() {
  const { toast } = useToast();

  const [registros, setRegistros] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] = useState<UserStatusFilter>("activos");

  const [resumen, setResumen] = useState<UsersResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null); 

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasLoadedSession, setHasLoadedSession] = useState(false); 

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [availableRoles, setAvailableRoles] = useState<RoleItem[]>([]);
  const [availableSucursales, setAvailableSucursales] = useState<SucursalOption[]>([]);

  const [confirmUser, setConfirmUser] = useState<User | null>(null);
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
        } else {
          await logout();
        }
      } catch {
      } finally {
        setHasLoadedSession(true); 
      }
    }

    void syncSessionUser();
  }, []);

  const loadRolesCatalog = useCallback(async () => {
    try {
      const res = await listRoles({ pagina: 1, limite: 100, estado: "activos" });
      setAvailableRoles(res.registros ?? []);
    } catch (error) {
      console.error("Error al cargar lista de roles:", error);
    }
  }, []);

  useEffect(() => {
    void loadRolesCatalog();
  }, [loadRolesCatalog]);

  const loadSucursalesCatalog = useCallback(async () => {
    try {
      const res = await listSucursales({ pagina: 1, limite: 100, estado: "activos" });
      const sucursalesMapeadas = (res.registros ?? []).map((suc) => ({
        id: suc.id,
        nombre: suc.nombre,
      }));
      setAvailableSucursales(sucursalesMapeadas);
    } catch (error) {
      console.error("Error al cargar lista de sucursales:", error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    if (!hasLoadedSession) return; 

    const isSuper = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
    const hasListPermission = currentUser?.permisos?.includes(PermisoBanderas.USUARIOS_LISTAR);

    if (currentUser && !isSuper && !hasListPermission) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await listUsers({
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
      toast("error", "Error de carga", error instanceof Error ? error.message : "Error al obtener usuarios.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, hasLoadedSession, currentUser, toast]); 

  useEffect(() => {
    void loadSucursalesCatalog();
  }, [loadSucursalesCatalog]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPagina(1);
  }, [debouncedSearch]);

  function handleFilterStatus(status: UserStatusFilter) {
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

      if (isSuper) {
        return true;
      }

      if (requiredPermission) {
        const permisosBackend: string[] = freshData.permisos ?? freshData.sesion?.permisos ?? [];
        if (!permisosBackend.includes(requiredPermission)) {
          toast("error", "Permiso denegado", "Ya no cuentas con los permisos necesarios para realizar esta acción.");
          return false;
        }
      }

      return true;
    } catch {
      await logout();
      return false;
    }
  }

  async function openCreateModal() {
    if (isFormOpen) return;
    setEditingUser(null);
    setIsFormOpen(true); 

    const isValid = await verifyActionAccess(PermisoBanderas.USUARIOS_CREAR);
    if (!isValid) {
      setIsFormOpen(false);
    }
  }

  async function openEditModal(user: User) {
    if (isFormOpen || loadingUserId !== null) return;
    setLoadingUserId(user.id);
    
    setEditingUser(user);
    setIsFormOpen(true);

    const isValid = await verifyActionAccess(PermisoBanderas.USUARIOS_EDITAR);
    if (!isValid) {
      setIsFormOpen(false);
      setEditingUser(null);
    }
    setLoadingUserId(null);
  }

  function closeFormModal() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingUser(null);
  }

  async function openConfirmModal(user: User) {
    if (isConfirmOpen || loadingUserId !== null) return;
    setLoadingUserId(user.id);

    const isActivo = user.estado === 1;
    const requiredPermission = isActivo ? PermisoBanderas.USUARIOS_ELIMINAR : PermisoBanderas.USUARIOS_ACTIVAR;

    const isValid = await verifyActionAccess(requiredPermission);
    if (isValid) {
      setConfirmUser(user);
      setIsConfirmOpen(true);
    }
    setLoadingUserId(null);
  }

  function closeConfirmModal() {
    if (isToggling) return;
    setIsConfirmOpen(false);
    setConfirmUser(null);
  }

  async function saveUser(values: UserFormValues) {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const permissionNeeded = editingUser ? PermisoBanderas.USUARIOS_EDITAR : PermisoBanderas.USUARIOS_CREAR;
      const isValid = await verifyActionAccess(permissionNeeded);
      if (!isValid) return;

      if (editingUser) {
        await updateUser(editingUser.id, values);
        toast("success", "Usuario actualizado", `@${values.username} fue actualizado correctamente.`);
      } else {
        await createUser(values);
        toast("success", "Usuario registrado", `@${values.username} fue creado exitosamente.`);
      }

      closeFormModal();
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo procesar la solicitud.";
      toast("error", "Atención", message);
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmToggleStatus() {
    if (!confirmUser || isToggling) return;
    setIsToggling(true);

    try {
      const isActivo = confirmUser.estado === 1;
      const requiredPermission = isActivo ? PermisoBanderas.USUARIOS_ELIMINAR : PermisoBanderas.USUARIOS_ACTIVAR;

      const isValid = await verifyActionAccess(requiredPermission);
      if (!isValid) return;

      await toggleUserStatus(confirmUser);

      if (currentUser && Number(confirmUser.id) === Number(currentUser.id)) {
        closeConfirmModal();
        await logout();
        return;
      }

      const accion = isActivo ? "desactivado" : "activado";
      toast("info", "Estado actualizado", `El usuario @${confirmUser.username} ha sido ${accion}.`);
      closeConfirmModal();
      await loadUsers();
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
    loadingUserId,

    currentUser,

    editingUser,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveUser,

    availableRoles,
    availableSucursales,

    confirmUser,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}