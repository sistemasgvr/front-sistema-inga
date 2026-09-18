"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { ConvenioItem } from "@/modules/convenios/types/convenios.types";
import { FormEvent, useEffect, useState } from "react";
import {
  REGLAS_DOCUMENTO,
  TIPO_DOCUMENTO,
  TIPO_PERSONA,
  type PersonaFormValues,
  type PersonaItem,
} from "../types/personas.types";

type PersonaFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: PersonaFormValues) => Promise<void>;
  persona: PersonaItem | null;
  convenios: ConvenioItem[];
  isSaving: boolean;
};

const VALORES_INICIALES: PersonaFormValues = {
  tipo_persona: TIPO_PERSONA.NATURAL,
  tipo_documento: TIPO_DOCUMENTO.DNI,
  num_documento: "",
  razon_social: "",
  nombres: "",
  apellido_paterno: "",
  apellido_materno: "",
  direccion: "",
  telefono: "",
  email: "",
  es_cliente: true,
  es_proveedor: false,
  id_convenio: null,
};

export function PersonaFormModal({
  isOpen,
  onClose,
  onSubmit,
  persona,
  convenios,
  isSaving,
}: PersonaFormModalProps) {
  const [values, setValues] = useState<PersonaFormValues>(VALORES_INICIALES);
  const [errors, setErrors] = useState<
    Partial<Record<keyof PersonaFormValues, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof PersonaFormValues, boolean>>
  >({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const esJuridica = values.tipo_persona === TIPO_PERSONA.JURIDICA;
  const reglaDoc = REGLAS_DOCUMENTO[values.tipo_documento];

  useEffect(() => {
    if (!isOpen) return;

    if (persona) {
      setValues({
        tipo_persona: persona.tipo_persona,
        tipo_documento: persona.tipo_documento,
        num_documento: persona.num_documento ?? "",
        razon_social: persona.razon_social ?? "",
        nombres: persona.nombres ?? "",
        apellido_paterno: persona.apellido_paterno ?? "",
        apellido_materno: persona.apellido_materno ?? "",
        direccion: persona.direccion ?? "",
        telefono: persona.telefono ?? "",
        email: persona.email ?? "",
        es_cliente: persona.es_cliente,
        es_proveedor: persona.es_proveedor,
        id_convenio: persona.id_convenio,
      });
    } else {
      setValues(VALORES_INICIALES);
    }

    setErrors({});
    setTouched({});
    setIsSubmitted(false);
    setServerError(null);
  }, [isOpen, persona]);

  /**
   * Al cambiar entre natural y jurídica ajusto el tipo de documento solo.
   *
   * Una empresa siempre va con RUC, así que lo fuerzo. Al volver a natural,
   * si había quedado el RUC lo devuelvo a DNI, que es lo normal. Si el usuario
   * ya había elegido carné de extranjería, se lo respeto.
   */
  function cambiarTipoPersona(tipo: number) {
    setServerError(null);
    setValues((p) => {
      if (tipo === TIPO_PERSONA.JURIDICA) {
        return { ...p, tipo_persona: tipo, tipo_documento: TIPO_DOCUMENTO.RUC };
      }
      return {
        ...p,
        tipo_persona: tipo,
        tipo_documento:
          p.tipo_documento === TIPO_DOCUMENTO.RUC
            ? TIPO_DOCUMENTO.DNI
            : p.tipo_documento,
      };
    });
  }

  /**
   * Si desmarco "Cliente", quito también el convenio.
   * El backend rechaza un convenio en alguien que no es cliente, así que
   * prefiero limpiarlo acá antes de que llegue a fallar.
   */
  function alternarRol(rol: "es_cliente" | "es_proveedor") {
    setServerError(null);
    setValues((p) => {
      const siguiente = { ...p, [rol]: !p[rol] };
      if (rol === "es_cliente" && !siguiente.es_cliente) {
        siguiente.id_convenio = null;
      }
      return siguiente;
    });
  }

  function validate(current: PersonaFormValues) {
    const next: Partial<Record<keyof PersonaFormValues, string>> = {};
    const regla = REGLAS_DOCUMENTO[current.tipo_documento];
    const doc = current.num_documento.trim();

    if (!doc) {
      next.num_documento = "El número de documento es obligatorio.";
    } else if (regla?.soloNumeros && !/^\d+$/.test(doc)) {
      next.num_documento = "Solo se admiten números.";
    } else if (regla?.longitud && doc.length !== regla.longitud) {
      next.num_documento = `El ${regla.etiqueta} debe tener ${regla.longitud} dígitos.`;
    } else if (!regla?.longitud && (doc.length < 8 || doc.length > 12)) {
      next.num_documento = "Debe tener entre 8 y 12 caracteres.";
    }

    if (current.tipo_persona === TIPO_PERSONA.JURIDICA) {
      if (!current.razon_social.trim()) {
        next.razon_social = "La razón social es obligatoria para una empresa.";
      }
    } else {
      if (!current.nombres.trim()) next.nombres = "Los nombres son obligatorios.";
      if (!current.apellido_paterno.trim()) {
        next.apellido_paterno = "El apellido paterno es obligatorio.";
      }
    }

    if (!current.es_cliente && !current.es_proveedor) {
      next.es_cliente = "Marca al menos un rol: cliente o proveedor.";
    }

    if (
      current.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current.email.trim())
    ) {
      next.email = "El correo no tiene un formato válido.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  useEffect(() => {
    if (isOpen) validate(values);
  }, [values, isOpen]);

  function showError(field: keyof PersonaFormValues): string | undefined {
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

  const opcionesDocumento = (
    esJuridica
      ? [TIPO_DOCUMENTO.RUC]
      : [TIPO_DOCUMENTO.DNI, TIPO_DOCUMENTO.CE, TIPO_DOCUMENTO.RUC]
  ).map((tipo) => ({
    value: String(tipo),
    label: REGLAS_DOCUMENTO[tipo].etiqueta,
  }));

  const opcionesConvenio = [
    { value: "", label: "Sin convenio" },
    ...convenios.map((c) => ({ value: String(c.id), label: c.nombre })),
  ];

  const longitudDoc = values.num_documento.trim().length;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={persona ? "Editar persona" : "Nueva persona"}
      subtitle="Clientes que consumen en el local y proveedores que nos venden insumos."
      isSaving={isSaving}
      maxWidth="max-w-[720px]"
    >
      {serverError && (
        <Alert variant="error" title="Error al guardar" message={serverError} />
      )}

      {/* Control segmentado: es la decisión que cambia todo el resto del
          formulario, así que va primero y bien visible, no escondido en un
          desplegable. */}
      <div>
        <Label>Tipo de persona</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              tipo: TIPO_PERSONA.NATURAL,
              icono: "mdi:account-outline",
              titulo: "Persona natural",
              detalle: "Con DNI o carné",
            },
            {
              tipo: TIPO_PERSONA.JURIDICA,
              icono: "mdi:domain",
              titulo: "Empresa",
              detalle: "Con RUC y razón social",
            },
          ].map((opcion) => {
            const activo = values.tipo_persona === opcion.tipo;
            return (
              <button
                key={opcion.tipo}
                type="button"
                onClick={() => cambiarTipoPersona(opcion.tipo)}
                disabled={isSaving}
                className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  activo
                    ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                }`}
              >
                <Icon
                  name={opcion.icono}
                  size={22}
                  className={
                    activo
                      ? "text-brand-500"
                      : "text-gray-400 dark:text-gray-500"
                  }
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-800 dark:text-white/90">
                    {opcion.titulo}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {opcion.detalle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="tipo_documento">Tipo de documento *</Label>
          <Select
            options={opcionesDocumento}
            defaultValue={String(values.tipo_documento)}
            onChange={(value) => {
              setServerError(null);
              setValues((p) => ({ ...p, tipo_documento: Number(value) }));
            }}
            disabled={isSaving || esJuridica}
            hint={esJuridica ? "Una empresa siempre se identifica con RUC." : undefined}
          />
        </div>

        <div>
          <Label htmlFor="num_documento">
            {reglaDoc?.etiqueta ?? "Documento"} *
          </Label>
          <Input
            id="num_documento"
            value={values.num_documento}
            onChange={(e) => {
              setServerError(null);
              // Recorto al vuelo a la longitud máxima y, si el documento es
              // numérico, filtro las letras. Así el usuario no puede llegar a
              // escribir algo inválido.
              const limpio = reglaDoc?.soloNumeros
                ? e.target.value.replace(/\D/g, "")
                : e.target.value;
              const recortado = reglaDoc?.longitud
                ? limpio.slice(0, reglaDoc.longitud)
                : limpio.slice(0, 12);
              setValues((p) => ({ ...p, num_documento: recortado }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, num_documento: true }))}
            placeholder={reglaDoc?.soloNumeros ? "45612345" : "AB1234567"}
            error={Boolean(showError("num_documento"))}
            hint={
              showError("num_documento") ??
              // Contador en vivo: da sensación de progreso y evita el clásico
              // "¿por qué no me deja guardar?" por un dígito de menos.
              (reglaDoc?.longitud
                ? `${longitudDoc}/${reglaDoc.longitud} dígitos`
                : reglaDoc?.ayuda)
            }
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Muestro los campos de nombre según el tipo elegido. No los oculto con
          CSS: los quito del árbol, para que nadie llene por accidente campos
          que después el backend va a ignorar. */}
      {esJuridica ? (
        <div>
          <Label htmlFor="razon_social">Razón social *</Label>
          <Input
            id="razon_social"
            value={values.razon_social}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, razon_social: e.target.value }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, razon_social: true }))}
            placeholder="Consorcio GVR S.A.C."
            error={Boolean(showError("razon_social"))}
            hint={showError("razon_social")}
            disabled={isSaving}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="nombres">Nombres *</Label>
            <Input
              id="nombres"
              value={values.nombres}
              onChange={(e) => {
                setServerError(null);
                setValues((p) => ({ ...p, nombres: e.target.value }));
              }}
              onBlur={() => setTouched((p) => ({ ...p, nombres: true }))}
              placeholder="Billy"
              error={Boolean(showError("nombres"))}
              hint={showError("nombres")}
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="apellido_paterno">Apellido paterno *</Label>
            <Input
              id="apellido_paterno"
              value={values.apellido_paterno}
              onChange={(e) => {
                setServerError(null);
                setValues((p) => ({ ...p, apellido_paterno: e.target.value }));
              }}
              onBlur={() => setTouched((p) => ({ ...p, apellido_paterno: true }))}
              placeholder="Reaño"
              error={Boolean(showError("apellido_paterno"))}
              hint={showError("apellido_paterno")}
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="apellido_materno">Apellido materno</Label>
            <Input
              id="apellido_materno"
              value={values.apellido_materno}
              onChange={(e) => {
                setServerError(null);
                setValues((p) => ({ ...p, apellido_materno: e.target.value }));
              }}
              placeholder="Vargas"
              disabled={isSaving}
            />
          </div>
        </div>
      )}

      {/* Los roles definen dónde aparece esta persona después: como proveedor
          en compras, como cliente en el cobro a crédito. Los pongo como
          tarjetas y no como checkboxes sueltos para poder explicar cada uno. */}
      <div>
        <Label>¿Qué es esta persona para el negocio? *</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              campo: "es_cliente" as const,
              icono: "mdi:silverware-fork-knife",
              titulo: "Cliente",
              detalle: "Consume en el local y se le puede cobrar a crédito",
            },
            {
              campo: "es_proveedor" as const,
              icono: "mdi:truck-outline",
              titulo: "Proveedor",
              detalle: "Nos vende insumos y se le registran compras",
            },
          ].map((opcion) => {
            const activo = values[opcion.campo];
            return (
              <button
                key={opcion.campo}
                type="button"
                onClick={() => alternarRol(opcion.campo)}
                disabled={isSaving}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  activo
                    ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    activo
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {activo && <Icon name="mdi:check" size={14} />}
                </span>
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-white/90">
                    <Icon name={opcion.icono} size={16} />
                    {opcion.titulo}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    {opcion.detalle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {showError("es_cliente") && (
          <p className="mt-1.5 text-xs text-error-500">{showError("es_cliente")}</p>
        )}
      </div>

      {/* El convenio solo aparece si la persona es cliente. Es la misma regla
          que valida la base, pero acá en vez de dar error simplemente no
          ofrezco la opción imposible. */}
      {values.es_cliente && (
        <div>
          <Label htmlFor="id_convenio">Convenio de crédito</Label>
          <Select
            options={opcionesConvenio}
            defaultValue={values.id_convenio ? String(values.id_convenio) : ""}
            placeholder="Sin convenio"
            onChange={(value) => {
              setServerError(null);
              setValues((p) => ({
                ...p,
                id_convenio: value ? Number(value) : null,
              }));
            }}
            disabled={isSaving}
            hint={
              convenios.length === 0
                ? "No hay convenios activos. Créalos en la pantalla de Convenios."
                : "Solo si su consumo se carga a una empresa del consorcio."
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            value={values.telefono}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, telefono: e.target.value }));
            }}
            placeholder="987654321"
            disabled={isSaving}
          />
        </div>
        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, email: e.target.value }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, email: true }))}
            placeholder="correo@empresa.pe"
            error={Boolean(showError("email"))}
            hint={showError("email")}
            disabled={isSaving}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          value={values.direccion}
          onChange={(e) => {
            setServerError(null);
            setValues((p) => ({ ...p, direccion: e.target.value }));
          }}
          placeholder="Av. Principal 123"
          disabled={isSaving}
        />
      </div>
    </FormModal>
  );
}
