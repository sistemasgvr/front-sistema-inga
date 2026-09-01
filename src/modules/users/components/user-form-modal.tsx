"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Alert from "@/components/ui/alert/Alert";
import { PasswordField } from "@/components/form/input/PasswordField";
import { RoleCheckboxCard } from "@/components/form/input/RoleCheckboxCard";
import { FormModal } from "@/components/ui/modal/FormModal";
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

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  availableRoles = [],
  availableSucursales = [],
  isSaving,
}: UserFormModalProps) {
  const [values, setValues] = useState<UserFormValues>({
    username: "",
    email: "",
    password: "",
    pin: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    idSucursalDefault: null,
    rolesIds: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof UserFormValues, boolean>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
        idSucursalDefault: user.id_sucursal_default ?? null,
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
        idSucursalDefault: availableSucursales[0]?.id ?? null,
        rolesIds: [],
      });
    }
    setErrors({});
    setTouched({});
    setIsSubmitted(false);
    setServerError(null);
  }, [isOpen, user, availableSucursales]);

  function handleBlur(field: keyof UserFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

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

  function validate(currentValues: UserFormValues = values): boolean {
    const next: Partial<Record<keyof UserFormValues, string>> = {};

    if (!currentValues.nombres.trim()) next.nombres = "El nombre es obligatorio.";
    if (!currentValues.apellidos.trim()) next.apellidos = "Los apellidos son obligatorios.";
    if (!currentValues.username.trim()) next.username = "El username es obligatorio.";

    if (!currentValues.email.trim()) {
      next.email = "El correo es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentValues.email.trim())) {
      next.email = "Correo electrónico inválido.";
    }

    if (!user && !currentValues.password) {
      next.password = "La contraseña es obligatoria para nuevos usuarios.";
    }

    if (currentValues.pin && currentValues.pin.length < 4) {
      next.pin = "El PIN debe tener al menos 4 dígitos.";
    }

    if (!currentValues.idSucursalDefault) {
      next.idSucursalDefault = "La sucursal es obligatoria.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  useEffect(() => {
    if (isOpen) {
      validate(values);
    }
  }, [values]);

  function showError(field: keyof UserFormValues): string | undefined {
    const isFieldTouched = touched[field];
    if (isSubmitted || isFieldTouched) {
      return errors[field];
    }
    return undefined;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIsSubmitted(true);
    
    setServerError(null);

    if (!validate()) return;

    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al procesar la solicitud."
      );
    }
  }

  const isSuperAdmin = Boolean(user?.es_super_admin);
  const sucursalOptions = availableSucursales.map((suc) => ({
    value: String(suc.id),
    label: suc.nombre,
  }));

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={user ? "Editar usuario" : "Nuevo usuario"}
      subtitle={
        user
          ? "Actualiza la información del usuario en el sistema."
          : "Completa la información requerida para registrar un nuevo usuario."
      }
      isSaving={isSaving}
    >
      {/* Alerta de Error del Backend en el Modal */}
      {serverError && (
        <div className="mb-4">
          <Alert
            variant="error"
            title="Error al guardar"
            message={serverError}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nombres">Nombres *</Label>
          <Input
            id="nombres"
            value={values.nombres}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, nombres: e.target.value }));
            }}
            onBlur={() => handleBlur("nombres")}
            placeholder="Ej. Juan"
            error={Boolean(showError("nombres"))}
            hint={showError("nombres")}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="apellidos">Apellidos *</Label>
          <Input
            id="apellidos"
            value={values.apellidos}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, apellidos: e.target.value }));
            }}
            onBlur={() => handleBlur("apellidos")}
            placeholder="Ej. Pérez"
            error={Boolean(showError("apellidos"))}
            hint={showError("apellidos")}
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
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, username: e.target.value }));
            }}
            onBlur={() => handleBlur("username")}
            placeholder="jperez"
            error={Boolean(showError("username"))}
            hint={showError("username")}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="email">Correo *</Label>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, email: e.target.value }));
            }}
            onBlur={() => handleBlur("email")}
            placeholder="juan@gmail.com"
            error={Boolean(showError("email"))}
            hint={showError("email")}
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PasswordField
          id="password"
          label={user ? "Nueva contraseña (opcional)" : "Contraseña *"}
          value={values.password || ""}
          onChange={(e) => {
            setServerError(null);
            setValues((p) => ({ ...p, password: e.target.value }));
          }}
          onBlur={() => handleBlur("password")}
          placeholder={user ? "Mantener contraseña actual" : "Mínimo 6 caracteres"}
          error={Boolean(showError("password"))}
          hint={showError("password")}
          disabled={isSaving}
        />

        <div>
          <Label htmlFor="pin">PIN de acceso rápido (POS/KDS)</Label>
          <Input
            id="pin"
            type="password"
            value={values.pin}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, pin: e.target.value }));
            }}
            onBlur={() => handleBlur("pin")}
            placeholder="Ej. 1234"
            error={Boolean(showError("pin"))}
            hint={showError("pin")}
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Sucursal asignada *</Label>
          <Select
            options={sucursalOptions}
            defaultValue={values.idSucursalDefault ? String(values.idSucursalDefault) : ""}
            placeholder={availableSucursales.length === 0 ? "Cargando sucursales..." : "Seleccione sucursal..."}
            disabled={isSaving || availableSucursales.length === 0}
            error={Boolean(showError("idSucursalDefault"))}
            hint={showError("idSucursalDefault")}
            onChange={(val) => {
              setServerError(null);
              setValues((p) => ({ ...p, idSucursalDefault: val ? Number(val) : null }));
              handleBlur("idSucursalDefault");
            }}
          />
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
              {availableRoles.map((role) => (
                <RoleCheckboxCard
                  key={role.id}
                  id={role.id}
                  nombre={role.nombre}
                  descripcion={role.descripcion}
                  isChecked={values.rolesIds.includes(role.id)}
                  onToggle={() => handleRoleToggle(role.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </FormModal>
  );
}