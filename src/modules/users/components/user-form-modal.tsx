"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormEvent, useEffect, useState } from "react";
import type { User, UserFormValues } from "../types/user.types";

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  user: User | null;
  isSaving: boolean;
};

const EMPTY_FORM: UserFormValues = {
  username: "",
  email: "",
  password: "",
  pin: "",
  nombres: "",
  apellidos: "",
  telefono: "",
  idSucursalDefault: null,
};

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  isSaving,
}: UserFormModalProps) {
  const [values, setValues] = useState<UserFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      setValues({
        username: user.username,
        email: user.email,
        password: "",
        pin: "",
        nombres: user.nombres,
        apellidos: user.apellidos,
        telefono: user.telefono ?? "",
        idSucursalDefault: user.id_sucursal_default ?? null,
      });
    } else {
      setValues(EMPTY_FORM);
    }
    setErrors({});
  }, [isOpen, user]);

  function validate(): boolean {
    const next: Partial<Record<keyof UserFormValues, string>> = {};

    if (!values.username.trim()) next.username = "El username es obligatorio.";
    if (!values.nombres.trim()) next.nombres = "El nombre es obligatorio.";
    if (!values.apellidos.trim()) next.apellidos = "Los apellidos son obligatorios.";

    if (!values.email.trim()) {
      next.email = "El correo es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = "Correo electrónico inválido.";
    }

    if (!user && !values.password) {
      next.password = "La contraseña es obligatoria para nuevos usuarios.";
    }

    if (values.pin && values.pin.length < 4) {
      next.pin = "El PIN debe tener al menos 4 dígitos.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(values);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[584px] p-5 lg:p-10">
      <form onSubmit={handleSubmit}>
        <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
          {user ? "Editar usuario" : "Nuevo usuario"}
        </h4>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={values.username}
              onChange={(e) => setValues((p) => ({ ...p, username: e.target.value }))}
              placeholder="ej. mlopez"
              error={Boolean(errors.username)}
              hint={errors.username}
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
              placeholder="usuario@inga.pe"
              error={Boolean(errors.email)}
              hint={errors.email}
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="nombres">Nombres *</Label>
            <Input
              id="nombres"
              value={values.nombres}
              onChange={(e) => setValues((p) => ({ ...p, nombres: e.target.value }))}
              placeholder="Ej. María"
              error={Boolean(errors.nombres)}
              hint={errors.nombres}
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="apellidos">Apellidos *</Label>
            <Input
              id="apellidos"
              value={values.apellidos}
              onChange={(e) => setValues((p) => ({ ...p, apellidos: e.target.value }))}
              placeholder="Ej. López Torres"
              error={Boolean(errors.apellidos)}
              hint={errors.apellidos}
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={values.telefono}
              onChange={(e) => setValues((p) => ({ ...p, telefono: e.target.value }))}
              placeholder="987654321"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="pin">PIN de acceso rápido</Label>
            <Input
              id="pin"
              type="password"
              value={values.pin}
              onChange={(e) => setValues((p) => ({ ...p, pin: e.target.value }))}
              placeholder="Ej. 1234"
              error={Boolean(errors.pin)}
              hint={errors.pin}
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="idSucursalDefault">Sucursal por defecto (ID)</Label>
            <Input
              id="idSucursalDefault"
              type="number"
              value={values.idSucursalDefault ?? ""}
              onChange={(e) =>
                setValues((p) => ({
                  ...p,
                  idSucursalDefault: e.target.value ? Number(e.target.value) : null,
                }))
              }
              placeholder="ID Sucursal"
              disabled={isSaving}
            />
          </div>

          {!user ? (
            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={values.password}
                onChange={(e) => setValues((p) => ({ ...p, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                error={Boolean(errors.password)}
                hint={errors.password}
                disabled={isSaving}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex w-full items-center justify-end gap-3">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={isSaving}>
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