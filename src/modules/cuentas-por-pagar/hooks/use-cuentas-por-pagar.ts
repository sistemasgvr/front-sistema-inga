"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { getTurnoAbierto } from "@/modules/caja/services/caja.service";
import type { TurnoItem } from "@/modules/caja/types/caja.types";
import { buscarPersonas } from "@/modules/personas/services/personas.service";
import type { PersonaBusquedaItem } from "@/modules/personas/types/personas.types";
import {
  anularMovimiento,
  getEstadoCuenta,
  getReportePeriodo,
  listSaldos,
  registrarAbono,
  registrarCargo,
} from "../services/cxp.service";
import type {
  AbonoFormValues,
  CargoFormValues,
  EstadoCuenta,
  MovimientoCxp,
  ReporteCxp,
  SaldoProveedor,
  SaldosResumen,
} from "../types/cxp.types";

const PAGE_SIZE = 10;

/**
 * Pantalla principal de cuentas por pagar.
 *
 * Muestra el saldo de cada proveedor y permite registrar el abono semanal.
 *
 * Carga dos cosas de otros módulos:
 *   - el turno de caja abierto, porque un abono en efectivo debe registrarse
 *     contra un turno (regla compartida con M16 y M17)
 *   - la lista de proveedores desde M05, para poder registrar un cargo a
 *     alguien que todavía no tiene movimientos y por lo tanto no aparece
 *     en la tabla de saldos
 */
