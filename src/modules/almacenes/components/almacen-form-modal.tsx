"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import Alert from "@/components/ui/alert/Alert";
import { FormModal } from "@/components/ui/modal/FormModal";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { FormEvent, useEffect, useState } from "react";
import type { AlmacenItem, AlmacenFormValues } from "../types/almacenes.types";
import type { SucursalOption } from "@/modules/users/types/user.types";

type AlmacenFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AlmacenFormValues) => Promise<void>;
  almacen: AlmacenItem | null;
  availableSucursales?: SucursalOption[];
  isSaving: boolean;
  defaultSucursalId?: number;
};

export function AlmacenFormModal({
  isOpen,
  onClose,
  onSubmit,
  almacen,
  availableSucursales = [],
  isSaving,
  defaultSucursalId = 1,
}: AlmacenFormModalProps) {
  const { opciones: tiposAlmacen, isLoading: isLoadingTipos } = useCatalogo("ALMACEN_TIPO");

  const [values, setValues] = useState<AlmacenFormValues>({
    id_sucursal: defaultSucursalId,
    codigo: "",
    nombre: "",
    descripcion: "",
    tipo_almacen: 1,
    es_principal: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AlmacenFormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof AlmacenFormValues, boolean>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (almacen) {
      setValues({
        id_sucursal: almacen.id_sucursal ?? defaultSucursalId,
        codigo: almacen.codigo || "",
        nombre: almacen.nombre || "",
        descripcion: almacen.descripcion || "",
        tipo_almacen: almacen.tipo_almacen ?? 1,
        es_principal: Boolean(almacen.es_principal),
      });
    } else {
      setValues({
        id_sucursal: availableSucursales[0]?.id ?? defaultSucursalId,
        codigo: "",
        nombre: "",
        descripcion: "",
        tipo_almacen: tiposAlmacen[0]?.valor_entero ?? 1,
        es_principal: false,
      });
    }
    setErrors({});
    setTouched({});
    setIsSubmitted(false);
    setServerError(null);
  }, [isOpen, almacen, defaultSucursalId, availableSucursales, tiposAlmacen]);

  function handleBlur(field: keyof AlmacenFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function validate(currentValues: AlmacenFormValues = values): boolean {
    const next: Partial<Record<keyof AlmacenFormValues, string>> = {};

    if (!currentValues.codigo.trim()) next.codigo = "El código es obligatorio.";
    if (!currentValues.nombre.trim()) next.nombre = "El nombre del almacén es obligatorio.";
    if (!currentValues.id_sucursal) next.id_sucursal = "La sucursal es obligatoria.";
    if (!currentValues.tipo_almacen) next.tipo_almacen = "El tipo de almacén es obligatorio.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  useEffect(() => {
    if (isOpen) {
      validate(values);
    }
  }, [values]);

  function showError(field: keyof AlmacenFormValues): string | undefined {
    return (isSubmitted || touched[field]) ? errors[field] : undefined;
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

  const tipoAlmacenOptions = tiposAlmacen.map((tipo) => ({
    value: String(tipo.valor_entero),
    label: tipo.nombre,
  }));

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={almacen ? "Editar almacén" : "Nuevo almacén"}
      subtitle={
        almacen
          ? "Actualiza la información del almacén en el sistema."
          : "Completa la información requerida para registrar un nuevo almacén."
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
            placeholder="Ej. ALM-01"
            error={Boolean(showError("codigo"))}
            hint={showError("codigo")}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label>Tipo de almacén *</Label>
          <Select
            options={tipoAlmacenOptions}
            defaultValue={values.tipo_almacen ? String(values.tipo_almacen) : ""}
            placeholder={isLoadingTipos ? "Cargando tipos..." : "Seleccione tipo..."}
            disabled={isSaving || isLoadingTipos}
            error={Boolean(showError("tipo_almacen"))}
            hint={showError("tipo_almacen")}
            onChange={(val) => {
              setServerError(null);
              setValues((p) => ({ ...p, tipo_almacen: Number(val) }));
              handleBlur("tipo_almacen");
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nombre">Nombre del almacén *</Label>
          <Input
            id="nombre"
            value={values.nombre}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, nombre: e.target.value }));
            }}
            onBlur={() => handleBlur("nombre")}
            placeholder="Ej. Almacén Principal"
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

      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Input
          id="descripcion"
          value={values.descripcion}
          onChange={(e) => setValues((p) => ({ ...p, descripcion: e.target.value }))}
          placeholder="Breve descripción orientativa..."
          disabled={isSaving}
        />
      </div>

      <div className="pt-2">
        <Checkbox
          id="es_principal"
          label="¿Es el Almacén Principal de esta sucursal?"
          checked={values.es_principal}
          onChange={(checked) => setValues((p) => ({ ...p, es_principal: checked }))}
          disabled={isSaving}
        />
      </div>
    </FormModal>
  );
}