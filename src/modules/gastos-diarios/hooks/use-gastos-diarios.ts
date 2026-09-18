"use client";

import { useEffect, useState } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { getTurnoAbierto } from "@/modules/caja/services/caja.service";
import type { TurnoItem } from "@/modules/caja/types/caja.types";
import { buscarPersonas } from "@/modules/personas/services/personas.service";
import type { PersonaBusquedaItem } from "@/modules/personas/types/personas.types";
import { getUnidadesMedida } from "@/modules/productos/services/productos.service";
import type { UnidadMedidaItem } from "@/modules/productos/types/productos.types";
import {
  abrirDia,
  agregarLinea,
  anularLinea,
  createInsumo,
  getReporteDia,
  listInsumos,
} from "../services/gdo.service";
import type {
  CategoriaInsumos,
  DiaConDetalle,
  InsumoFormValues,
  LineaFormValues,
  LineaGasto,
  ReporteDia,
} from "../types/gdo.types";
import { hoyISO } from "../utils/formato";

/**
 * Pantalla de registro del gasto diario.
 *
 * El flujo es: el cajero entra, el día se abre solo, y va agregando compras.
 * Por eso no hay un paso de "crear el día" — `abrirDia` es idempotente.
 *
 * Carga de otros módulos:
 *   - el turno de caja abierto (M08), porque las compras en efectivo salen del
 *     cajón y el día necesita quedar vinculado al turno
 *   - los proveedores del maestro de personas (M05), para las compras a crédito
 *   - las unidades de medida, que se eligen por línea y no vienen del insumo
 */
export function useGastosDiarios() {
  const [fecha, setFecha] = useState(hoyISO());

  const [dia, setDia] = useState<DiaConDetalle | null>(null);
  const [reporte, setReporte] = useState<ReporteDia | null>(null);

  const [categorias, setCategorias] = useState<CategoriaInsumos[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedidaItem[]>([]);
  const [proveedores, setProveedores] = useState<PersonaBusquedaItem[]>([]);
  const [turnoAbierto, setTurnoAbierto] = useState<TurnoItem | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [isLineaOpen, setIsLineaOpen] = useState(false);
  const [isInsumoOpen, setIsInsumoOpen] = useState(false);

  const [confirmLinea, setConfirmLinea] = useState<LineaGasto | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAnulando, setIsAnulando] = useState(false);

  /**
   * Abre el día y trae su reporte.
   *
   * La dejo como función normal, sin `useCallback`: este hook maneja bastante
   * estado y el React Compiler no logra preservar la memoización manual en esos
   * casos. Sin `useCallback` el compilador memoiza solo.
   */
  async function cargarDia(fechaObjetivo: string, idTurno?: number | null) {
    setIsLoading(true);
    try {
      const [diaCargado, rep] = await Promise.all([
        abrirDia(fechaObjetivo, undefined, idTurno ?? undefined),
        getReporteDia(fechaObjetivo),
      ]);
      setDia(diaCargado);
      setReporte(rep);
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al cargar",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo abrir el gasto del día.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Cargo primero el turno, y recién después el día: el día necesita quedar
  // vinculado al turno para poder registrar compras en efectivo.
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      void cargarDia(fecha);
      return;
    }

    getTurnoAbierto(user.id)
      .then((t) => {
        setTurnoAbierto(t);
        void cargarDia(fecha, t?.id);
      })
      .catch(() => {
        setTurnoAbierto(null);
        void cargarDia(fecha);
      });
  }, [fecha]);

  async function recargarInsumos() {
    try {
      const result = await listInsumos("", undefined, "activos");
      setCategorias(result.registros);
    } catch {
      setCategorias([]);
    }
  }

  useEffect(() => {
    void recargarInsumos();
  }, []);

  useEffect(() => {
    getUnidadesMedida()
      .then((r) => setUnidades(r.unidades))
      .catch(() => setUnidades([]));
  }, []);

  useEffect(() => {
    buscarPersonas("", "proveedores", 50)
      .then(setProveedores)
      .catch(() => setProveedores([]));
  }, []);

  function cambiarFecha(nuevaFecha: string) {
    setFecha(nuevaFecha);
  }

  /** Refresca el turno: si la compra fue en efectivo, el cajón cambió. */
  function refrescarTurno() {
    const user = getStoredUser();
    if (!user) return;
    getTurnoAbierto(user.id)
      .then(setTurnoAbierto)
      .catch(() => undefined);
  }

  async function guardarLinea(values: LineaFormValues) {
    if (!dia) return;
    setIsSaving(true);
    try {
      const actualizado = await agregarLinea(dia.dia.id, values);
      setDia(actualizado);
      setReporte(await getReporteDia(fecha));
      setIsLineaOpen(false);
      setFeedback({
        variant: "success",
        title: "Compra registrada",
        message:
          values.forma_pago === 3
            ? "Se registró la compra y la deuda quedó cargada al proveedor."
            : "La compra quedó registrada en el día.",
      });
      // La lista de insumos guarda el último precio pagado: la recargo para que
      // la próxima compra sugiera el precio real.
      void recargarInsumos();
      refrescarTurno();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo registrar la compra",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Crea un insumo desde el formulario de compra.
   * Recarga la lista para que quede disponible inmediatamente en el selector.
   */
  async function guardarInsumo(values: InsumoFormValues) {
    setIsSaving(true);
    try {
      await createInsumo(values);
      await recargarInsumos();
      setIsInsumoOpen(false);
      setFeedback({
        variant: "success",
        title: "Insumo creado",
        message: `'${values.nombre}' ya está disponible para registrar.`,
      });
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo crear el insumo",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  function abrirConfirmAnular(linea: LineaGasto) {
    setConfirmLinea(linea);
    setIsConfirmOpen(true);
  }

  function cerrarConfirmAnular() {
    setIsConfirmOpen(false);
    setConfirmLinea(null);
  }

  async function confirmarAnular() {
    if (!confirmLinea) return;
    setIsAnulando(true);
    try {
      const actualizado = await anularLinea(confirmLinea.id);
      setDia(actualizado);
      setReporte(await getReporteDia(fecha));
      cerrarConfirmAnular();
      setFeedback({
        variant: "success",
        title: "Compra anulada",
        message:
          confirmLinea.forma_pago === 3
            ? "Se anuló la compra y se revirtió la deuda del proveedor."
            : "La compra quedó anulada.",
      });
      refrescarTurno();
    } catch (error) {
      // Rechazos típicos: el turno ya se cerró, o en CxP ya hubo movimientos
      // posteriores del mismo proveedor y el reverso no es posible.
      cerrarConfirmAnular();
      setFeedback({
        variant: "error",
        title: "No se pudo anular",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setIsAnulando(false);
    }
  }

  return {
    fecha,
    cambiarFecha,
    dia,
    reporte,
    categorias,
    unidades,
    proveedores,
    turnoAbierto,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    isLineaOpen,
    abrirLinea: () => setIsLineaOpen(true),
    cerrarLinea: () => setIsLineaOpen(false),
    guardarLinea,
    isInsumoOpen,
    abrirInsumo: () => setIsInsumoOpen(true),
    cerrarInsumo: () => setIsInsumoOpen(false),
    guardarInsumo,
    confirmLinea,
    isConfirmOpen,
    isAnulando,
    abrirConfirmAnular,
    cerrarConfirmAnular,
    confirmarAnular,
  };
}