export function useCuentasPorPagar() {
  const hoy = new Date();

  const [registros, setRegistros] = useState<SaldoProveedor[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [soloConDeuda, setSoloConDeuda] = useState(false);

  const [resumen, setResumen] = useState<SaldosResumen>({
    deuda_total: 0,
    proveedores_con_deuda: 0,
    proveedores_total: 0,
  });

  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [reporte, setReporte] = useState<ReporteCxp | null>(null);

  const [turnoAbierto, setTurnoAbierto] = useState<TurnoItem | null>(null);
  const [proveedores, setProveedores] = useState<PersonaBusquedaItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const [isAbonoOpen, setIsAbonoOpen] = useState(false);
  const [isCargoOpen, setIsCargoOpen] = useState(false);
  /** Proveedor preseleccionado al abrir un modal desde su fila. */
  const [proveedorElegido, setProveedorElegido] = useState<SaldoProveedor | null>(
    null,
  );

  const [estadoCuenta, setEstadoCuenta] = useState<EstadoCuenta | null>(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);

  const [confirmMov, setConfirmMov] = useState<MovimientoCxp | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAnulando, setIsAnulando] = useState(false);

  /**
   * Carga los saldos y el reporte del período.
   *
   * La dejo como función normal, sin `useCallback`. Este hook maneja bastante
   * estado y el React Compiler no lograba preservar la memoización manual
   * (inferia los setters como dependencias y abandonaba la optimización del
   * componente entero). Sin `useCallback` el compilador memoiza solo, y el
   * efecto de abajo se dispara con los mismos valores que antes.
   */
  async function load() {
    setIsLoading(true);
    try {
      const [lista, rep] = await Promise.all([
        listSaldos({
          buscar: debouncedSearch.trim(),
          pagina,
          limite: pageSize,
          solo_con_deuda: soloConDeuda,
        }),
        getReportePeriodo(anio, mes),
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
            : "No se pudieron obtener las cuentas por pagar.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // Dependo de los valores primitivos y no de `load`, que ahora se recrea en
    // cada render. El efecto se dispara exactamente en los mismos casos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, pagina, pageSize, soloConDeuda, anio, mes]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    getTurnoAbierto(user.id)
      .then(setTurnoAbierto)
      .catch(() => setTurnoAbierto(null));
  }, []);

  useEffect(() => {
    // Traigo los proveedores del maestro de personas (M05). Hace falta para
    // registrar un cargo a alguien que aún no tiene movimientos y por eso no
    // sale en la tabla de saldos.
    buscarPersonas("", "proveedores", 50)
      .then(setProveedores)
      .catch(() => setProveedores([]));
  }, []);

  function cambiarPeriodo(nuevoAnio: number, nuevoMes: number) {
    setAnio(nuevoAnio);
    setMes(nuevoMes);
  }

  function alternarSoloConDeuda() {
    setSoloConDeuda((p) => !p);
    setPagina(1);
  }

  function abrirAbono(proveedor?: SaldoProveedor) {
    setProveedorElegido(proveedor ?? null);
    setIsAbonoOpen(true);
  }

  function abrirCargo(proveedor?: SaldoProveedor) {
    setProveedorElegido(proveedor ?? null);
    setIsCargoOpen(true);
  }

  function cerrarModales() {
    setIsAbonoOpen(false);
    setIsCargoOpen(false);
    setProveedorElegido(null);
  }

  /** Refresca el turno: si el abono fue en efectivo, el cajón acaba de cambiar. */
  function refrescarTurno() {
    const user = getStoredUser();
    if (!user) return;
    getTurnoAbierto(user.id)
      .then(setTurnoAbierto)
      .catch(() => undefined);
  }

  async function guardarAbono(values: AbonoFormValues) {
    setIsSaving(true);
    try {
      await registrarAbono(values);
      cerrarModales();
      setFeedback({
        variant: "success",
        title: "Abono registrado",
        message: "La deuda del proveedor se redujo.",
      });
      await load();
      refrescarTurno();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo registrar el abono",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function guardarCargo(values: CargoFormValues) {
    setIsSaving(true);
    try {
      await registrarCargo(values);
      cerrarModales();
      setFeedback({
        variant: "success",
        title: "Cargo registrado",
        message: "La deuda del proveedor aumentó.",
      });
      await load();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo registrar el cargo",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function verEstadoCuenta(proveedor: SaldoProveedor) {
    setIsDetalleOpen(true);
    setIsLoadingDetalle(true);
    setEstadoCuenta(null);
    try {
      setEstadoCuenta(await getEstadoCuenta(proveedor.id_persona));
    } catch (error) {
      setIsDetalleOpen(false);
      setFeedback({
        variant: "error",
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el estado de cuenta.",
      });
    } finally {
      setIsLoadingDetalle(false);
    }
  }

  function abrirConfirmAnular(mov: MovimientoCxp) {
    setConfirmMov(mov);
    setIsConfirmOpen(true);
  }

  function cerrarConfirmAnular() {
    setIsConfirmOpen(false);
    setConfirmMov(null);
  }

  async function confirmarAnular() {
    if (!confirmMov) return;
    setIsAnulando(true);
    try {
      await anularMovimiento(confirmMov.id);
      cerrarConfirmAnular();
      setIsDetalleOpen(false);
      setFeedback({
        variant: "success",
        title: "Movimiento anulado",
        message: "El saldo del proveedor se recalculó.",
      });
      await load();
      refrescarTurno();
    } catch (error) {
      // Rechazos típicos: "solo se puede anular el último movimiento" o
      // "su turno de caja ya está cerrado y arqueado".
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
    soloConDeuda,
    alternarSoloConDeuda,
    resumen,
    anio,
    mes,
    cambiarPeriodo,
    reporte,
    turnoAbierto,
    proveedores,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    isAbonoOpen,
    isCargoOpen,
    proveedorElegido,
    abrirAbono,
    abrirCargo,
    cerrarModales,
    guardarAbono,
    guardarCargo,
    estadoCuenta,
    isDetalleOpen,
    isLoadingDetalle,
    verEstadoCuenta,
    cerrarDetalle: () => {
      setIsDetalleOpen(false);
      setEstadoCuenta(null);
    },
    confirmMov,
    isConfirmOpen,
    isAnulando,
    abrirConfirmAnular,
    cerrarConfirmAnular,
    confirmarAnular,
  };
}
