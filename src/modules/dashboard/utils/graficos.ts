import type { ApexOptions } from "apexcharts";
import { formatoMoneda, formatoNumero } from "@/modules/reportes";

/**
 * Paleta categórica en orden fijo (validada para daltonismo y contraste). La
 * serie 1 es siempre la principal; un gráfico de una sola serie usa solo esa.
 * El color sigue a la entidad: el medio de pago 2 es siempre el color 2.
 */
export const PALETA = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];

/** Gris legible sobre fondo claro y oscuro para ejes y leyendas. */
const TINTA = "#98a2b3";

export const colorDe = (indice: number) => PALETA[((indice % PALETA.length) + PALETA.length) % PALETA.length];

export function monedaCorta(valor: number): string {
  const abs = Math.abs(valor);
  if (abs >= 1_000_000) return `S/ ${(valor / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `S/ ${(valor / 1_000).toFixed(1)}k`;
  return `S/ ${Math.round(valor)}`;
}

const base = (tipo: NonNullable<ApexOptions["chart"]>["type"]): ApexOptions => ({
  chart: {
    type: tipo,
    fontFamily: "Outfit, sans-serif",
    foreColor: TINTA,
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  dataLabels: { enabled: false },
  grid: { borderColor: "rgba(152, 162, 179, 0.2)", strokeDashArray: 3 },
  legend: { position: "top", horizontalAlign: "left", fontFamily: "Outfit, sans-serif" },
});

/** Barras verticales u horizontales en soles. */
export function opcionesBarras(
  categorias: string[],
  opciones: { horizontal?: boolean; colores?: string[]; moneda?: boolean; apiladas?: boolean } = {},
): ApexOptions {
  const { horizontal = false, colores = [PALETA[0]], moneda = true, apiladas = false } = opciones;
  const formato = moneda ? formatoMoneda : formatoNumero;
  const corto = moneda ? monedaCorta : formatoNumero;
  const b = base("bar");
  return {
    ...b,
    chart: { ...b.chart, stacked: apiladas },
    colors: colores,
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 4,
        borderRadiusApplication: "end",
        columnWidth: "55%",
        barHeight: "65%",
      },
    },
    // Separación de 2px entre barras vecinas.
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: categorias,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: horizontal ? { formatter: (v: string) => corto(Number(v)) } : { rotate: -45, hideOverlappingLabels: true },
    },
    yaxis: {
      labels: horizontal ? { maxWidth: 160 } : { formatter: (v: number) => corto(v) },
    },
    tooltip: { y: { formatter: (v: number) => formato(v) } },
  };
}

/** Línea o área en soles a lo largo del tiempo. */
export function opcionesTiempo(categorias: string[], colores: string[] = [PALETA[0]], area = true): ApexOptions {
  const b = base(area ? "area" : "line");
  return {
    ...b,
    colors: colores,
    stroke: { curve: "smooth", width: 2 },
    fill: area ? { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.02 } } : { opacity: 1 },
    markers: { size: categorias.length <= 31 ? 4 : 0, strokeWidth: 2, strokeColors: "#fff", hover: { size: 6 } },
    xaxis: {
      categories: categorias,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: -45, hideOverlappingLabels: true },
      tooltip: { enabled: false },
    },
    yaxis: { labels: { formatter: (v: number) => monedaCorta(v) } },
    tooltip: { shared: true, intersect: false, y: { formatter: (v: number) => formatoMoneda(v) } },
  };
}

/**
 * Ingresos y gastos como barras, utilidad como línea: las tres en soles y en
 * un solo eje, para comparar alturas sin trucos de escala.
 */
export function opcionesFlujo(categorias: string[]): ApexOptions {
  const b = base("line");
  return {
    ...b,
    colors: [PALETA[0], PALETA[1], PALETA[2]],
    stroke: { width: [0, 0, 2], curve: "smooth" },
    plotOptions: { bar: { borderRadius: 4, borderRadiusApplication: "end", columnWidth: "60%" } },
    markers: { size: [0, 0, 4], strokeWidth: 2, strokeColors: "#fff" },
    xaxis: {
      categories: categorias,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: -45, hideOverlappingLabels: true },
      tooltip: { enabled: false },
    },
    yaxis: { labels: { formatter: (v: number) => monedaCorta(v) } },
    tooltip: { shared: true, intersect: false, y: { formatter: (v: number) => formatoMoneda(v) } },
  };
}

/** Dona con leyenda abajo; cada rebanada lleva su color por entidad. */
export function opcionesDona(etiquetas: string[], colores: string[], moneda = true): ApexOptions {
  const formato = moneda ? formatoMoneda : formatoNumero;
  const b = base("donut");
  return {
    ...b,
    labels: etiquetas,
    colors: colores,
    legend: { ...b.legend, position: "bottom", horizontalAlign: "center" },
    // Anillo de 2px del color de fondo entre rebanadas.
    stroke: { width: 2, colors: ["transparent"] },
    dataLabels: { enabled: true, formatter: (v: number) => `${Math.round(v)}%`, dropShadow: { enabled: false } },
    plotOptions: {
      pie: {
        donut: {
          size: "62%",
          labels: {
            show: true,
            value: { formatter: (v: string) => formato(Number(v)) },
            total: {
              show: true,
              label: "Total",
              color: TINTA,
              formatter: (w: { globals: { seriesTotals: number[] } }) =>
                formato(w.globals.seriesTotals.reduce((a, n) => a + n, 0)),
            },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v: number) => formato(v) } },
  };
}
