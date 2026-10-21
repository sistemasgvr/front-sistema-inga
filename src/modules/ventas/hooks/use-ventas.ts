"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEstadoPersistente } from "@/shared/hooks/use-estado-persistente";
import { useDebounce } from "@/hooks/useDebounce";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { useFeedback } from "@/shared/hooks/use-feedback";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import {
  cambiarMedioPago,
  descargarComprobante,
  descargarTicket,
  getVenta,
  imprimirComprobante,
  listVentas,
  reemitirComprobante,
  reimprimirComanda,
} from "../services/ventas.service";
import type {
  FiltrosVentas,
  ListVentasResult,
  ReemitirValues,
  VentaDetalle,
} from "../types/ventas.types";
import { hoyLima } from "../utils/formato";

const PAGE_SIZE = 10;

type Feedback = { variant: "success" | "error" | "info"; title: string; message: string };

type Respuesta = { clave: string; datos: ListVentasResult | null; error: string | null };

const mensaje = (error: unknown, porDefecto: string) =>
  error instanceof Error ? error.message : porDefecto;

export function useVentas() {
  const hoy = hoyLima();
  const [filtros, setFiltros] = useEstadoPersistente<FiltrosVentas>("ventas.filtros", {
    buscar: "",
    fecha_desde: hoy,
    fecha_hasta: hoy,
    tipo_comprobante: "",
    medio_pago: "",
  });
  const buscar = useDebounce(filtros.buscar, 400);
  const [pagina, setPagina] = useEstadoPersistente("ventas.pagina", 1);
  const [pageSize, setPageSize] = useEstadoPersistente("ventas.pageSize", PAGE_SIZE);
  const [revision, setRevision] = useState(0);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);

  const [, setFeedback] = useFeedback<Feedback | null>(null);

  const [detalle, setDetalle] = useState<VentaDetalle | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);

  const permisos = useMemo(() => {
    const user = getStoredUser();
    const tiene = (p: string) => Boolean(user?.es_super_admin || user?.permisos?.includes(p));
    return {
      reimprimir: tiene(PermisoBanderas.VENTAS_REIMPRIMIR),
      cambiarPago: tiene(PermisoBanderas.VENTAS_CAMBIAR_PAGO),
      reemitir: tiene(PermisoBanderas.VENTAS_REEMITIR),
    };
  }, []);

  // Cada combinación de filtros, página y revisión es una consulta distinta; la
  // respuesta solo se muestra si corresponde a la consulta vigente.
  const consulta = useMemo(
    () => ({ ...filtros, buscar, pagina, limite: pageSize }),
    [filtros, buscar, pagina, pageSize],
  );
  const clave = `${JSON.stringify(consulta)}#${revision}`;

  useEffect(() => {
    const controller = new AbortController();
    listVentas(consulta, controller.signal)
      .then((datos) => {
        if (!controller.signal.aborted) setRespuesta({ clave, datos, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setRespuesta({ clave, datos: null, error: mensaje(error, "No se pudieron obtener las ventas.") });
      });
    return () => controller.abort();
  }, [consulta, clave]);

  const actual = respuesta?.clave === clave ? respuesta : null;
  const isLoading = !actual;

  useEffect(() => {
    if (actual?.error) setFeedback({ variant: "error", title: "Error al cargar", message: actual.error });
  }, [actual?.error, setFeedback]);

  function cambiarFiltro<K extends keyof FiltrosVentas>(campo: K, valor: FiltrosVentas[K]) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPagina(1);
  }

  /**
   * El rango se mueve de a dos campos: un solo `setFiltros` produce un único
   * cambio en `consulta`, o sea una sola petición con la selección vigente.
   */
  function cambiarRangoFechas(desde: string, hasta: string) {
    setFiltros((prev) => ({ ...prev, fecha_desde: desde, fecha_hasta: hasta }));
    setPagina(1);
  }

  const recargar = useCallback(() => setRevision((r) => r + 1), []);

  async function abrirDetalle(id: number) {
    setDetalleAbierto(true);
    setDetalle(null);
    setCargandoDetalle(true);
    try {
      setDetalle(await getVenta(id));
    } catch (error) {
      setDetalleAbierto(false);
      setFeedback({ variant: "error", title: "No se pudo abrir la venta", message: mensaje(error, "Intenta de nuevo.") });
    } finally {
      setCargandoDetalle(false);
    }
  }

  function cerrarDetalle() {
    if (procesando) return;
    setDetalleAbierto(false);
    setDetalle(null);
  }

  /** Ejecuta una acción sobre la venta abierta y refresca el detalle y el listado. */
  async function ejecutar(
    accion: string,
    operacion: () => Promise<VentaDetalle>,
    exito: { title: string; message: string },
  ): Promise<boolean> {
    setProcesando(accion);
    try {
      setDetalle(await operacion());
      setFeedback({ variant: "success", ...exito });
      recargar();
      return true;
    } catch (error) {
      setFeedback({ variant: "error", title: "No se pudo completar", message: mensaje(error, "Intenta de nuevo.") });
      return false;
    } finally {
      setProcesando(null);
    }
  }

  // Descarga el PDF archivado por el backend; no cambia la venta, así que no recarga el detalle.
  async function descargar(accion: string, operacion: () => Promise<void>) {
    setProcesando(accion);
    try {
      await operacion();
    } catch (error) {
      setFeedback({ variant: "error", title: "No se pudo descargar el ticket", message: mensaje(error, "Intenta de nuevo.") });
    } finally {
      setProcesando(null);
    }
  }

  return {
    filtros,
    cambiarFiltro,
    cambiarRangoFechas,
    registros: actual?.datos?.registros ?? [],
    total: actual?.datos?.total ?? 0,
    resumen: actual?.datos?.resumen ?? null,
    isLoading,
    pagina,
    setPagina,
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPagina(1);
    },
    totalPages: Math.max(1, Math.ceil((actual?.datos?.total ?? 0) / pageSize)),
    permisos,
    detalle,
    detalleAbierto,
    cargandoDetalle,
    procesando,
    abrirDetalle,
    cerrarDetalle,
    reimprimirComanda: (idComanda: number) =>
      ejecutar(`comanda-${idComanda}`, () => reimprimirComanda(idComanda), {
        title: "Enviado a impresión",
        message: "La comanda volvió a la cola de su estación.",
      }),
    descargarTicket: (idComanda: number, nombre: string) =>
      descargar(`pdf-${idComanda}`, () => descargarTicket(idComanda, nombre)),
    descargarComprobante: (idComprobante: number, nombre: string) =>
      descargar(`pdf-comprobante-${idComprobante}`, () => descargarComprobante(idComprobante, nombre)),
    imprimirComprobante: (idComprobante: number) =>
      ejecutar(`comprobante-${idComprobante}`, () => imprimirComprobante(idComprobante), {
        title: "Enviado a impresión",
        message: "El comprobante se imprimirá en la estación principal de caja.",
      }),
    cambiarMedioPago: (idPago: number, medio: number) =>
      ejecutar(`pago-${idPago}`, () => cambiarMedioPago(idPago, medio), {
        title: "Medio de pago actualizado",
        message: "La caja del pago quedó recalculada.",
      }),
    reemitirComprobante: (values: ReemitirValues) =>
      detalle
        ? ejecutar("reemitir", () => reemitirComprobante(detalle.id, values), {
            title: "Comprobante reemitido",
            message: "El comprobante anterior quedó anulado y los pagos apuntan al nuevo.",
          })
        : Promise.resolve(false),
  };
}
