"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { FormEvent, useEffect, useState } from "react";
import type { RoleItem } from "@/modules/roles/types/roles.types";
import type { SucursalOption, User, UserFormValues } from "../types/user.types";

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  user: User | null;
  availableRoles?: RoleItem[];
  availableSucursales?: SucursalOption[];
  isSaving: boolean;
};

const DEFAULT_SUCURSALES: SucursalOption[] = [
  { id: 1, nombre: "Sede Principal" },
];

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  availableRoles = [],
  availableSucursales = DEFAULT_SUCURSALES,
  isSaving,
}: UserFormModalProps) {
  const sucursalesList = availableSucursales.length > 0 ? availableSucursales : DEFAULT_SUCURSALES;
  const initialSucursalId = sucursalesList[0]?.id ?? 1;

  const [values, setValues] = useState<UserFormValues>({
    username: "",
    email: "",
    password: "",
    pin: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    idSucursalDefault: initialSucursalId,
    rolesIds: [],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      setValues({
        username: user.username || "",
        email: user.email || "",
        password: "",
        pin: "",
        nombres: user.nombres || "",
        apellidos: user.apellidos || "",
        telefono: user.telefono ?? "",
        idSucursalDefault: user.id_sucursal_default ?? initialSucursalId,
        rolesIds: user.roles?.map((r) => r.id) ?? [],
      });
    } else {
      setValues({
        username: "",
        email: "",
        password: "",
        pin: "",
        nombres: "",
        apellidos: "",
        telefono: "",
        idSucursalDefault: initialSucursalId,
        rolesIds: [],
      });
    }
    setShowPassword(false);
    setErrors({});
  }, [isOpen, user, initialSucursalId]);

  function handleRoleToggle(roleId: number) {
    setValues((prev) => {
      const exists = prev.rolesIds.includes(roleId);
      return {
        ...prev,
        rolesIds: exists
          ? prev.rolesIds.filter((id) => id !== roleId)
          : [...prev.rolesIds, roleId],
      };
    });
  }

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

  const isSuperAdmin = Boolean(user?.es_super_admin);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[640px] p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <h4 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
          {user ? "Editar usuario" : "Nuevo usuario"}
        </h4>
        <p className="mb-6 text-xs text-gray-500 dark:text-gray-400">
          {user
            ? "Actualiza la información del usuario en el sistema."
            : "Completa la información requerida para registrar un nuevo usuario."}
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="nombres">Nombres *</Label>
              <Input
                id="nombres"
                value={values.nombres}
                onChange={(e) => setValues((p) => ({ ...p, nombres: e.target.value }))}
                placeholder="Ej. Juan"
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
                placeholder="Ej. Pérez"
                error={Boolean(errors.apellidos)}
                hint={errors.apellidos}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={values.username}
                onChange={(e) => setValues((p) => ({ ...p, username: e.target.value }))}
                placeholder="jperez"
                error={Boolean(errors.username)}
                hint={errors.username}
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="email">Correo *</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
                placeholder="juan@gmail.com"
                error={Boolean(errors.email)}
                hint={errors.email}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* INPUT DE CONTRASEÑA CON TOGGLE (OJITO) */}
            <div>
              <Label htmlFor="password">
                {user ? "Nueva contraseña (opcional)" : "Contraseña *"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => setValues((p) => ({ ...p, password: e.target.value }))}
                  placeholder={user ? "Mantener contraseña actual" : "Mínimo 6 caracteres"}
                  error={Boolean(errors.password)}
                  hint={errors.password}
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  tabIndex={-1}
                >
                  <Icon
                    name={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"}
                    size={20}
                  />
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="pin">PIN de acceso rápido (POS/KDS)</Label>
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* SELECT ESTILIZADO SEGÚN PATRÓN TAILADMIN */}
            <div>
              <Label htmlFor="idSucursalDefault">Sucursal asignada *</Label>
              <div className="relative">
                <select
                  id="idSucursalDefault"
                  value={values.idSucursalDefault ?? ""}
                  onChange={(e) =>
                    setValues((p) => ({
                      ...p,
                      idSucursalDefault: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  disabled={isSaving}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  {sucursalesList.map((suc) => (
                    <option key={suc.id} value={suc.id} className="dark:bg-gray-900">
                      {suc.nombre}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <Icon name="mdi:chevron-down" size={20} />
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono (opcional)</Label>
              <Input
                id="telefono"
                value={values.telefono}
                onChange={(e) => setValues((p) => ({ ...p, telefono: e.target.value }))}
                placeholder="987654321"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* SECCIÓN DE ROLES CON COMPONENTE CHECKBOX TAILADMIN */}
          <div className="pt-2">
            <Label>Roles Asignados</Label>
            {isSuperAdmin ? (
              <p className="mt-1 text-xs italic text-amber-600 dark:text-amber-400">
                Este usuario es el Propietario (Super Admin). Tiene permisos globales absolutos y no requiere asignación de roles.
              </p>
            ) : availableRoles.length === 0 ? (
              <p className="mt-1 text-xs text-gray-400">
                Cargando roles disponibles...
              </p>
            ) : (
              <>
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                  Marca los roles que le corresponden a este usuario:
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {availableRoles.map((role) => {
                    const isChecked = values.rolesIds.includes(role.id);

                    return (
                      <div
                        key={role.id}
                        onClick={() => handleRoleToggle(role.id)}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                          isChecked
                            ? "border-brand-500/30 bg-brand-50/50 dark:border-brand-500/20 dark:bg-brand-500/10"
                            : "border-gray-200 bg-white hover:bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:bg-gray-800/40"
                        }`}
                      >
                        <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={isChecked}
                            onChange={() => handleRoleToggle(role.id)}
                          />
                        </div>
                        <div className="select-none">
                          <span className="block text-sm font-bold text-gray-800 dark:text-white">
                            {role.nombre}
                          </span>
                          {role.descripcion && (
                            <span className="block text-xs text-gray-400 mt-0.5">
                              {role.descripcion}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 flex w-full items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
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