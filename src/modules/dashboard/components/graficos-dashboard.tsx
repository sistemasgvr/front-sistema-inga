"use client";

import {
  agruparPorPeriodo,
  etiquetaHora,
  etiquetaTipoPedido,
  flujoPorPeriodo,
  rentabilidadProducto,
  serieDiasSemana,
  serieHoras,
  sumar,
  topConOtros,
  ventasPorCategoria,
  type DashboardDatos,
  type Granularidad,
} from "@/modules/reportes";
import { colorDe, opcionesBarras, opcionesDona, opcionesFlujo, opcionesTiempo, PALETA } from "../utils/graficos";
import { Grafico } from "./grafico";

type Props = { datos: DashboardDatos; desde: string; hasta: string; granularidad: Granularidad };

const NOMBRE_GRANULARIDAD: Record<Granularidad, string> = { dia: "día", semana: "semana", mes: "mes" };

export function GraficosDashboard({ datos, desde, hasta, granularidad }: Props) {
  const porPeriodo = agruparPorPeriodo(desde, hasta, granularidad, datos.por_dia, {
    total: (v) => v.total,
    cantidad: (v) => v.cantidad,
  });
  const flujo = flujoPorPeriodo({ desde, hasta, granularidad, ...datos });
  const platos = datos.productos.map(rentabilidadProducto);
  const topCantidad = [...platos].sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
  const topVenta = [...platos].sort((a, b) => b.monto_neto - a.monto_neto).slice(0, 8);
  const categorias = topConOtros(ventasPorCategoria(datos.productos), 6, (c) => c.monto, (c) => c.categoria);
  const horas = serieHoras(datos.por_hora);
  const semana = serieDiasSemana(datos.por_dia_semana);
  const gastos = [
    { etiqueta: "Compras del día", valor: sumar(datos.gastos_diarios, (g) => g.total) },
    { etiqueta: "Gastos administrativos", valor: sumar(datos.gastos_administrativos, (g) => g.monto) },
    { etiqueta: "Planilla", valor: sumar(datos.planilla, (p) => p.monto) },
  ];
  const sinVentas = datos.resumen_ventas.cantidad === 0;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Grafico
        className="xl:col-span-2"
        titulo={`Ventas por ${NOMBRE_GRANULARIDAD[granularidad]}`}
        descripcion="Pedidos cobrados, con IGV."
        tipo="area"
        series={[{ name: "Ventas", data: porPeriodo.map((p) => p.valores.total) }]}
        opciones={opcionesTiempo(porPeriodo.map((p) => p.etiqueta))}
        vacio={sinVentas}
      />

      <Grafico
        className="xl:col-span-2"
        titulo="Ingresos vs. gastos"
        descripcion="Ventas sin IGV contra compras del día, gastos administrativos y planilla pagados en cada período."
        tipo="line"
        series={[
          { name: "Ingresos", type: "column", data: flujo.map((p) => p.ingresos) },
          { name: "Gastos", type: "column", data: flujo.map((p) => p.gastos) },
          { name: "Utilidad", type: "line", data: flujo.map((p) => p.utilidad) },
        ]}
        opciones={opcionesFlujo(flujo.map((p) => p.etiqueta))}
        vacio={flujo.every((p) => p.ingresos === 0 && p.gastos === 0)}
      />

      <Grafico
        titulo="Platos más vendidos"
        descripcion="Top 10 por unidades (incluye cortesías)."
        tipo="bar"
        alto={340}
        series={[{ name: "Unidades", data: topCantidad.map((p) => p.cantidad) }]}
        opciones={opcionesBarras(topCantidad.map((p) => p.nombre), { horizontal: true, moneda: false })}
        vacio={!topCantidad.length}
      />

      <Grafico
        titulo="Venta vs. costo de receta"
        descripcion="Top 8 por venta sin IGV; la diferencia es el margen bruto del plato."
        tipo="bar"
        alto={340}
        series={[
          { name: "Venta sin IGV", data: topVenta.map((p) => p.monto_neto) },
          { name: "Costo de receta", data: topVenta.map((p) => p.costo_total) },
        ]}
        opciones={opcionesBarras(topVenta.map((p) => p.nombre), { horizontal: true, colores: [PALETA[0], PALETA[1]] })}
        vacio={!topVenta.length}
      />

      <Grafico
        titulo="Ventas por medio de pago"
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
        descripcion="Hora de cobro; muestra las horas punta."
        tipo="bar"
        series={[{ name: "Ventas", data: horas.map((h) => h.total) }]}
        opciones={opcionesBarras(horas.map((h) => etiquetaHora(h.hora)))}
        vacio={!horas.length}
      />

      <Grafico
        titulo="Ventas por día de la semana"
        tipo="bar"
        series={[{ name: "Ventas", data: semana.map((d) => d.total) }]}
        opciones={opcionesBarras(semana.map((d) => d.nombre))}
        vacio={sinVentas}
      />

      <Grafico
        titulo="Ventas por categoría"
        tipo="donut"
        series={categorias.map((c) => c.valor)}
        opciones={opcionesDona(
          categorias.map((c) => c.etiqueta),
          categorias.map((_, i) => colorDe(i)),
        )}
        vacio={!categorias.length}
      />

      <Grafico
        titulo="Composición de gastos"
        descripcion="Lo pagado en el período."
        tipo="donut"
        series={gastos.map((g) => g.valor)}
        opciones={opcionesDona(
          gastos.map((g) => g.etiqueta),
          gastos.map((_, i) => colorDe(i)),
        )}
        vacio={gastos.every((g) => g.valor === 0)}
      />

      <Grafico
        className="xl:col-span-2"
        titulo="Ventas por mozo"
        tipo="bar"
        alto={Math.max(220, datos.por_mozo.length * 42)}
        series={[{ name: "Ventas", data: datos.por_mozo.map((m) => m.total) }]}
        opciones={opcionesBarras(datos.por_mozo.map((m) => m.nombre), { horizontal: true })}
        vacio={!datos.por_mozo.length}
      />
    </div>
  );
}
