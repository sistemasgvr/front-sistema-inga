"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { TurnoItem } from "@/modules/caja/types/caja.types";
import type { PersonaBusquedaItem } from "@/modules/personas/types/personas.types";
import type { UnidadMedidaItem } from "@/modules/productos/types/productos.types";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FORMA_PAGO,
  FORMAS_PAGO,
  type CategoriaInsumos,
  type InsumoItem,
  type LineaFormValues,
} from "../types/gdo.types";
import { formatearSoles } from "../utils/formato";

type LineaFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: LineaFormValues) => Promise<void>;
  categorias: CategoriaInsumos[];
  unidades: UnidadMedidaItem[];
  proveedores: PersonaBusquedaItem[];
  turnoAbierto: TurnoItem | null;
  /** Abre el modal de crear insumo sin cerrar este. */
  onCrearInsumo: () => void;
  isSaving: boolean;
};

const VALORES_INICIALES: LineaFormValues = {
  id_insumo: null,
  cantidad: 1,
  precio_unitario: 0,
  forma_pago: FORMA_PAGO.EFECTIVO,
  id_unidad_medida: null,
  id_proveedor: null,
  observacion: "",
};

/**
 * Registra una compra del día. Es el formulario que más se usa del módulo:
 * el cajero lo abre muchas veces por jornada, así que está pensado para ser
 * rápido.
 *
 * Cuatro decisiones de UX:
 *
 * 1. **Al elegir el insumo se autocompleta el precio** con el último pagado y,
 *    si tiene proveedor habitual, también ese. El cajero solo confirma.
 *
 * 2. **El subtotal se calcula en vivo.** Es lo que va al cuadre del día y debe
 *    verse antes de guardar, no después.
 *
 * 3. **La forma de pago son tres botones con su consecuencia escrita**
 *    ("sale del cajón", "genera deuda al proveedor"). Es la decisión que más
 *    impacto tiene y conviene que sea imposible equivocarse.
 *
 * 4. **"No está en la lista" abre el alta de insumo** sin perder lo escrito.
 *    Es el requisito del alcance de crear productos al vuelo.
 */
