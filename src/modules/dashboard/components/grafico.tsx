"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

// ApexCharts necesita el navegador: se carga solo en el cliente.
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  titulo: string;
  descripcion?: string;
  tipo: "area" | "bar" | "line" | "donut";
  series: ApexOptions["series"];
  opciones: ApexOptions;
  alto?: number;
  vacio?: boolean;
  className?: string;
};

export function Grafico({ titulo, descripcion, tipo, series, opciones, alto = 300, vacio = false, className = "" }: Props) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{titulo}</h3>
      {descripcion && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{descripcion}</p>}
      <div className="mt-3">
        {vacio ? (
          <p className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400" style={{ height: alto }}>
            Sin datos en el período.
          </p>
        ) : (
          <ReactApexChart type={tipo} series={series} options={opciones} height={alto} />
        )}
      </div>
    </section>
  );
}
