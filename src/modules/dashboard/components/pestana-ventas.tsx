"use client";

import {
  etiquetaHora,
  etiquetaTipoPedido,
  formatoMoneda,
  formatoNumero,
  Indicador,
  serieDiasSemana,
  serieHoras,
  type DashboardDatos,
  type EstadoResultados,
} from "@/modules/reportes";
import { colorDe, opcionesBarras, opcionesDona } from "../utils/graficos";
import { Grafico } from "./grafico";

type Props = {
  datos: DashboardDatos;
  estado: EstadoResultados;
  ayudas: { pedidos: string; comensales: string };
};

/** Cómo y cuándo se vende: medios de pago, canales, horas y días. */
export function PestanaVentas({ datos, estado, ayudas }: Props) {
  const horas = serieHoras(datos.por_hora);
  const semana = serieDiasSemana(datos.por_dia_semana);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Indicador
          titulo="Pedidos cobrados"
          valor={formatoNumero(estado.cantidad_ventas)}
          detalle={`Ticket promedio: ${formatoMoneda(estado.ticket_promedio)}`}
          icono="mdi:receipt-text-check-outline"
          ayuda={ayudas.pedidos}
        />
        <Indicador
          titulo="Comensales"
          valor={formatoNumero(estado.comensales)}
          detalle={`Consumo por comensal: ${formatoMoneda(estado.consumo_por_comensal)}`}
          icono="mdi:account-group-outline"
          ayuda={ayudas.comensales}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Grafico
          titulo="Ventas por medio de pago"
          descripcion="El crédito es lo fiado al consorcio; se cobra después en Cuentas por cobrar."
          tipo="donut"
          series={datos.por_medio.map((m) => m.total)}
          opciones={opcionesDona(
            datos.por_medio.map((m) => m.nombre),
            datos.por_medio.map((m) => colorDe(m.medio_pago - 1)),
          )}
          vacio={!datos.por_medio.length}
        />

        <Grafico
          titulo="Ventas por canal"
          descripcion="Mesa, para llevar y delivery."
          tipo="donut"
          series={datos.por_tipo.map((t) => t.total)}
          opciones={opcionesDona(
            datos.por_tipo.map((t) => etiquetaTipoPedido(t.tipo_pedido)),
            datos.por_tipo.map((t) => colorDe(t.tipo_pedido - 1)),
          )}
          vacio={!datos.por_tipo.length}
        />

        <Grafico
          titulo="Ventas por hora"
          descripcion="Hora de cobro: muestra las horas punta."
          tipo="bar"
          series={[{ name: "Ventas", data: horas.map((h) => h.total) }]}
          opciones={opcionesBarras(horas.map((h) => etiquetaHora(h.hora)))}
          vacio={!horas.length}
        />

        <Grafico
          titulo="Ventas por día de la semana"
          descripcion="Suma de cada día de la semana dentro del período."
          tipo="bar"
          series={[{ name: "Ventas", data: semana.map((d) => d.total) }]}
          opciones={opcionesBarras(semana.map((d) => d.nombre))}
          vacio={datos.resumen_ventas.cantidad === 0}
        />
      </div>
    </div>
  );
}
