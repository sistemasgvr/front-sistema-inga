"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { getTurnoAbierto } from "@/modules/caja/services/caja.service";
import type { TurnoItem } from "@/modules/caja/types/caja.types";
import {
  anularGasto,
  getReporteMensual,
  listCategorias,
  listGastos,
  registrarGasto,
  updateGasto,
} from "../services/gastos.service";
import type {
  CategoriaGasto,
  GastoFormValues,
  GastoItem,
  GastosResumen,
  ReporteMensual,
} from "../types/gastos.types";

const PAGE_SIZE = 10;

/**
 * Pantalla principal de gastos administrativos.
 *
 * Trabaja siempre sobre un mes: el cliente revisa estos gastos al cerrar el
 * mes, no día a día. Por eso el período manda sobre todo lo demás.
 *
 * Carga el turno de caja abierto porque un gasto en efectivo debe registrarse
 * contra un turno — es la regla que conecta este módulo con el cuadre (M08).
 */
export function useGastos() {
  const hoy = new Date();

  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [tipoFiltro, setTipoFiltro] = useState<number | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null);

  const [registros, setRegistros] = useState<GastoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [resumen, setResumen] = useState<GastosResumen>({
    monto_total: 0,
    fijos: 0,
    variables: 0,
    efectivo: 0,
    yape: 0,
    tarjeta: 0,
    cantidad: 0,
  });

  const [reporte, setReporte] = useState<ReporteMensual | null>(null);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [turnoAbierto, setTurnoAbierto] = useState<TurnoItem | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [editing, setEditing] = useState<GastoItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [confirmGasto, setConfirmGasto] = useState<GastoItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAnulando, setIsAnulando] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [lista, rep] = await Promise.all([
        listGastos({
          buscar: debouncedSearch.trim(),
          pagina,
          limite: pageSize,
          anio,
          mes,
          tipo_gasto: tipoFiltro ?? undefined,
          id_categoria: categoriaFiltro ?? undefined,
        }),
        getReporteMensual(anio, mes),
      ]);

      setRegistros(lista.registros);
      setTotal(lista.total);
      if (lista.resumen) setResumen(lista.resumen);
      setReporte(rep);
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al cargar",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron obtener los gastos.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, anio, mes, tipoFiltro, categoriaFiltro]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    listCategorias(undefined, "activos")
      .then((r) => setCategorias(r.registros))
      .catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    // Si falla no rompo la pantalla: el modal avisa que no hay turno abierto y
    // solo permite Yape o transferencia.
    getTurnoAbierto(user.id)
      .then(setTurnoAbierto)
      .catch(() => setTurnoAbierto(null));
  }, []);

  function cambiarPeriodo(nuevoAnio: number, nuevoMes: number) {
    setAnio(nuevoAnio);
    setMes(nuevoMes);
    setPagina(1);
  }

  function filtrarPorTipo(tipo: number | null) {
    setTipoFiltro(tipo);
    setPagina(1);
  }

  function filtrarPorCategoria(id: number | null) {
    setCategoriaFiltro(id);
    setPagina(1);
  }

  function openCreateModal() {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEditModal(item: GastoItem) {
    setEditing(item);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditing(null);
  }

  async function save(values: GastoFormValues) {
    setIsSaving(true);
    try {
      if (editing) {
        await updateGasto(editing.id, values);
        setFeedback({
          variant: "success",
          title: "Actualizado",
          message: `'${values.concepto}' se actualizó con éxito.`,
        });
      } else {
        await registrarGasto(values);
        setFeedback({
          variant: "success",
          title: "Gasto registrado",
          message: `'${values.concepto}' quedó registrado.`,
        });
      }
      closeFormModal();
      await load();

      // Refresco el turno: si el gasto fue en efectivo, el efectivo esperado
      // del cajón acaba de cambiar.
      const user = getStoredUser();
      if (user) {
        getTurnoAbierto(user.id)
          .then(setTurnoAbierto)
          .catch(() => undefined);
      }
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al guardar",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  function abrirConfirmAnular(gasto: GastoItem) {
    setConfirmGasto(gasto);
    setIsConfirmOpen(true);
  }

  function cerrarConfirmAnular() {
    setIsConfirmOpen(false);
    setConfirmGasto(null);
  }

  async function confirmarAnular() {
    if (!confirmGasto) return;
    setIsAnulando(true);
    try {
      await anularGasto(confirmGasto.id);
      cerrarConfirmAnular();
      setFeedback({
        variant: "success",
        title: "Gasto anulado",
        message: `Se anuló '${confirmGasto.concepto}'.`,
      });
      await load();
    } catch (error) {
      // El rechazo típico: "el turno de caja ya está cerrado y arqueado".
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    anio,
    mes,
    cambiarPeriodo,
    tipoFiltro,
    filtrarPorTipo,
    categoriaFiltro,
    filtrarPorCategoria,
    registros,
    total,
    pagina,
    setPagina,
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPagina(1);
    },
    totalPages,
    searchInput,
    setSearchInput,
    resumen,
    reporte,
    categorias,
    turnoAbierto,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    editing,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    save,
    confirmGasto,
    isConfirmOpen,
    isAnulando,
    abrirConfirmAnular,
    cerrarConfirmAnular,
    confirmarAnular,
  };
}
