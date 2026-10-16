"use client";

import {
  formatoMoneda,
  gastosPorPeriodo,
  Indicador,
  type DashboardDatos,
  type EstadoResultados,
  type Granularidad,
} from "@/modules/reportes";
import { colorDe, opcionesBarras, opcionesDona, PALETA } from "../utils/graficos";
import { Grafico } from "./grafico";

type Props = {
  datos: DashboardDatos;
  estado: EstadoResultados;
  desde: string;
  hasta: string;
  granularidad: Granularidad;
  periodo: string;
  ayudas: { compras: string; administrativos: string; planilla: string; totalGastos: string };
};

/** Lo que salió en el período: compras del día, gastos administrativos y planilla. */
export function PestanaGastos({ datos, estado, desde, hasta, granularidad, periodo, ayudas }: Props) {
  const serie = gastosPorPeriodo({ desde, hasta, granularidad, ...datos });
  const composicion = [
    { etiqueta: "Compras del día", valor: estado.gastos_diarios },
    { etiqueta: "Gastos administrativos", valor: estado.gastos_administrativos },
    { etiqueta: "Planilla", valor: estado.planilla },
  ];
  const detalle = `Suma del ${periodo.replace(" — ", " al ")}`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador titulo="Total de gastos" valor={formatoMoneda(estado.total_gastos)} detalle={detalle} icono="mdi:cash-minus" ayuda={ayudas.totalGastos} />
        <Indicador titulo="Compras del día" valor={formatoMoneda(estado.gastos_diarios)} detalle={detalle} icono="mdi:cart-outline" ayuda={ayudas.compras} />
        <Indicador
          titulo="Gastos administrativos"
          valor={formatoMoneda(estado.gastos_administrativos)}
          detalle={detalle}
          icono="mdi:office-building-outline"
          ayuda={ayudas.administrativos}
        />
        <Indicador titulo="Planilla pagada" valor={formatoMoneda(estado.planilla)} detalle={detalle} icono="mdi:account-cash-outline" ayuda={ayudas.planilla} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Grafico
          className="xl:col-span-2"
          titulo="Gastos por período"
          descripcion="Compras del día, gastos administrativos y planilla pagados en cada período, apilados."
          tipo="bar"
          series={[
            { name: "Compras del día", data: serie.map((p) => p.valores.compras) },
            { name: "Gastos administrativos", data: serie.map((p) => p.valores.administrativos) },
            { name: "Planilla", data: serie.map((p) => p.valores.planilla) },
          ]}
          opciones={opcionesBarras(
            serie.map((p) => p.etiqueta),
            { colores: [PALETA[0], PALETA[1], PALETA[2]], apiladas: true },
          )}
          vacio={estado.total_gastos === 0}
        />

        <Grafico
          titulo="Composición de gastos"
          descripcion="Peso de cada tipo de gasto en el período."
          tipo="donut"
          series={composicion.map((g) => g.valor)}
          opciones={opcionesDona(
            composicion.map((g) => g.etiqueta),
            composicion.map((_, i) => colorDe(i)),
          )}
          vacio={estado.total_gastos === 0}
        />
      </div>
    </div>
  );
}
