"use client";

import { useReporte } from "../hooks/use-reporte";
import type { MovimientoInventario, ReporteInventario, StockReporte } from "../types/reportes.types";
import { resumenInventario, sumar } from "../utils/calculos";
import { seccion, type ColumnaReporte } from "../utils/columnas";
import { formatoMoneda, formatoNumero } from "../utils/formato";
import { Indicador } from "./indicador";
import { ReporteShell } from "./reporte-shell";
import { TablaSeccion } from "./seccion-reporte";

const COLUMNAS_STOCK: ColumnaReporte<StockReporte>[] = [
  { clave: "almacen", titulo: "Almacén", valor: (s) => s.almacen },
  { clave: "producto", titulo: "Producto", valor: (s) => s.producto },
  { clave: "unidad", titulo: "Unidad", valor: (s) => s.unidad },
  { clave: "stock", titulo: "Stock", valor: (s) => s.stock_actual, formato: "numero" },
  { clave: "reservado", titulo: "Reservado", valor: (s) => s.stock_reservado, formato: "numero" },
  { clave: "minimo", titulo: "Mínimo", valor: (s) => s.stock_minimo, formato: "numero" },
  { clave: "alerta", titulo: "Bajo mínimo", valor: (s) => s.bajo_minimo },
  { clave: "costo", titulo: "Costo promedio", valor: (s) => s.costo_promedio, formato: "moneda" },
  { clave: "valorizado", titulo: "Valorizado", valor: (s) => s.valorizado, formato: "moneda" },
];

type PorAlmacen = ReturnType<typeof resumenInventario>["por_almacen"][number];

const COLUMNAS_ALMACEN: ColumnaReporte<PorAlmacen>[] = [
  { clave: "almacen", titulo: "Almacén", valor: (a) => a.almacen },
  { clave: "items", titulo: "Productos", valor: (a) => a.items, formato: "numero" },
  { clave: "valorizado", titulo: "Valorizado", valor: (a) => a.valorizado, formato: "moneda" },
];

const COLUMNAS_MOVIMIENTOS: ColumnaReporte<MovimientoInventario>[] = [
  { clave: "tipo", titulo: "Tipo", valor: (m) => m.tipo_movimiento },
  { clave: "motivo", titulo: "Motivo", valor: (m) => m.motivo },
  { clave: "movimientos", titulo: "Movimientos", valor: (m) => m.movimientos, formato: "numero" },
  { clave: "entradas", titulo: "Valor entradas", valor: (m) => m.valor_entradas, formato: "moneda" },
  { clave: "salidas", titulo: "Valor salidas", valor: (m) => m.valor_salidas, formato: "moneda" },
];

function armarSecciones(d: ReporteInventario) {
  const resumen = resumenInventario(d.stock);
  return {
    resumen,
    almacenes: seccion("Valorizado por almacén", COLUMNAS_ALMACEN, resumen.por_almacen, {
      items: resumen.items,
      valorizado: resumen.valorizado,
    }),
    movimientos: seccion("Movimientos de almacén del período", COLUMNAS_MOVIMIENTOS, d.movimientos, {
      movimientos: sumar(d.movimientos, (m) => m.movimientos),
      entradas: sumar(d.movimientos, (m) => m.valor_entradas),
      salidas: sumar(d.movimientos, (m) => m.valor_salidas),
    }),
    bajoMinimo: seccion("Productos bajo stock mínimo", COLUMNAS_STOCK, d.stock.filter((x) => x.bajo_minimo)),
    stock: seccion("Stock actual", COLUMNAS_STOCK, d.stock, { valorizado: resumen.valorizado }),
  };
}

export function ReporteInventarioView() {
  const r = useReporte("inventario");
  const d = r.datos;
  const s = d ? armarSecciones(d) : null;

  return (
    <ReporteShell
      tipo="inventario"
      rango={r.rango}
      onRangoChange={r.cambiarRango}
      cargando={r.cargando}
      error={r.error}
      onRecargar={r.recargar}
      exportar={s ? () => [s.almacenes, s.bajoMinimo, s.stock, s.movimientos] : null}
      nota="El stock y su valorización son los de este momento; el rango de fechas solo aplica a los movimientos de almacén."
    >
      {d && s && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Indicador titulo="Inventario valorizado" valor={formatoMoneda(s.resumen.valorizado)} detalle="Stock × costo promedio" icono="mdi:package-variant-closed" />
            <Indicador titulo="Productos en almacén" valor={formatoNumero(s.resumen.items)} icono="mdi:format-list-bulleted" />
            <Indicador
              titulo="Bajo stock mínimo"
              valor={formatoNumero(s.resumen.bajo_minimo)}
              detalle="Productos por reponer"
              icono="mdi:alert-outline"
              negativo={s.resumen.bajo_minimo > 0}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <TablaSeccion seccion={s.almacenes} claveFila={(a) => a.almacen} />
            <TablaSeccion
              seccion={s.movimientos}
              claveFila={(m) => `${m.tipo_movimiento}|${m.motivo}`}
              descripcion="Ingresos, salidas y ajustes confirmados, valorizados a su costo."
            />
          </div>

          {s.bajoMinimo.filas.length > 0 && <TablaSeccion seccion={s.bajoMinimo} claveFila={(x) => x.id} />}
          <TablaSeccion seccion={s.stock} claveFila={(x) => x.id} />
        </>
      )}
    </ReporteShell>
  );
}
