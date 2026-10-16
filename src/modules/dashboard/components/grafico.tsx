"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import InfoTooltip from "@/components/ui/tooltip/InfoTooltip";

// ApexCharts necesita el navegador: se carga solo en el cliente.
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  titulo: string;
  descripcion?: ReactNode;
  /** Cómo se calcula; globo de ayuda junto al título. */
  ayuda?: string;
  tipo: "area" | "bar" | "line" | "donut";
  series: ApexOptions["series"];
  opciones: ApexOptions;
  alto?: number;
  vacio?: boolean;
  className?: string;
  /** Contenido bajo el gráfico (p. ej. la tabla con las cifras). */
  children?: ReactNode;
};

export function Grafico({ titulo, descripcion, ayuda, tipo, series, opciones, alto = 300, vacio = false, className = "", children }: Props) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <h3 className="flex items-center text-base font-medium text-gray-800 dark:text-white/90">
        {titulo}
        {ayuda && <InfoTooltip text={ayuda} label={`Qué muestra: ${titulo}`} />}
      </h3>
      {descripcion && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{descripcion}</div>}
      <div className="mt-3">
        {vacio ? (
          <p className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400" style={{ height: alto }}>
            Sin datos en el período.
          </p>
        ) : (
          <ReactApexChart type={tipo} series={series} options={opciones} height={alto} />
        )}
      </div>
      {!vacio && children}
    </section>
  );
}