export function LineaFormModal({
  isOpen,
  onClose,
  onSubmit,
  categorias,
  unidades,
  proveedores,
  turnoAbierto,
  onCrearInsumo,
  isSaving,
}: LineaFormModalProps) {
  const [values, setValues] = useState<LineaFormValues>(VALORES_INICIALES);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const hayTurno = Boolean(turnoAbierto);
  const turnoCerrado = turnoAbierto?.estado_turno === 2;
  const puedeEfectivo = hayTurno && !turnoCerrado;

  useEffect(() => {
    if (!isOpen) return;
    setValues({
      ...VALORES_INICIALES,
      // Sin turno el efectivo no es viable: arranco en Yape.
      forma_pago: puedeEfectivo ? FORMA_PAGO.EFECTIVO : FORMA_PAGO.YAPE,
    });
    setIntentoEnviar(false);
    setServerError(null);
  }, [isOpen, puedeEfectivo]);

  /** Aplano el árbol para el selector, con la categoría como prefijo. */
  const opcionesInsumo = useMemo(() => {
    const opciones: { value: string; label: string }[] = [];
    categorias.forEach((cat) => {
      cat.insumos.forEach((ins) => {
        opciones.push({
          value: String(ins.id),
          label: `${ins.nombre}  ·  ${cat.nombre}`,
        });
      });
    });
    return opciones;
  }, [categorias]);

  const insumoElegido: InsumoItem | null = useMemo(() => {
    for (const cat of categorias) {
      const encontrado = cat.insumos.find((i) => i.id === values.id_insumo);
      if (encontrado) return encontrado;
    }
    return null;
  }, [categorias, values.id_insumo]);

  /**
   * Al elegir insumo, autocompleto precio y proveedor habitual.
   * No piso un precio ya escrito: el precio real puede diferir del referencial.
   */
  function elegirInsumo(id: number) {
    setServerError(null);
    let encontrado: InsumoItem | null = null;
    for (const cat of categorias) {
      const i = cat.insumos.find((x) => x.id === id);
      if (i) {
        encontrado = i;
        break;
      }
    }

    setValues((p) => ({
      ...p,
      id_insumo: id,
      precio_unitario:
        p.precio_unitario > 0
          ? p.precio_unitario
          : Number(encontrado?.precio_referencial) || 0,
      id_proveedor: p.id_proveedor ?? encontrado?.id_proveedor_habitual ?? null,
    }));
  }

  const subtotal = values.cantidad * values.precio_unitario;
  const esCredito = values.forma_pago === FORMA_PAGO.CREDITO;
  const esEfectivo = values.forma_pago === FORMA_PAGO.EFECTIVO;

  const errorInsumo =
    intentoEnviar && !values.id_insumo ? "Selecciona el insumo." : undefined;
  const errorCantidad =
    intentoEnviar && values.cantidad <= 0
      ? "La cantidad debe ser mayor a cero."
      : undefined;
  const errorProveedor =
    intentoEnviar && esCredito && !values.id_proveedor
      ? "Una compra a crédito debe indicar a qué proveedor se le debe."
      : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);
    setServerError(null);

    if (!values.id_insumo || values.cantidad <= 0) return;
    if (esCredito && !values.id_proveedor) return;

    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "No se pudo registrar la compra.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Registrar compra del día"
      subtitle="Insumos comprados hoy para la operación de cocina."
      isSaving={isSaving}
      submitText="Agregar al día"
    >
      {serverError && (
        <Alert variant="error" title="Error" message={serverError} />
      )}

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="id_insumo">Insumo *</Label>
          <button
            type="button"
            onClick={onCrearInsumo}
            disabled={isSaving}
            className="mb-1.5 flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            <Icon name="mdi:plus-circle-outline" size={14} />
            No está en la lista
          </button>
        </div>
        <Select
          options={opcionesInsumo}
          defaultValue={values.id_insumo ? String(values.id_insumo) : ""}
          placeholder="Busca el insumo..."
          onChange={(value) => elegirInsumo(Number(value))}
          disabled={isSaving}
          error={Boolean(errorInsumo)}
          hint={
            errorInsumo ??
            (opcionesInsumo.length === 0
              ? "La lista está vacía. Créalos desde el enlace de arriba."
              : undefined)
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="cantidad">Cantidad *</Label>
          <Input
            id="cantidad"
            type="number"
            step={0.01}
            min="0"
            value={values.cantidad || ""}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, cantidad: Number(e.target.value) || 0 }));
            }}
            error={Boolean(errorCantidad)}
            hint={errorCantidad}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="id_unidad_medida">Unidad</Label>
          <Select
            options={unidades.map((u) => ({
              value: String(u.id),
              label: u.simbolo ? `${u.nombre} (${u.simbolo})` : u.nombre,
            }))}
            defaultValue={
              values.id_unidad_medida ? String(values.id_unidad_medida) : ""
            }
            placeholder="Elige la unidad"
            onChange={(value) => {
              setServerError(null);
              setValues((p) => ({
                ...p,
                id_unidad_medida: value ? Number(value) : null,
              }));
            }}
            disabled={isSaving}
            // El alcance es explícito: el insumo no tiene unidad fija, se
            // define en cada compra. Lo digo acá para que no extrañe.
            hint="Se elige en cada compra: el mismo insumo varía."
          />
        </div>

        <div>
          <Label htmlFor="precio_unitario">Precio unitario (S/) *</Label>
          <Input
            id="precio_unitario"
            type="number"
            step={0.01}
            min="0"
            value={values.precio_unitario || ""}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({
                ...p,
                precio_unitario: Number(e.target.value) || 0,
              }));
            }}
            placeholder="0.00"
            hint={
              insumoElegido && Number(insumoElegido.precio_referencial) > 0
                ? `Último: ${formatearSoles(insumoElegido.precio_referencial)}`
                : undefined
            }
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Subtotal en vivo: es lo que va al cuadre del día. */}
      {subtotal > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-500/30 dark:bg-brand-500/10">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
            Subtotal de esta compra
          </span>
          <span className="text-xl font-bold text-brand-700 dark:text-brand-300">
            {formatearSoles(subtotal)}
          </span>
        </div>
      )}

      <div>
        <Label>¿Cómo se pagó? *</Label>
        <div className="grid grid-cols-3 gap-2.5">
          {FORMAS_PAGO.map((opcion) => {
            const activo = values.forma_pago === opcion.valor;
            const bloqueado =
              opcion.valor === FORMA_PAGO.EFECTIVO && !puedeEfectivo;

            return (
              <button
                key={opcion.valor}
                type="button"
                disabled={isSaving || bloqueado}
                onClick={() => {
                  setServerError(null);
                  setValues((p) => ({ ...p, forma_pago: opcion.valor }));
                }}
                title={
                  bloqueado
                    ? "Necesitas un turno de caja abierto para pagar en efectivo"
                    : undefined
                }
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors ${
                  activo
                    ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <Icon
                  name={opcion.icono}
                  size={20}
                  className={activo ? "text-brand-500" : "text-gray-400"}
                />
                <span className="text-xs font-semibold text-gray-800 dark:text-white/90">
                  {opcion.etiqueta}
                </span>
                <span className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                  {opcion.detalle}
                </span>
              </button>
            );
          })}
        </div>

        {esEfectivo && turnoAbierto && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Icon name="mdi:cash-register" size={14} />
            Sale del cajón de{" "}
            <span className="font-semibold">{turnoAbierto.nombre_caja}</span> ·
            disponible {formatearSoles(turnoAbierto.efectivo_esperado ?? 0)}
          </p>
        )}
      </div>

      {/* El proveedor solo aparece cuando la compra es a crédito: es la misma
          regla que valida el backend, pero acá simplemente no ofrezco la
          opción imposible. */}
      {esCredito && (
        <div>
          <Label htmlFor="id_proveedor">Proveedor *</Label>
          <Select
            options={proveedores.map((p) => ({
              value: String(p.id),
              label: p.nombre_completo ?? `Proveedor ${p.id}`,
            }))}
            defaultValue={values.id_proveedor ? String(values.id_proveedor) : ""}
            placeholder="¿A quién se le debe?"
            onChange={(value) => {
              setServerError(null);
              setValues((p) => ({ ...p, id_proveedor: Number(value) }));
            }}
            disabled={isSaving}
            error={Boolean(errorProveedor)}
            hint={
              errorProveedor ??
              (proveedores.length === 0
                ? "No hay proveedores. Regístralos en Personas y márcalos como proveedor."
                : "Se generará la deuda automáticamente en Cuentas por Pagar.")
            }
          />
        </div>
      )}

      <div>
        <Label htmlFor="observacion">Observación</Label>
        <Input
          id="observacion"
          value={values.observacion}
          onChange={(e) => {
            setServerError(null);
            setValues((p) => ({ ...p, observacion: e.target.value }));
          }}
          placeholder="Opcional"
          disabled={isSaving}
        />
      </div>
    </FormModal>
  );
}
