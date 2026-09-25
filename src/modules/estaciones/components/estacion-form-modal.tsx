"use client";

import { LISTA_IDS, useLista } from "@/modules/listas";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import Alert from "@/components/ui/alert/Alert";
import { FormModal } from "@/components/ui/modal/FormModal";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { FormEvent, useEffect, useState } from "react";
import type { EstacionItem, EstacionFormValues } from "../types/estaciones.types";
import type { SucursalOption } from "@/modules/users/types/user.types";

type EstacionFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: EstacionFormValues) => Promise<void>;
  estacion: EstacionItem | null;
  availableSucursales?: SucursalOption[];
  isSaving: boolean;
  defaultSucursalId?: number;
};

export function EstacionFormModal(props: EstacionFormModalProps) {
  if (!props.isOpen) return null;
  return <EstacionFormContent key={props.estacion?.id ?? "nuevo"} {...props} />;
}

function EstacionFormContent({
  isOpen,
  onClose,
  onSubmit,
  estacion,
  availableSucursales = [],
  isSaving,
  defaultSucursalId = 1,
}: EstacionFormModalProps) {
  const { opciones: tiposEstacion, isLoading: isLoadingTipos } = useCatalogo("ESTACION_TIPO");

  const [values, setValues] = useState<EstacionFormValues>({
    id_sucursal: defaultSucursalId,
    codigo: "",
    nombre: "",
    tipo_estacion: 1,
    impresora_nombre: "",
    impresora_ip: "",
    usa_kds: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EstacionFormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof EstacionFormValues, boolean>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (estacion) {
      setValues({
        id_sucursal: estacion.id_sucursal ?? defaultSucursalId,
        codigo: estacion.codigo || "",
        nombre: estacion.nombre || "",
        tipo_estacion: estacion.tipo_estacion ?? 1,
        impresora_nombre: estacion.impresora_nombre || "",
        impresora_ip: estacion.impresora_ip || "",
        usa_kds: Boolean(estacion.usa_kds),
      });
    } else {
      setValues({
        id_sucursal: availableSucursales[0]?.id ?? defaultSucursalId,
        codigo: "",
        nombre: "",
        tipo_estacion: tiposEstacion[0]?.valor_entero ?? 1,
        impresora_nombre: "",
        impresora_ip: "",
        usa_kds: false,
      });
    }
    setErrors({});
    setTouched({});
    setIsSubmitted(false);
    setServerError(null);
  }, [isOpen, estacion, defaultSucursalId, availableSucursales, tiposEstacion]);

  function handleBlur(field: keyof EstacionFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function validate(currentValues: EstacionFormValues = values): boolean {
    const next: Partial<Record<keyof EstacionFormValues, string>> = {};

    if (!currentValues.codigo.trim()) next.codigo = "El código es obligatorio.";
    if (!currentValues.nombre.trim()) next.nombre = "El nombre de la estación es obligatorio.";
    if (!currentValues.id_sucursal) next.id_sucursal = "La sucursal es obligatoria.";
    if (!currentValues.tipo_estacion) next.tipo_estacion = "El tipo de estación es obligatorio.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  useEffect(() => {
    if (isOpen) {
      validate(values);
    }
  }, [values]);

  function showError(field: keyof EstacionFormValues): string | undefined {
    return isSubmitted || touched[field] ? errors[field] : undefined;
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

  const sucursalOptions = availableSucursales.map((suc) => ({
    value: String(suc.id),
    label: suc.nombre,
  }));

  const tipoEstacionOptions = tiposEstacion.map((tipo) => ({
    value: String(tipo.valor_entero),
    label: tipo.nombre,
  }));

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={estacion ? "Editar estación" : "Nueva estación"}
      subtitle={
        estacion
          ? "Actualiza la configuración de impresión y KDS de la estación."
          : "Completa la información requerida para registrar una nueva estación."
      }
      isSaving={isSaving}
    >
      {serverError && (
        <div className="mb-4">
          <Alert variant="error" title="Error al guardar" message={serverError} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="codigo">Código *</Label>
          <Input
            id="codigo"
            value={values.codigo}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, codigo: e.target.value.toUpperCase() }));
            }}
            onBlur={() => handleBlur("codigo")}
            placeholder="Ej. EST-COC"
            error={Boolean(showError("codigo"))}
            hint={showError("codigo")}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label>Tipo de estación *</Label>
          <Select
            options={tipoEstacionOptions}
            defaultValue={values.tipo_estacion ? String(values.tipo_estacion) : ""}
            placeholder={isLoadingTipos ? "Cargando tipos..." : "Seleccione tipo..."}
            disabled={isSaving || isLoadingTipos}
            error={Boolean(showError("tipo_estacion"))}
            hint={showError("tipo_estacion")}
            onChange={(val) => {
              setServerError(null);
              setValues((p) => ({ ...p, tipo_estacion: Number(val) }));
              handleBlur("tipo_estacion");
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nombre">Nombre de la estación *</Label>
          <Input
            id="nombre"
            value={values.nombre}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, nombre: e.target.value }));
            }}
            onBlur={() => handleBlur("nombre")}
            placeholder="Ej. Cocina Principal"
            error={Boolean(showError("nombre"))}
            hint={showError("nombre")}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label>Sucursal asignada *</Label>
          <Select
            options={
              sucursalOptions.length > 0
                ? sucursalOptions
                : [{ value: String(defaultSucursalId), label: "Sede Principal" }]
            }
            defaultValue={values.id_sucursal ? String(values.id_sucursal) : String(defaultSucursalId)}
            placeholder={availableSucursales.length === 0 ? "Cargando sucursales..." : "Seleccione sucursal..."}
            disabled={isSaving || availableSucursales.length === 0}
            error={Boolean(showError("id_sucursal"))}
            hint={showError("id_sucursal")}
            onChange={(val) => {
              setServerError(null);
              setValues((p) => ({ ...p, id_sucursal: Number(val) }));
              handleBlur("id_sucursal");
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="impresora_nombre">Nombre Impresora</Label>
          <Input
            id="impresora_nombre"
            value={values.impresora_nombre}
            onChange={(e) => setValues((p) => ({ ...p, impresora_nombre: e.target.value }))}
            placeholder="Ej. Ticketera Cocina"
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="impresora_ip">IP Impresora</Label>
          <Input
            id="impresora_ip"
            value={values.impresora_ip}
            onChange={(e) => setValues((p) => ({ ...p, impresora_ip: e.target.value }))}
            placeholder="Ej. 192.168.1.50"
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="pt-2">
        <Checkbox
          id="usa_kds"
          label="¿Utiliza pantalla de cocina KDS?"
          checked={values.usa_kds}
          onChange={(checked) => setValues((p) => ({ ...p, usa_kds: checked }))}
          disabled={isSaving}
        />
      </div>
    </FormModal>
  );
}
