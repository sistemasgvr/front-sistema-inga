"use client";

import { useCallback, useEffect, useState } from "react";
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
  RolesFeedback,
  RolesResumen,
} from "../types/roles.types";

const PAGE_SIZE = 10;

export function useRoles() {
  const [registros, setRegistros] = useState<RoleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [buscar, setBuscar] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  // Filtro inicial por defecto en "activos"
  const [estadoFiltro, setEstadoFiltro] = useState<RoleStatusFilter>("activos");
  
  const [resumen, setResumen] = useState<RolesResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<RolesFeedback>(null);

  // Modal Crear / Editar Rol
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Modal Matriz de Permisos
  const [permissionsRole, setPermissionsRole] = useState<RoleItem | null>(null);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [catalogPermissions, setCatalogPermissions] = useState<PermisoItem[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  // Modal Confirmación Activar / Desactivar
  const [confirmRole, setConfirmRole] = useState<RoleItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Cargar tabla de roles
  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listRoles({
        buscar,
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
      });

      setRegistros(result.registros);
      setTotal(result.total);

      if (result.resumen) {
        setResumen(result.resumen);
      }
    } catch {
      setFeedback({
        variant: "error",
        title: "Error al cargar",
        message: "No se pudieron obtener los roles de la base de datos.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [buscar, pagina, pageSize, estadoFiltro]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  function handleFilterStatus(status: RoleStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setPagina(1);
  }

  function applySearch() {
    setPagina(1);
    setBuscar(searchInput.trim());
  }

  // --- Handlers Modal Formulario ---
  function openCreateModal() {
    setEditingRole(null);
    setIsFormOpen(true);
  }

  function openEditModal(role: RoleItem) {
    setEditingRole(role);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingRole(null);
  }

  async function saveRole(values: RoleFormValues) {
    setIsSaving(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, values);
        setFeedback({
          variant: "success",
          title: "Rol actualizado",
          message: `El rol '${values.nombre}' se guardó correctamente.`,
        });
      } else {
        await createRole(values);
        setFeedback({
          variant: "success",
          title: "Rol creado",
          message: `El rol '${values.nombre}' fue registrado correctamente.`,
        });
        setPagina(1);
      }
      closeFormModal();
      await loadRoles();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al guardar",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // --- Handlers Modal Permisos ---
  async function openPermissionsModal(role: RoleItem) {
    setPermissionsRole(role);
    setIsPermissionsOpen(true);
    setIsLoadingPermissions(true);

    try {
      // Cargar catálogo global + permisos asignados en paralelo
      const [catalog, assignedIds] = await Promise.all([
        getPermissionsCatalog(),
        getRolePermissions(role.id),
      ]);

      setCatalogPermissions(catalog);
      setSelectedPermissionIds(assignedIds);
    } catch {
      setFeedback({
        variant: "error",
        title: "Error de permisos",
        message: "No se pudieron obtener los permisos del rol seleccionado.",
      });
      setIsPermissionsOpen(false);
    } finally {
      setIsLoadingPermissions(false);
    }
  }

  function closePermissionsModal() {
    setIsPermissionsOpen(false);
    setPermissionsRole(null);
    setCatalogPermissions([]);
    setSelectedPermissionIds([]);
  }

  async function savePermissions(idsPermisos: number[]) {
    if (!permissionsRole) return;
    setIsSaving(true);
    try {
      await syncRolePermissions(permissionsRole.id, idsPermisos);
      setFeedback({
        variant: "success",
        title: "Permisos actualizados",
        message: `Los permisos para el rol '${permissionsRole.nombre}' fueron guardados.`,
      });
      closePermissionsModal();
      await loadRoles();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al guardar permisos",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // --- Handlers Confirmación ---
  function openConfirmModal(role: RoleItem) {
    setConfirmRole(role);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    setIsConfirmOpen(false);
    setConfirmRole(null);
  }

  async function confirmToggleStatus() {
    if (!confirmRole) return;
    setIsToggling(true);
    try {
      await toggleRoleStatus(confirmRole);
      closeConfirmModal();
      await loadRoles();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error de actualización",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setIsToggling(false);
    }
  }

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
    applySearch,
    estadoFiltro,
    handleFilterStatus,
    resumen,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    
    // Modal Form
    editingRole,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveRole,

    // Modal Permisos
    permissionsRole,
    isPermissionsOpen,
    catalogPermissions,
    selectedPermissionIds,
    isLoadingPermissions,
    openPermissionsModal,
    closePermissionsModal,
    savePermissions,

    // Modal Confirm
    confirmRole,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}