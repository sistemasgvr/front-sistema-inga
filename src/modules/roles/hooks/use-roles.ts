"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe, getStoredUser, logout } from "@/modules/auth/services/auth.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/components/ui/toast/ToastContext";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import {
  createRole,
  getPermissionsCatalog,
  getRolePermissions,
  listRoles,
  syncRolePermissions,
  toggleRoleStatus,
  updateRole,
} from "../services/roles.service";
import type {
  PermisoItem,
  RoleFormValues,
  RoleItem,
  RoleStatusFilter,
  RolesResumen,
} from "../types/roles.types";
import type { User } from "@/modules/users/types/user.types";

const PAGE_SIZE = 10;

export function useRoles() {
  const { toast } = useToast();

  const [registros, setRegistros] = useState<RoleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] = useState<RoleStatusFilter>("activos");

  const [resumen, setResumen] = useState<RolesResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
    total_permisos_sistema: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingRoleId, setLoadingRoleId] = useState<number | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);

  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [permissionsRole, setPermissionsRole] = useState<RoleItem | null>(null);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [catalogPermissions, setCatalogPermissions] = useState<PermisoItem[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const [confirmRole, setConfirmRole] = useState<RoleItem | null>(null);
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

  const loadRoles = useCallback(async () => {
    if (!hasLoadedSession) return;

    const isSuper = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
    const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];
    const hasListPermission = userPermisos.includes(PermisoBanderas.ROLES_LISTAR);

    if (currentUser && !isSuper && !hasListPermission) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await listRoles({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
      });

      setRegistros(result.registros);
      setTotal(result.total);

      if (result.resumen) {
        setResumen(result.resumen);
      }
    } catch (error) {
      toast("error", "Error de carga", error instanceof Error ? error.message : "No se pudieron obtener los roles.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, hasLoadedSession, currentUser, toast]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    setPagina(1);
  }, [debouncedSearch]);

  function handleFilterStatus(status: RoleStatusFilter) {
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
    setEditingRole(null);
    setIsFormOpen(true);

    const isValid = await verifyActionAccess(PermisoBanderas.ROLES_CREAR);
    if (!isValid) {
      setIsFormOpen(false);
    }
  }

  async function openEditModal(role: RoleItem) {
    if (isFormOpen || loadingRoleId !== null) return;
    setLoadingRoleId(role.id);

    setEditingRole(role);
    setIsFormOpen(true);

    const isValid = await verifyActionAccess(PermisoBanderas.ROLES_EDITAR);
    if (!isValid) {
      setIsFormOpen(false);
      setEditingRole(null);
    }
    setLoadingRoleId(null);
  }

  function closeFormModal() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingRole(null);
  }

  async function saveRole(values: RoleFormValues) {
    if (isSaving) return; 
    setIsSaving(true);

    try {
      const permissionNeeded = editingRole ? PermisoBanderas.ROLES_EDITAR : PermisoBanderas.ROLES_CREAR;
      const isValid = await verifyActionAccess(permissionNeeded);
      if (!isValid) return;

      if (editingRole) {
        await updateRole(editingRole.id, values);
        toast("success", "Rol actualizado", `El rol '${values.nombre}' se guardó correctamente.`);
      } else {
        await createRole(values);
        toast("success", "Rol creado", `El rol '${values.nombre}' fue registrado correctamente.`);
        setPagina(1);
      }
      closeFormModal();
      await loadRoles();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al guardar el rol.";
      toast("error", "Atención", message);
    } finally {
      setIsSaving(false);
    }
  }

  async function openPermissionsModal(role: RoleItem) {
    if (isPermissionsOpen || loadingRoleId !== null) return;
    setLoadingRoleId(role.id);

    setPermissionsRole(role);
    setIsPermissionsOpen(true);
    setIsLoadingPermissions(true);

    try {
      const isValid = await verifyActionAccess(PermisoBanderas.ROLES_EDITAR);
      if (!isValid) {
        setIsPermissionsOpen(false);
        setPermissionsRole(null);
        return;
      }

      const [catalog, assignedIds] = await Promise.all([
        getPermissionsCatalog(),
        getRolePermissions(role.id),
      ]);

      setCatalogPermissions(catalog);
      setSelectedPermissionIds(assignedIds);
    } catch (error) {
      toast("error", "Error de permisos", "No se pudieron obtener los permisos del rol seleccionado.");
      setIsPermissionsOpen(false);
      setPermissionsRole(null);
    } finally {
      setIsLoadingPermissions(false);
      setLoadingRoleId(null);
    }
  }

  function closePermissionsModal() {
    if (isSaving) return;
    setIsPermissionsOpen(false);
    setPermissionsRole(null);
    setCatalogPermissions([]);
    setSelectedPermissionIds([]);
  }

  async function savePermissions(idsPermisos: number[]) {
    if (!permissionsRole || isSaving) return;
    setIsSaving(true);

    try {
      const isValid = await verifyActionAccess(PermisoBanderas.ROLES_EDITAR);
      if (!isValid) return;

      await syncRolePermissions(permissionsRole.id, idsPermisos);
      toast("success", "Permisos actualizados", `Los permisos para '${permissionsRole.nombre}' fueron guardados.`);
      closePermissionsModal();
      await loadRoles();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al guardar permisos.";
      toast("error", "Atención", message);
    } finally {
      setIsSaving(false);
    }
  }

  async function openConfirmModal(role: RoleItem) {
    if (isConfirmOpen || loadingRoleId !== null) return;
    setLoadingRoleId(role.id);

    const isActivo = role.estado === 1;
    const requiredPermission = isActivo ? PermisoBanderas.ROLES_ELIMINAR : PermisoBanderas.ROLES_ACTIVAR;

    const isValid = await verifyActionAccess(requiredPermission);
    if (isValid) {
      setConfirmRole(role);
      setIsConfirmOpen(true);
    }
    setLoadingRoleId(null);
  }

  function closeConfirmModal() {
    if (isToggling) return;
    setIsConfirmOpen(false);
    setConfirmRole(null);
  }

  async function confirmToggleStatus() {
    if (!confirmRole || isToggling) return;
    setIsToggling(true);

    try {
      const isActivo = confirmRole.estado === 1;
      const requiredPermission = isActivo ? PermisoBanderas.ROLES_ELIMINAR : PermisoBanderas.ROLES_ACTIVAR;

      const isValid = await verifyActionAccess(requiredPermission);
      if (!isValid) return;

      await toggleRoleStatus(confirmRole);
      const accion = isActivo ? "desactivado" : "activado";
      toast("info", "Estado actualizado", `El rol '${confirmRole.nombre}' ha sido ${accion}.`);
      closeConfirmModal();
      await loadRoles();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado.";
      toast("error", "Error de actualización", message);
    } finally {
      setIsToggling(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    registros,
    total,
    totalPermisosSistema: resumen.total_permisos_sistema ?? 0,
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
    loadingRoleId,

    currentUser,

    editingRole,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveRole,

    permissionsRole,
    isPermissionsOpen,
    catalogPermissions,
    selectedPermissionIds,
    isLoadingPermissions,
    openPermissionsModal,
    closePermissionsModal,
    savePermissions,

    confirmRole,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}