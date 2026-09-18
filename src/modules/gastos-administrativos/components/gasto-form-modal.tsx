"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Icon } from "@/components/ui/icon";
import { FormModal } from "@/components/ui/modal/FormModal";
import type { TurnoItem } from "@/modules/caja/types/caja.types";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  MEDIO_PAGO,
  MEDIOS_PAGO_GASTO,
  type CategoriaGasto,
  type GastoFormValues,
  type GastoItem,
} from "../types/gastos.types";
import { formatearSoles, hoyISO } from "../utils/formato";

type GastoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: GastoFormValues) => Promise<void>;
  gasto: GastoItem | null;
  categorias: CategoriaGasto[];
  turnoAbierto: TurnoItem | null;
  isSaving: boolean;
};

/**
 * Alta y edición de un gasto administrativo.
 *
 * El cliente pidió que fuera simple: "solo clasificar el gasto e ingresar el
 * monto". Así que solo categoría, concepto y monto son obligatorios; el resto
 * está a mano pero no estorba.
 *
 * El selector de categoría aplana el árbol con sangría para que se vea la
 * jerarquía ("Servicios básicos" → "· Luz") sin necesitar un componente de
 * árbol dentro de un modal.
 */
export function GastoFormModal({
  isOpen,
  onClose,
  onSubmit,
  gasto,
  categorias,
  turnoAbierto,
  isSaving,
}: GastoFormModalProps) {
  const [values, setValues] = useState<GastoFormValues>({
    id_categoria: null,
    concepto: "",
    monto: 0,
    fecha_gasto: hoyISO(),
    medio_pago: MEDIO_PAGO.EFECTIVO,
    id_turno: null,
    num_comprobante: "",
    observacion: "",
  });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const hayTurno = Boolean(turnoAbierto);

  useEffect(() => {
    if (!isOpen) return;

    if (gasto) {
      setValues({
        id_categoria: gasto.id_categoria,
        concepto: gasto.concepto,
        monto: Number(gasto.monto) || 0,
        fecha_gasto: gasto.fecha_gasto?.slice(0, 10) ?? hoyISO(),
        medio_pago: gasto.medio_pago,
        id_turno: gasto.id_turno,
        num_comprobante: gasto.num_comprobante ?? "",
        observacion: gasto.observacion ?? "",
      });
    } else {
      setValues({
        id_categoria: null,
        concepto: "",
        monto: 0,
        fecha_gasto: hoyISO(),
        // Sin turno abierto el efectivo no es viable: arranco en Yape.
        medio_pago: hayTurno ? MEDIO_PAGO.EFECTIVO : MEDIO_PAGO.YAPE,
        id_turno: turnoAbierto?.id ?? null,
        num_comprobante: "",
        observacion: "",
      });
    }

    setIntentoEnviar(false);
    setServerError(null);
  }, [isOpen, gasto, turnoAbierto, hayTurno]);

  /**
   * Aplano el árbol para el selector: primero la raíz, después sus hijas con
   * un prefijo que marca la sangría. Un `<select>` no admite anidación real.
   */
  const opcionesCategoria = useMemo(() => {
    const opciones: { value: string; label: string }[] = [];
    categorias.forEach((raiz) => {
      const sufijo = raiz.tipo_gasto === 1 ? "Fijo" : "Variable";
      opciones.push({
        value: String(raiz.id),
        label: `${raiz.nombre}  (${sufijo})`,
      });
      (raiz.subcategorias ?? []).forEach((hija) => {
        opciones.push({
          value: String(hija.id),
          label: `　· ${hija.nombre}`,
        });
      });
    });
    return opciones;
  }, [categorias]);

  const esEfectivo = values.medio_pago === MEDIO_PAGO.EFECTIVO;

  const errorCategoria =
    intentoEnviar && !values.id_categoria ? "Selecciona una categoría." : undefined;
  const errorConcepto =
    intentoEnviar && !values.concepto.trim()
      ? "El concepto es obligatorio."
      : undefined;
  const errorMonto =
    intentoEnviar && values.monto <= 0
      ? "El monto debe ser mayor a cero."
      : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setIntentoEnviar(true);
    setServerError(null);

    if (!values.id_categoria || !values.concepto.trim() || values.monto <= 0) {
      return;
    }

    try {
      await onSubmit({
        ...values,
        // El turno solo viaja si el gasto sale del cajón.
        id_turno: esEfectivo ? (turnoAbierto?.id ?? values.id_turno) : null,
      });
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "No se pudo guardar el gasto.",
      );
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={gasto ? "Editar gasto" : "Nuevo gasto administrativo"}
      subtitle="Gastos que no son de cocina: alquiler, servicios, mantenimiento, oficina."
      isSaving={isSaving}
    >
      {serverError && (
        <Alert variant="error" title="Error al guardar" message={serverError} />
      )}

      {!hayTurno && !gasto && (
        <Alert
          variant="warning"
          title="Sin turno de caja abierto"
          message="No puedes pagar en efectivo porque el egreso no tendría contra qué cuadrar. Abre un turno en Caja, o registra el gasto por Yape o transferencia."
        />
      )}

      <div>
        <Label htmlFor="id_categoria">Categoría *</Label>
        <Select
          options={opcionesCategoria}
          defaultValue={values.id_categoria ? String(values.id_categoria) : ""}
          placeholder="Selecciona la categoría"
          onChange={(value) => {
            setServerError(null);
            setValues((p) => ({ ...p, id_categoria: Number(value) }));
          }}
          disabled={isSaving}
          error={Boolean(errorCategoria)}
          hint={
            errorCategoria ??
            (categorias.length === 0
              ? "No hay categorías activas. Créalas en Categorías de gasto."
              : undefined)
          }
        />
      </div>

      <div>
        <Label htmlFor="concepto">Concepto *</Label>
        <Input
          id="concepto"
          value={values.concepto}
          onChange={(e) => {
            setServerError(null);
            setValues((p) => ({ ...p, concepto: e.target.value }));
          }}
          placeholder="Recibo de luz - septiembre"
          error={Boolean(errorConcepto)}
          hint={
            errorConcepto ??
            "Sé específico: al revisar el mes, esto es lo que explica el gasto."
          }
          disabled={isSaving}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="monto">Monto (S/) *</Label>
          <Input
            id="monto"
            type="number"
            step={0.01}
            min="0"
            value={values.monto || ""}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, monto: Number(e.target.value) || 0 }));
            }}
            placeholder="0.00"
            error={Boolean(errorMonto)}
            hint={errorMonto}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor="fecha_gasto">Fecha del gasto *</Label>
          <Input
            id="fecha_gasto"
            type="date"
            value={values.fecha_gasto}
            max={hoyISO()}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, fecha_gasto: e.target.value }));
            }}
            disabled={isSaving}
            hint="Define en qué mes entra al reporte."
          />
        </div>
      </div>

      <div>
        <Label>Medio de pago *</Label>
        <div className="grid grid-cols-3 gap-2.5">
          {MEDIOS_PAGO_GASTO.map((opcion) => {
            const activo = values.medio_pago === opcion.valor;
            // Al editar no bloqueo el efectivo: el gasto ya tiene su turno.
            const bloqueado =
              opcion.valor === MEDIO_PAGO.EFECTIVO && !hayTurno && !gasto;

            return (
              <button
                key={opcion.valor}
                type="button"
                disabled={isSaving || bloqueado}
                onClick={() => {
                  setServerError(null);
                  setValues((p) => ({ ...p, medio_pago: opcion.valor }));
                }}
                title={
                  bloqueado
                    ? "Necesitas un turno de caja abierto para pagar en efectivo"
                    : undefined
                }
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors ${
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="num_comprobante">N° de comprobante</Label>
          <Input
            id="num_comprobante"
            value={values.num_comprobante}
            onChange={(e) => {
              setServerError(null);
              setValues((p) => ({ ...p, num_comprobante: e.target.value }));
            }}
            placeholder="F001-00123"
            hint="Opcional."
            disabled={isSaving}
          />
        </div>

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
      </div>
    </FormModal>
  );
}
