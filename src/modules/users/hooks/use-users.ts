"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createUser,
  listUsers,
  toggleUserStatus,
  updateUser,
} from "../services/users.service";
import type {
  User,
  UserFormValues,
  UserStatusFilter,
  UsersFeedback,
  UsersResumen,
} from "../types/user.types";

const PAGE_SIZE = 10;

export function useUsers() {
  const [registros, setRegistros] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [buscar, setBuscar] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<UserStatusFilter>("todos");
  const [resumen, setResumen] = useState<UsersResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<UsersFeedback>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Modal confirmación
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadUsers = useCallback(async () => {
  setIsLoading(true);
  try {
    const result = await listUsers({
      buscar,
      pagina,
      limite: PAGE_SIZE,
      estado: estadoFiltro,
    });

    setRegistros(result.registros);
    setTotal(result.total);

    if (result.resumen) {
      setResumen(result.resumen);
    } else {
      // Fallback automático mientras el backend devuelve el objeto 'resumen'
      setResumen((prev) => ({
        total: estadoFiltro === "todos" ? result.total : prev.total,
        activos: estadoFiltro === "activos" ? result.total : prev.activos,
        inactivos: estadoFiltro === "inactivos" ? result.total : prev.inactivos,
      }));
    }
  } catch {
    setFeedback({
      variant: "error",
      title: "Error al cargar",
      message: "No se pudieron obtener los usuarios de la base de datos.",
    });
  } finally {
    setIsLoading(false);
  }
}, [buscar, pagina, estadoFiltro]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function handleFilterStatus(status: UserStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function openCreateModal() {
    setEditingUser(null);
    setIsFormOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingUser(null);
  }

  function openConfirmModal(user: User) {
    setConfirmUser(user);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    setIsConfirmOpen(false);
    setConfirmUser(null);
  }

  function applySearch() {
    setPagina(1);
    setBuscar(searchInput.trim());
  }

  async function saveUser(values: UserFormValues) {
    setIsSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
        setFeedback({
          variant: "success",
          title: "Usuario actualizado",
          message: `${values.nombres} ${values.apellidos} se guardó correctamente.`,
        });
      } else {
        await createUser(values);
        setFeedback({
          variant: "success",
          title: "Usuario creado",
          message: `${values.nombres} ${values.apellidos} fue registrado.`,
        });
        setPagina(1);
      }
      closeFormModal();
      await loadUsers();
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
    if (!confirmUser) return;
    setIsToggling(true);
    try {
      await toggleUserStatus(confirmUser);
      const nuevoEstado = confirmUser.estado === 1 ? "desactivado" : "activado";
      setFeedback({
        variant: "info",
        title: "Estado actualizado",
        message: `El usuario @${confirmUser.username} ha sido ${nuevoEstado}.`,
      });
      closeConfirmModal();
      await loadUsers();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo cambiar el estado",
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
    editingUser,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveUser,
    confirmUser,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
    pageSize: PAGE_SIZE,
  };
}