"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { listConvenios } from "@/modules/convenios/services/convenios.service";
import type { ConvenioItem } from "@/modules/convenios/types/convenios.types";
import { buscarPersonas } from "@/modules/personas/services/personas.service";
import type { PersonaBusquedaItem } from "@/modules/personas/types/personas.types";
import {
  anularMovimiento,
  getEstadoCuenta,
  getReportePeriodo,
  listSaldos,
  registrarAbono,
  registrarAjuste,
  registrarConsumo,
} from "../services/cxc.service";
import type {
  AbonoCxcFormValues,
  ConsumoFormValues,
  EstadoCuentaCxc,
  MovimientoCxc,
  ReporteCxc,
  SaldoCliente,
  SaldosResumenCxc,
} from "../types/cxc.types";
import { hoyISO, quincenaDe } from "../utils/formato";

const PAGE_SIZE = 10;

/**
 * Pantalla principal de cuentas por cobrar al consorcio.
 *
 * Muestra cuánto nos debe cada trabajador, filtrable por empresa, y arma el
 * reporte de la quincena que se le envía a cada empresa a inicios de mes.
 *
 * Carga dos cosas de otros módulos:
 *   - los convenios (M05), para el filtro por empresa: el corte se factura
 *     por empresa, no por persona suelta
 *   - los clientes del maestro de personas (M05), para poder cargarle un
 *     consumo a alguien que todavía no tiene movimientos y por eso no aparece
 *     en la tabla de saldos
 */
