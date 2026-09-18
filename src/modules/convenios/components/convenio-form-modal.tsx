"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import { FormEvent, useEffect, useState } from "react";
import type {
  CondicionPagoItem,
  ConvenioFormValues,
  ConvenioItem,
} from "../types/convenios.types";

type ConvenioFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ConvenioFormValues) => Promise<void>;
  convenio: ConvenioItem | null;
  condicionesPago: CondicionPagoItem[];
  isSaving: boolean;
};

const VALORES_INICIALES: ConvenioFormValues = {
  codigo: "",
  nombre: "",
  id_condicion_pago: null,
  limite_credito: 0,
  corte_quincenal: true,
};

export function ConvenioFormModal({
  isOpen,
  onClose,
  onSubmit,
  convenio,
  condicionesPago,
  isSaving,
}: ConvenioFormModalProps) {
  const [values, setValues] = useState<ConvenioFormValues>(VALORES_INICIALES);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ConvenioFormValues, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ConvenioFormValues, boolean>>
  >({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Cada vez que se abre el modal recargo los valores. Sin esto, editar un
  // convenio y luego pulsar "Nuevo" mostraría los datos del anterior.
  useEffect(() => {
    if (!isOpen) return;

    if (convenio) {
      setValues({
        codigo: convenio.codigo,
        nombre: convenio.nombre,
        id_condicion_pago: convenio.id_condicion_pago,
        limite_credito: Number(convenio.limite_credito) || 0,
        corte_quincenal: convenio.corte_quincenal,
      });
    } else {
      setValues({
        ...VALORES_INICIALES,
        // Preselecciono la condición de crédito quincenal si existe: es la que
        // usan los cuatro convenios reales, así el usuario no la elige a mano.
        id_condicion_pago:
          condicionesPago.find((c) => c.dias_credito === 15)?.id ??
          condicionesPago[0]?.id ??
          null,
      });
    }

    setErrors({});
    setTouched({});
    setIsSubmitted(false);
    setServerError(null);
  }, [isOpen, convenio, condicionesPago]);

  function validate(current: ConvenioFormValues) {
    const next: Partial<Record<keyof ConvenioFormValues, string>> = {};

    if (!current.codigo.trim()) {
      next.codigo = "El código es obligatorio.";
    } else if (!/^[A-Za-z0-9_-]+$/.test(current.codigo.trim())) {
      next.codigo = "Usa solo letras, números, guion o guion bajo.";
    }

    if (!current.nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!current.id_condicion_pago) {
      next.id_condicion_pago = "Selecciona una condición de pago.";
    }
    if (current.limite_credito < 0) {
      next.limite_credito = "El límite no puede ser negativo.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // Valido en cada cambio para que el mensaje desaparezca apenas se corrige,
  // pero solo lo muestro si el campo ya fue tocado o si intentó enviar.
  useEffect(() => {
    if (isOpen) validate(values);
  }, [values, isOpen]);

  function showError(field: keyof ConvenioFormValues): string | undefined {
    if (isSubmitted || touched[field]) return errors[field];
    return undefined;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIsSubmitted(true);
    setServerError(null);

    if (!validate(values)) return;

    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al guardar.",
      );
    }
  }

  const opcionesCondicion = condicionesPago.map((c) => ({
    value: String(c.id),
    label:
      c.dias_credito > 0 ? `${c.nombre} (${c.dias_credito} días)` : c.nombre,
  }));

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={convenio ? "Editar convenio" : "Nuevo convenio"}
      subtitle="Empresa del consorcio cuyo personal consume a crédito y paga por quincena."
      isSaving={isSaving}
    >
      {serverError && (
        <Alert variant="error" title="Error al guardar" message={serverError} />
      )}

      {condicionesPago.length === 0 && (
        <Alert
          variant="warning"
          title="Sin condiciones de pago"
          message="No se pudieron cargar las condiciones de pago. Revisa que la semilla de gen_condicion_pago esté ejecutada."
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="codigo">Código *</Label>
          <Input
            id="codigo"
            value={values.codigo}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, codigo: e.target.value.toUpperCase() }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, codigo: true }))}
            placeholder="GVR"
            error={Boolean(showError("codigo"))}
            hint={showError("codigo")}
            disabled={isSaving}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="nombre">Nombre del convenio *</Label>
          <Input
            id="nombre"
            value={values.nombre}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, nombre: e.target.value }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, nombre: true }))}
            placeholder="Consorcio GVR"
            error={Boolean(showError("nombre"))}
            hint={showError("nombre")}
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="id_condicion_pago">Condición de pago *</Label>
          <Select
            options={opcionesCondicion}
            defaultValue={
              values.id_condicion_pago ? String(values.id_condicion_pago) : ""
            }
            placeholder="Selecciona una condición"
            onChange={(value) => {
              setServerError(null);
              setTouched((p) => ({ ...p, id_condicion_pago: true }));
              setValues((p) => ({ ...p, id_condicion_pago: Number(value) }));
            }}
            error={Boolean(showError("id_condicion_pago"))}
            hint={showError("id_condicion_pago")}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="limite_credito">Límite de crédito (S/)</Label>
          <Input
            id="limite_credito"
            type="number"
            step={0.01}
            min="0"
            value={values.limite_credito}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({
                ...p,
                limite_credito: Number(e.target.value),
              }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, limite_credito: true }))}
            error={Boolean(showError("limite_credito"))}
            hint={showError("limite_credito") ?? "Deja 0 si no quieres poner tope."}
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Uso una tarjeta clicable en vez de un checkbox suelto: el corte
          quincenal define cuándo se le factura a la empresa, así que merece
          explicación visible y un área de clic grande. */}
      <button
        type="button"
        onClick={() =>
          setValues((p) => ({ ...p, corte_quincenal: !p.corte_quincenal }))
        }
        disabled={isSaving}
        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
          values.corte_quincenal
            ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
            : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
        }`}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
            values.corte_quincenal
              ? "border-brand-500 bg-brand-500 text-white"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          {values.corte_quincenal && <Icon name="mdi:check" size={14} />}
        </span>
        <span>
          <span className="block text-sm font-semibold text-gray-800 dark:text-white/90">
            Corte quincenal
          </span>
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
            La cuenta se cierra dos veces al mes (día 15 y fin de mes). Desactívalo
            si a esta empresa se le cobra de otra forma.
          </span>
        </span>
      </button>
    </FormModal>
  );
}
