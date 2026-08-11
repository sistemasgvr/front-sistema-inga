"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormEvent, useEffect, useState } from "react";
import {
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
} from "../services/users.service";
import type { User, UserFormValues, UserRole, UserStatus } from "../types/user.types";

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  user: User | null;
  isSaving: boolean;
};

const EMPTY_FORM: UserFormValues = {
  nombre_usuario: "",
  correo: "",
  rol: "consulta",
  estado: "activo",
};

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  isSaving,
}: UserFormModalProps) {
  const [values, setValues] = useState<UserFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>(
    {},
  );

  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      setValues({
        nombre_usuario: user.nombre_usuario,
        correo: user.correo,
        rol: user.rol,
        estado: user.estado,
      });
    } else {
      setValues(EMPTY_FORM);
    }
    setErrors({});
  }, [isOpen, user]);

  function validate(): boolean {
    const next: Partial<Record<keyof UserFormValues, string>> = {};

    if (!values.nombre_usuario.trim()) {
      next.nombre_usuario = "El nombre es obligatorio.";
    }
    if (!values.correo.trim()) {
      next.correo = "El correo es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo.trim())) {
      next.correo = "Correo inválido.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(values);
  }

  const selectClassName =
    "shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[584px] p-5 lg:p-10">
      <form onSubmit={handleSubmit}>
        <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
          {user ? "Editar usuario" : "Nuevo usuario"}
        </h4>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="nombre_usuario">Nombre de usuario</Label>
            <Input
              id="nombre_usuario"
              value={values.nombre_usuario}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  nombre_usuario: event.target.value,
                }))
              }
              placeholder="Ej. María López"
              error={Boolean(errors.nombre_usuario)}
              hint={errors.nombre_usuario}
              disabled={isSaving}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="correo">Correo</Label>
            <Input
              id="correo"
              type="email"
              value={values.correo}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, correo: event.target.value }))
              }
              placeholder="usuario@inga.com"
              error={Boolean(errors.correo)}
              hint={errors.correo}
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="rol">Rol</Label>
            <select
              id="rol"
              className={selectClassName}
              value={values.rol}
              disabled={isSaving}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  rol: event.target.value as UserRole,
                }))
              }
            >
              {USER_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="estado">Estado</Label>
            <select
              id="estado"
              className={selectClassName}
              value={values.estado}
              disabled={isSaving}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  estado: event.target.value as UserStatus,
                }))
              }
            >
              {USER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex w-full items-center justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
