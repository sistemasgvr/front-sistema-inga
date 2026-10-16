"use client";

import { agruparPorPeriodo, flujoPorPeriodo, type DashboardDatos, type Granularidad } from "@/modules/reportes";
import { opcionesFlujo, opcionesTiempo } from "../utils/graficos";
import { Grafico } from "./grafico";

type Props = {
  datos: DashboardDatos;
  desde: string;
  hasta: string;
  granularidad: Granularidad;
  ayudaFlujo: string;
};

const NOMBRE_GRANULARIDAD: Record<Granularidad, string> = { dia: "día", semana: "semana", mes: "mes" };

/** Evolución de las ventas y de lo que entra contra lo que sale. */
export function PestanaResumen({ datos, desde, hasta, granularidad, ayudaFlujo }: Props) {
  const porPeriodo = agruparPorPeriodo(desde, hasta, granularidad, datos.por_dia, { total: (v) => v.total });
  const flujo = flujoPorPeriodo({ desde, hasta, granularidad, ...datos });

  return (
    <div className="grid grid-cols-1 gap-5">
      <Grafico
        titulo={`Ventas por ${NOMBRE_GRANULARIDAD[granularidad]}`}
        descripcion="Total cobrado con IGV en cada período."
        tipo="area"
        series={[{ name: "Ventas", data: porPeriodo.map((p) => p.valores.total) }]}
        opciones={opcionesTiempo(porPeriodo.map((p) => p.etiqueta))}
        vacio={datos.resumen_ventas.cantidad === 0}
      />

      <Grafico
        titulo="Ingresos vs. gastos"
        ayuda={ayudaFlujo}
        descripcion={
          <ul className="mt-1 space-y-0.5">
            <li>
              <span className="font-medium text-gray-700 dark:text-gray-300">Ingresos:</span> ventas cobradas sin IGV (efectivo, Yape,
              tarjeta y crédito al consorcio).
            </li>
            <li>
              <span className="font-medium text-gray-700 dark:text-gray-300">Gastos:</span> compras del día + gastos administrativos +
              pagos de planilla.
            </li>
            <li>
              <span className="font-medium text-gray-700 dark:text-gray-300">Utilidad:</span> ingresos − gastos de cada período.
            </li>
          </ul>
        }
        tipo="line"
        series={[
          { name: "Ingresos", type: "column", data: flujo.map((p) => p.ingresos) },
          { name: "Gastos", type: "column", data: flujo.map((p) => p.gastos) },
          { name: "Utilidad", type: "line", data: flujo.map((p) => p.utilidad) },
        ]}
        opciones={opcionesFlujo(flujo.map((p) => p.etiqueta))}
        vacio={flujo.every((p) => p.ingresos === 0 && p.gastos === 0)}
      />
    </div>
  );
}