export function useCuentasPorCobrar() {
  const hoy = new Date();

  const [registros, setRegistros] = useState<SaldoCliente[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [soloConDeuda, setSoloConDeuda] = useState(false);
  const [convenioFiltro, setConvenioFiltro] = useState<number | null>(null);

  const [resumen, setResumen] = useState<SaldosResumenCxc>({
    deuda_total: 0,
    clientes_con_deuda: 0,
    clientes_total: 0,
    clientes_sobre_limite: 0,
  });

  // El período arranca en la quincena en curso, que es lo que se quiere ver el
  // 95% de las veces. Solo al cerrar mes se retrocede a la anterior.
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [quincena, setQuincena] = useState<number>(quincenaDe(hoyISO()));
  const [reporte, setReporte] = useState<ReporteCxc | null>(null);

  const [convenios, setConvenios] = useState<ConvenioItem[]>([]);
  const [clientes, setClientes] = useState<PersonaBusquedaItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  } | null>(null);

  const [isConsumoOpen, setIsConsumoOpen] = useState(false);
  const [isAbonoOpen, setIsAbonoOpen] = useState(false);
  const [isAjusteOpen, setIsAjusteOpen] = useState(false);
  /** Cliente preseleccionado al abrir un modal desde su fila. */
  const [clienteElegido, setClienteElegido] = useState<SaldoCliente | null>(null);

  const [estadoCuenta, setEstadoCuenta] = useState<EstadoCuentaCxc | null>(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);

  const [isReporteOpen, setIsReporteOpen] = useState(false);

  const [confirmMov, setConfirmMov] = useState<MovimientoCxc | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAnulando, setIsAnulando] = useState(false);

  /**
   * Carga los saldos y el reporte de la quincena.
   *
   * La dejo como función normal, sin `useCallback`, por lo mismo que en CxP: el
   * React Compiler no lograba preservar la memoización manual en un hook con
   * tanto estado y terminaba abandonando la optimización del componente entero.
   * Sin `useCallback` memoiza solo, y el efecto de abajo se dispara con los
   * mismos valores que antes.
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
          id_convenio: convenioFiltro ?? undefined,
        }),
        getReportePeriodo({
          anio,
          mes,
          quincena,
          id_convenio: convenioFiltro ?? undefined,
        }),
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
            : "No se pudieron obtener las cuentas por cobrar.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // Dependo de los valores primitivos y no de `load`, que se recrea en cada
    // render. El efecto se dispara exactamente en los mismos casos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    pagina,
    pageSize,
    soloConDeuda,
    convenioFiltro,
    anio,
    mes,
    quincena,
  ]);

  useEffect(() => {
    // Las empresas del consorcio son pocas y no cambian seguido, así que las
    // traigo una sola vez para el selector del filtro.
    listConvenios({ pagina: 1, limite: 100, estado: "activos" })
      .then((r) => setConvenios(r.registros))
      .catch(() => setConvenios([]));
  }, []);

  useEffect(() => {
    // Clientes del maestro de personas (M05). Hace falta para cargarle un
    // consumo a alguien que aún no tiene movimientos y por eso no sale en la
    // tabla de saldos.
    buscarPersonas("", "clientes", 100)
      .then(setClientes)
      .catch(() => setClientes([]));
  }, []);

  function cambiarPeriodo(
    nuevoAnio: number,
    nuevoMes: number,
    nuevaQuincena: number,
  ) {
    setAnio(nuevoAnio);
    setMes(nuevoMes);
    setQuincena(nuevaQuincena);
  }

  function alternarSoloConDeuda() {
    setSoloConDeuda((p) => !p);
    setPagina(1);
  }

  function cambiarConvenioFiltro(id: number | null) {
    setConvenioFiltro(id);
    setPagina(1);
  }

  function abrirConsumo(cliente?: SaldoCliente) {
    setClienteElegido(cliente ?? null);
    setIsConsumoOpen(true);
  }

  function abrirAbono(cliente?: SaldoCliente) {
    setClienteElegido(cliente ?? null);
    setIsAbonoOpen(true);
  }

  function abrirAjuste(cliente: SaldoCliente) {
    setClienteElegido(cliente);
    setIsAjusteOpen(true);
  }

  function cerrarModales() {
    setIsConsumoOpen(false);
    setIsAbonoOpen(false);
    setIsAjusteOpen(false);
    setClienteElegido(null);
  }

  /**
   * Guarda el consumo y, si el cliente pasó su tope de crédito, muestra la
   * advertencia en lugar del mensaje de éxito normal.
   *
   * Esto es lo único que avisa: decidimos advertir y no bloquear, así que si
   * este mensaje no se muestra, el tope no existe en la práctica.
   */
  async function guardarConsumo(values: ConsumoFormValues) {
    setIsSaving(true);
    try {
      const mov = await registrarConsumo(values);
      cerrarModales();

      setFeedback(
        mov.supera_limite
          ? {
              variant: "warning",
              title: "Consumo registrado, pero superó su límite",
              message: `${mov.nombre_persona} pasó el tope de crédito de su convenio. Conviene avisar a la empresa antes del próximo corte.`,
            }
          : {
              variant: "success",
              title: "Consumo registrado",
              message: "La deuda del cliente aumentó.",
            },
      );

      await load();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo registrar el consumo",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function guardarAbono(values: AbonoCxcFormValues) {
    setIsSaving(true);
    try {
      await registrarAbono(values);
      cerrarModales();
      setFeedback({
        variant: "success",
        title: "Abono registrado",
        message: "La deuda del cliente se redujo.",
      });
      await load();
    } catch (error) {
      // Rechazo típico: "el abono supera la deuda". El mensaje del backend ya
      // dice cuánto debe y qué hacer, así que lo muestro tal cual.
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

  async function guardarAjuste(monto: number, motivo: string) {
    if (!clienteElegido) return;
    setIsSaving(true);
    try {
      await registrarAjuste(clienteElegido.id_persona, monto, motivo);
      cerrarModales();
      setFeedback({
        variant: "success",
        title: "Ajuste registrado",
        message: "El saldo del cliente se recalculó.",
      });
      await load();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "No se pudo registrar el ajuste",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function verEstadoCuenta(cliente: SaldoCliente) {
    setIsDetalleOpen(true);
    setIsLoadingDetalle(true);
    setEstadoCuenta(null);
    try {
      // Sin período: el estado de cuenta se abre con el historial completo,
      // porque la pregunta que responde es "cuánto debo en total".
      setEstadoCuenta(await getEstadoCuenta(cliente.id_persona));
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

  function abrirConfirmAnular(mov: MovimientoCxc) {
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
        message: "El saldo del cliente se recalculó.",
      });
      await load();
    } catch (error) {
      // Rechazos típicos: "este consumo viene de un pedido" o "la quincena ya
      // está cerrada". Los dos mensajes explican qué hacer en su lugar.
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
    convenioFiltro,
    cambiarConvenioFiltro,
    convenios,
    clientes,
    resumen,
    anio,
    mes,
    quincena,
    cambiarPeriodo,
    reporte,
    isReporteOpen,
    abrirReporte: () => setIsReporteOpen(true),
    cerrarReporte: () => setIsReporteOpen(false),
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    isConsumoOpen,
    isAbonoOpen,
    isAjusteOpen,
    clienteElegido,
    abrirConsumo,
    abrirAbono,
    abrirAjuste,
    cerrarModales,
    guardarConsumo,
    guardarAbono,
    guardarAjuste,
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
