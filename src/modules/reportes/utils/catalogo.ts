import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import type { TipoReporte } from "../types/reportes.types";

/** Nombre que encabeza los reportes impresos y los archivos de Excel. */
export const EMPRESA = "Restaurante Ingá";

export type ReporteCatalogo = {
  tipo: TipoReporte;
  titulo: string;
  ruta: string;
  permiso: string;
  icono: string;
  /** Rango con el que abre: el día para la operación diaria, el mes para el análisis. */
  rangoInicial: "hoy" | "mes";
};

/** Reportes disponibles, en el orden en que aparecen en el menú y en las pestañas. */
export const REPORTES: ReporteCatalogo[] = [
  {
    tipo: "general",
    titulo: "Reporte general",
    ruta: "/reportes",
    permiso: PermisoBanderas.REPORTES_GENERAL,
    icono: "mdi:file-chart-outline",
    rangoInicial: "mes",
  },
  {
    tipo: "ventas",
    titulo: "Ventas y platos",
    ruta: "/reportes/ventas",
    permiso: PermisoBanderas.REPORTES_VENTAS,
    icono: "mdi:silverware-fork-knife",
    rangoInicial: "hoy",
  },
  {
    tipo: "gastos",
    titulo: "Gastos",
    ruta: "/reportes/gastos",
    permiso: PermisoBanderas.REPORTES_GASTOS,
    icono: "mdi:cash-minus",
    rangoInicial: "hoy",
  },
  {
    tipo: "caja",
    titulo: "Caja",
    ruta: "/reportes/caja",
    permiso: PermisoBanderas.REPORTES_CAJA,
    icono: "mdi:cash-register",
    rangoInicial: "hoy",
  },
  {
    tipo: "cuentas",
    titulo: "Cuentas por cobrar y pagar",
    ruta: "/reportes/cuentas",
    permiso: PermisoBanderas.REPORTES_CUENTAS,
    icono: "mdi:scale-balance",
    rangoInicial: "mes",
  },
  {
    tipo: "planilla",
    titulo: "Planilla",
    ruta: "/reportes/planilla",
    permiso: PermisoBanderas.REPORTES_PLANILLA,
    icono: "mdi:account-cash-outline",
    rangoInicial: "mes",
  },
  {
    tipo: "inventario",
    titulo: "Inventario",
    ruta: "/reportes/inventario",
    permiso: PermisoBanderas.REPORTES_INVENTARIO,
    icono: "mdi:package-variant-closed",
    rangoInicial: "mes",
  },
];

export const reporteDe = (tipo: TipoReporte) => REPORTES.find((r) => r.tipo === tipo)!;
