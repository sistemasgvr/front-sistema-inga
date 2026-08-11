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
  UsersFeedback,
} from "../types/user.types";

const PAGE_SIZE = 5;

export function useUsers() {
  const [registros, setRegistros] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [buscar, setBuscar] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<UsersFeedback>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listUsers({
        buscar,
        pagina,
        limite: PAGE_SIZE,
      });
      setRegistros(result.registros);
      setTotal(result.total);
    } catch {
      setFeedback({
        variant: "error",
        title: "Error al cargar",
        message: "No se pudieron obtener los usuarios.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [buscar, pagina]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

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
          message: `${values.nombre_usuario} se guardó correctamente.`,
        });
      } else {
        await createUser(values);
        setFeedback({
          variant: "success",
          title: "Usuario creado",
          message: `${values.nombre_usuario} fue agregado al sistema.`,
        });
        setPagina(1);
      }
      closeFormModal();
      await loadUsers();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo guardar",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(user: User) {
    try {
      const updated = await toggleUserStatus(user.id);
      setFeedback({
        variant: "info",
        title: "Estado actualizado",
        message: `${updated.nombre_usuario} ahora está ${updated.estado}.`,
      });
      await loadUsers();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo cambiar el estado",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",
      });
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
    handleToggleStatus,
    pageSize: PAGE_SIZE,
  };
}
