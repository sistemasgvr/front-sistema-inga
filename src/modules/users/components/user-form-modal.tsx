"use client";

import { useErrorNotification } from "@/shared/hooks/use-error-notification";

import { ToastNotification } from "@/components/ui/toast/ToastNotification";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { PasswordField } from "@/components/form/input/PasswordField";
import { RoleCheckboxCard } from "@/components/form/input/RoleCheckboxCard";
import { FormModal } from "@/components/ui/modal/FormModal";
import { FormEvent, useEffect, useState } from "react";
import type { RoleItem } from "@/modules/roles/types/roles.types";
import type { User, UserFormValues } from "../types/user.types";
import { useTrabajadorUsuario } from "../hooks/use-trabajador-usuario";
import { useSucursalesEmpresa } from "../hooks/use-sucursales-empresa";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  user: User | null;
  availableRoles?: RoleItem[];
  isSaving: boolean;
};
const initial: UserFormValues = {
  idTrabajador: null,
  username: "",
  password: "",
  pin: "",
  rolesIds: [],
  sucursalesIds: [],
  idSucursalPredeterminada: null,
};

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  availableRoles = [],
  isSaving,
}: Props) {
  const [values, setValues] = useState<UserFormValues>(initial);
  const notifyError = useErrorNotification("No se pudo guardar");
  const trabajadores = useTrabajadorUsuario(isOpen && !user);
  const sucursales = useSucursalesEmpresa(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setValues(
      user
        ? {
            idTrabajador: user.id_trabajador ?? null,
            username: user.username,
            password: "",
            pin: "",
            rolesIds: user.roles?.map((r) => r.id) ?? [],
            sucursalesIds: user.sucursales?.map((s) => s.id) ?? [],
            idSucursalPredeterminada:
              user.sucursales?.find((s) => s.es_predeterminada)?.id ?? null,
          }
        : { ...initial, rolesIds: [], sucursalesIds: [] },
    );

  }, [isOpen, user]);

  // Usuario nuevo: por defecto trabaja en la sucursal de su trabajador.
  const sucursalTrabajador = trabajadores.selected?.id_sucursal ?? null;
  useEffect(() => {
    if (user || !sucursalTrabajador) return;
    queueMicrotask(() =>
      setValues((p) =>
        p.sucursalesIds.length
          ? p
          : { ...p, sucursalesIds: [sucursalTrabajador], idSucursalPredeterminada: sucursalTrabajador },
      ),
    );
  }, [user, sucursalTrabajador]);

  function alternarSucursal(id: number) {
    setValues((p) => {
      const sucursalesIds = p.sucursalesIds.includes(id)
        ? p.sucursalesIds.filter((s) => s !== id)
        : [...p.sucursalesIds, id];
      const idSucursalPredeterminada = sucursalesIds.includes(p.idSucursalPredeterminada ?? -1)
        ? p.idSucursalPredeterminada
        : (sucursalesIds[0] ?? null);
      return { ...p, sucursalesIds, idSucursalPredeterminada };
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;

    if (
      !user &&
      (!trabajadores.selected ||
        trabajadores.loadingDetail ||
        Number(trabajadores.selected.id) !== values.idTrabajador)
    ) {
      notifyError(
        "Selecciona un trabajador activo con correo electrónico y sin usuario.",
      );
      return;
    }
    if (!values.username.trim() || values.username.trim().length > 50) {
      notifyError(
        "El nombre de usuario es obligatorio y admite hasta 50 caracteres.",
      );
      return;
    }
    if (
      (!user && !values.password) ||
      (values.password &&
        (values.password.length < 8 || values.password.length > 100))
    ) {
      notifyError("La contraseña debe tener entre 8 y 100 caracteres.");
      return;
    }
    if (sucursales.sucursales.length > 0 && values.sucursalesIds.length === 0) {
      notifyError("Asigna al menos una sucursal en la que trabaja el usuario.");
      return;
    }
    if (values.pin && (values.pin.length < 4 || values.pin.length > 10)) {
      notifyError("El PIN debe tener entre 4 y 10 caracteres.");
      return;
    }
    try {
      await onSubmit(values);
    } catch (error) {
      notifyError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el usuario.",
      );
    }
  }

  const persona = user ?? trabajadores.selected;
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={user ? "Editar usuario" : "Nuevo usuario"}
      subtitle="Vincula la cuenta a un trabajador. Sus datos personales se administran en Personal → Trabajadores."
      isSaving={isSaving}
    >

      {!user && (
        <div>
          <Label>Trabajador *</Label>
          <Select
            options={trabajadores.options.map((t) => ({
              value: String(t.id),
              label: `${t.nombres} ${t.apellidos} · ${t.email}`,
            }))}
            defaultValue={
              values.idTrabajador ? String(values.idTrabajador) : ""
            }
            placeholder="Selecciona un trabajador sin usuario"
            onOpen={() => {
              void trabajadores.refresh();
            }}
            isLoading={trabajadores.loadingOptions}
            loadError={trabajadores.error}
            disabled={isSaving}
            onChange={(value) => {
              const id = value ? Number(value) : null;
              setValues((p) => ({ ...p, idTrabajador: id }));
              void trabajadores.select(id);
            }}
          />
          <p className="mt-2 text-sm text-gray-500">
            Primero registra al trabajador con su correo. Crear su cuenta de
            acceso es opcional.
          </p>
        </div>
      )}
      {trabajadores.loadingDetail && (
        <p className="text-sm text-gray-500">Consultando trabajador…</p>
      )}
      {!user && trabajadores.error && (
        <ToastNotification
          variant="error"
          title="Trabajador"
          message={trabajadores.error}
        />
      )}
      {persona && (
        <div className="space-y-1.5 ">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Trabajador asociado *
          </span>
          <div className="rounded-lg border border-gray-300  p-4 text-sm dark:bg-white/5">
            <p className="font-semibold text-gray-900 dark:text-white">
              {persona.nombres} {persona.apellidos}
            </p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-gray-600 dark:text-gray-400">
              <p>
                <span className="text-gray-400">Correo: </span>
                {persona.email}
              </p>
              <p>
                <span className="text-gray-400">Teléfono: </span>
                {persona.telefono || "Sin teléfono"}
              </p>
              <p>
                <span className="text-gray-400">Sucursal: </span>
                {trabajadores.selected?.nombre_sucursal || "Sin sucursal"}
              </p>
            </div>
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="username">Nombre de usuario *</Label>
        <Input
          id="username"
          value={values.username}
          disabled={isSaving}
          onChange={(e) =>
            setValues((p) => ({ ...p, username: e.target.value }))
          }
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PasswordField
          id="password"
          label={user ? "Nueva contraseña (opcional)" : "Contraseña *"}
          value={values.password || ""}
          disabled={isSaving}
          onChange={(e) =>
            setValues((p) => ({ ...p, password: e.target.value }))
          }
        />
        <div>
          <Label htmlFor="pin">PIN (opcional)</Label>
          <Input
            id="pin"
            type="password"
            value={values.pin}
            disabled={isSaving}
            onChange={(e) => setValues((p) => ({ ...p, pin: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <Label>Sucursales donde trabaja *</Label>
        <p className="mb-2 text-xs text-gray-500">
          Solo de su empresa. La predeterminada es la que abre al iniciar sesión; si tiene varias, cambia desde «Trabajando en».
        </p>
        {sucursales.cargando ? (
          <p className="text-sm text-gray-500">Cargando sucursales…</p>
        ) : sucursales.error ? (
          <p className="text-sm text-error-600">{sucursales.error}</p>
        ) : sucursales.sucursales.length === 0 ? (
          <p className="text-sm text-gray-500">La empresa no tiene sucursales activas.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {sucursales.sucursales.map((s) => {
              const asignada = values.sucursalesIds.includes(s.id);
              const predeterminada = values.idSucursalPredeterminada === s.id;
              return (
                <div key={s.id}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${asignada
                    ? "border-brand-300 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/10"
                    : "border-gray-200 dark:border-gray-700"}`}>
                  <label className="flex cursor-pointer items-center gap-2 text-gray-800 dark:text-white/90">
                    <input type="checkbox" checked={asignada} disabled={isSaving}
                      onChange={() => alternarSucursal(s.id)} className="h-4 w-4 rounded border-gray-300" />
                    {s.nombre}
                  </label>
                  {asignada && (
                    <label className="flex cursor-pointer items-center gap-1 text-xs text-gray-500">
                      <input type="radio" name="sucursal-predeterminada" checked={predeterminada} disabled={isSaving}
                        onChange={() => setValues((p) => ({ ...p, idSucursalPredeterminada: s.id }))} />
                      Predeterminada
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div>
        <Label>Roles asignados</Label>
        {user?.es_super_admin ? (
          <p className="text-sm text-gray-500">
            El propietario tiene acceso a todos los módulos.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {availableRoles.map((role) => (
              <RoleCheckboxCard
                key={role.id}
                id={role.id}
                nombre={role.nombre}
                descripcion={role.descripcion}
                isChecked={values.rolesIds.includes(role.id)}
                onToggle={() => {
                  if (!isSaving)
                    setValues((p) => ({
                      ...p,
                      rolesIds: p.rolesIds.includes(role.id)
                        ? p.rolesIds.filter((id) => id !== role.id)
                        : [...p.rolesIds, role.id],
                    }));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </FormModal>
  );
}
