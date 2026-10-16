"use client";

import {
  sumar,
  TablaReporte,
  topConOtros,
  topPlatos,
  ventasPorCategoria,
  type ColumnaReporte,
  type DashboardDatos,
  type ProductoRentabilidad,
} from "@/modules/reportes";
import { colorDe, opcionesBarras, opcionesDona, PALETA } from "../utils/graficos";
import { Grafico } from "./grafico";

const COLUMNAS: ColumnaReporte<ProductoRentabilidad>[] = [
  { clave: "nombre", titulo: "Plato", valor: (p) => p.nombre },
  { clave: "cantidad", titulo: "Cantidad", valor: (p) => p.cantidad, formato: "numero" },
  { clave: "monto", titulo: "Venta (con IGV)", valor: (p) => p.monto, formato: "moneda" },
  { clave: "monto_neto", titulo: "Venta sin IGV", valor: (p) => p.monto_neto, formato: "moneda" },
  { clave: "costo_total", titulo: "Costo de receta", valor: (p) => p.costo_total, formato: "moneda" },
  { clave: "margen", titulo: "Margen", valor: (p) => p.margen, formato: "moneda" },
  { clave: "margen_pct", titulo: "Margen %", valor: (p) => p.margen_pct, formato: "porcentaje" },
];

/** Qué platos se venden más, cuánto dejan y qué categorías pesan más. */
export function PestanaPlatos({ datos }: { datos: DashboardDatos }) {
  const top = topPlatos(datos.productos, 10);
  const categorias = topConOtros(ventasPorCategoria(datos.productos), 6, (c) => c.monto, (c) => c.categoria);

  return (
    <div className="space-y-5">
      <Grafico
        titulo="Platos más vendidos"
        ayuda="Top 10 por unidades vendidas en el período (incluye cortesías). La venta va sin IGV para compararla con el costo; el costo de receta es unidades × costo actual de la receta."
        descripcion="Top 10 por cantidad vendida: venta sin IGV frente al costo de receta de esas mismas unidades. La diferencia es el margen del plato."
        tipo="bar"
        alto={Math.max(280, top.length * 46)}
        series={[
          { name: "Venta sin IGV", data: top.map((p) => p.monto_neto) },
          { name: "Costo de receta", data: top.map((p) => p.costo_total) },
        ]}
        opciones={opcionesBarras(
          top.map((p) => `${p.nombre} (${p.cantidad} und)`),
          { horizontal: true, colores: [PALETA[0], PALETA[1]] },
        )}
        vacio={!top.length}
      >
        <div className="mt-4 border-t border-gray-100 pt-2 dark:border-gray-800">
          <TablaReporte
            columnas={COLUMNAS}
            filas={top}
            claveFila={(p) => p.id_producto}
            totales={{
              cantidad: sumar(top, (p) => p.cantidad),
              monto: sumar(top, (p) => p.monto),
              monto_neto: sumar(top, (p) => p.monto_neto),
              costo_total: sumar(top, (p) => p.costo_total),
              margen: sumar(top, (p) => p.margen),
            }}
          />
        </div>
      </Grafico>

      <Grafico
        titulo="Ventas por categoría"
        descripcion="Venta con IGV por categoría de la carta; las menores se agrupan en «Otros»."
        tipo="donut"
        series={categorias.map((c) => c.valor)}
        opciones={opcionesDona(
          categorias.map((c) => c.etiqueta),
          categorias.map((_, i) => colorDe(i)),
        )}
        vacio={!categorias.length}
      />
    </div>
  );
}
