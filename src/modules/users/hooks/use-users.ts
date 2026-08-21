"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe, getStoredUser, logout } from "@/modules/auth/services/auth.service";
import { listRoles } from "@/modules/roles/services/roles.service";
import { useDebounce } from "@/hooks/useDebounce";
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
  UsersFeedback,
  UsersResumen,
} from "../types/user.types";
import type { RoleItem } from "@/modules/roles/types/roles.types";

const PAGE_SIZE = 10;

export function useUsers() {
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
  const [feedback, setFeedback] = useState<UsersFeedback>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasLoadedSession, setHasLoadedSession] = useState(false); 

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [availableRoles, setAvailableRoles] = useState<RoleItem[]>([]);
  const [availableSucursales] = useState<SucursalOption[]>([
    { id: 1, nombre: "Sede Principal" },
  ]);

  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    async function syncSessionUser() {
      const stored = getStoredUser();
      if (stored) {
        const storedAny = stored as any;
        const isSuperStored = Boolean(storedAny.es_super_admin || storedAny.sesion?.es_super_admin);

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
            freshData.sesion?.es_super_admin
          );

          const permisosBackend: string[] = freshData.permisos ?? [];

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

  const loadUsers = useCallback(async () => {
    if (!hasLoadedSession) return;

    const isSuper = Boolean(currentUser?.es_super_admin || (currentUser as any)?.sesion?.es_super_admin);
    const hasListPermission = currentUser?.permisos?.includes("usuarios.listar");

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
      setFeedback({
        variant: "error",
        title: "Error de carga",
        message: error instanceof Error ? error.message : "Error al obtener usuarios.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, hasLoadedSession, currentUser]);

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
        setFeedback({
          variant: "error",
          title: "Acceso denegado",
          message: "Tu usuario ha sido inactivado o tu sesión ya no es válida.",
        });
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
        const permisosBackend: string[] = freshData.permisos ?? [];
        if (!permisosBackend.includes(requiredPermission)) {
          setFeedback({
            variant: "error",
            title: "Permiso denegado",
            message: "Ya no cuentas con los permisos necesarios para realizar esta acción.",
          });
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
    const isValid = await verifyActionAccess("usuarios.crear");
    if (!isValid) return;

    setEditingUser(null);
    setIsFormOpen(true);
  }

  async function openEditModal(user: User) {
    const isValid = await verifyActionAccess("usuarios.editar");
    if (!isValid) return;

    setEditingUser(user);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingUser(null);
  }

  async function openConfirmModal(user: User) {
    const isValid = await verifyActionAccess("usuarios.eliminar");
    if (!isValid) return;

    setConfirmUser(user);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    if (isToggling) return;
    setIsConfirmOpen(false);
    setConfirmUser(null);
  }

  async function saveUser(values: UserFormValues) {
    const permissionNeeded = editingUser ? "usuarios.editar" : "usuarios.crear";
    const isValid = await verifyActionAccess(permissionNeeded);
    if (!isValid) return;

    setIsSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
        setFeedback({
          variant: "success",
          title: "Usuario actualizado",
          message: `El usuario @${values.username} ha sido actualizado correctamente.`,
        });
      } else {
        await createUser(values);
        setFeedback({
          variant: "success",
          title: "Usuario registrado",
          message: `El usuario @${values.username} ha sido creado exitosamente.`,
        });
      }

      closeFormModal();
      await loadUsers();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo guardar",
        message: error instanceof Error ? error.message : "Error inesperado al guardar.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmToggleStatus() {
    if (!confirmUser) return;

    const isValid = await verifyActionAccess("usuarios.eliminar");
    if (!isValid) return;

    setIsToggling(true);
    try {
      await toggleUserStatus(confirmUser);

      if (currentUser && Number(confirmUser.id) === Number(currentUser.id)) {
        closeConfirmModal();
        await logout();
        return;
      }

      const accion = confirmUser.estado === 1 ? "desactivado" : "activado";
      setFeedback({
        variant: "info",
        title: "Estado actualizado",
        message: `El usuario @${confirmUser.username} ha sido ${accion}.`,
      });
      closeConfirmModal();
      await loadUsers();
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