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
import type { User, UserFormValues } from "../types/user.types";
import { useTrabajadorUsuario } from "../hooks/use-trabajador-usuario";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  user: User | null;
  availableRoles?: RoleItem[];
  isSaving: boolean;
};
const initial: UserFormValues = { idTrabajador: null, username: "", password: "", pin: "", rolesIds: [] };

export function UserFormModal({ isOpen, onClose, onSubmit, user, availableRoles = [], isSaving }: Props) {
  const [values, setValues] = useState<UserFormValues>(initial);
  const [serverError, setServerError] = useState<string | null>(null);
  const trabajadores = useTrabajadorUsuario(isOpen && !user);

  useEffect(() => {
    if (!isOpen) return;
    setValues(user ? {
      idTrabajador: user.id_trabajador ?? null, username: user.username,
      password: "", pin: "", rolesIds: user.roles?.map(r => r.id) ?? [],
    } : { ...initial, rolesIds: [] });
    setServerError(null);
  }, [isOpen, user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setServerError(null);
    if (!user && (!trabajadores.selected || trabajadores.loadingDetail || Number(trabajadores.selected.id) !== values.idTrabajador)) {
      setServerError("Selecciona un trabajador activo con correo electrónico y sin usuario."); return;
    }
    if (!values.username.trim() || values.username.trim().length > 50) {
      setServerError("El nombre de usuario es obligatorio y admite hasta 50 caracteres."); return;
    }
    if ((!user && !values.password) || (values.password && (values.password.length < 8 || values.password.length > 100))) {
      setServerError("La contraseña debe tener entre 8 y 100 caracteres."); return;
    }
    if (values.pin && (values.pin.length < 4 || values.pin.length > 10)) {
      setServerError("El PIN debe tener entre 4 y 10 caracteres."); return;
    }
    try { await onSubmit(values); }
    catch (error) { setServerError(error instanceof Error ? error.message : "No se pudo guardar el usuario."); }
  }

  const persona = user ?? trabajadores.selected;
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit}
      title={user ? "Editar usuario" : "Nuevo usuario"}
      subtitle="Vincula la cuenta a un trabajador. Sus datos personales se administran en Personal → Trabajadores."
      isSaving={isSaving}>
      {serverError && <Alert variant="error" title="No se pudo guardar" message={serverError} />}
      {!user && <div>
        <Label>Trabajador *</Label>
        <Select options={trabajadores.options.map(t => ({ value: String(t.id), label: `${t.nombres} ${t.apellidos} · ${t.email}` }))}
          defaultValue={values.idTrabajador ? String(values.idTrabajador) : ""}
          placeholder="Selecciona un trabajador sin usuario"
          onOpen={() => { void trabajadores.refresh(); }}
          isLoading={trabajadores.loadingOptions} loadError={trabajadores.error} disabled={isSaving}
          onChange={value => {
            const id = value ? Number(value) : null;
            setValues(p => ({ ...p, idTrabajador: id }));
            void trabajadores.select(id);
          }} />
        <p className="mt-2 text-sm text-gray-500">Primero registra al trabajador con su correo. Crear su cuenta de acceso es opcional.</p>
      </div>}
      {trabajadores.loadingDetail && <p className="text-sm text-gray-500">Consultando trabajador…</p>}
      {!user && trabajadores.error && <Alert variant="error" title="Trabajador" message={trabajadores.error} />}
      {persona && <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-white/5">
        <p className="font-medium">{persona.nombres} {persona.apellidos}</p>
        <p>{persona.email}</p><p>{persona.telefono || "Sin teléfono"}</p>
        {trabajadores.selected && <p>{trabajadores.selected.nombre_sucursal || "Sin sucursal"}</p>}
      </div>}
      <div>
        <Label htmlFor="username">Nombre de usuario *</Label>
        <Input id="username" value={values.username} disabled={isSaving}
          onChange={e => setValues(p => ({ ...p, username: e.target.value }))} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PasswordField id="password" label={user ? "Nueva contraseña (opcional)" : "Contraseña *"}
          value={values.password || ""} disabled={isSaving}
          onChange={e => setValues(p => ({ ...p, password: e.target.value }))} />
        <div>
          <Label htmlFor="pin">PIN (opcional)</Label>
          <Input id="pin" type="password" value={values.pin} disabled={isSaving}
            onChange={e => setValues(p => ({ ...p, pin: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label>Roles asignados</Label>
        {user?.es_super_admin ? <p className="text-sm text-gray-500">El propietario tiene acceso a todos los módulos.</p> :
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {availableRoles.map(role => <RoleCheckboxCard key={role.id} id={role.id} nombre={role.nombre}
              descripcion={role.descripcion} isChecked={values.rolesIds.includes(role.id)}
              onToggle={() => { if (!isSaving) setValues(p => ({ ...p, rolesIds: p.rolesIds.includes(role.id) ? p.rolesIds.filter(id => id !== role.id) : [...p.rolesIds, role.id] })); }} />)}
          </div>}
      </div>
    </FormModal>
  );
}
