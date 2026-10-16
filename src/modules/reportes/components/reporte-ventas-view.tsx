"use client";

import { useReporte } from "../hooks/use-reporte";
import type { ReporteVentas, VentaListado, VentaPorMedio, VentaPorMozo, VentaPorTipo } from "../types/reportes.types";
import {
  etiquetaTipoPedido,
  porcentaje,
  rentabilidadProducto,
  sumar,
  ventasPorCategoria,
  type ProductoRentabilidad,
} from "../utils/calculos";
import { seccion, seccionResumen, type ColumnaReporte } from "../utils/columnas";
import { formatoMoneda, formatoNumero, formatoPorcentaje } from "../utils/formato";
import { Indicador } from "./indicador";
import { ReporteShell } from "./reporte-shell";
import { TablaSeccion } from "./seccion-reporte";

const COLUMNAS_PLATOS: ColumnaReporte<ProductoRentabilidad>[] = [
  { clave: "nombre", titulo: "Producto", valor: (p) => p.nombre },
  { clave: "categoria", titulo: "Categoría", valor: (p) => p.categoria },
  { clave: "cantidad", titulo: "Cantidad", valor: (p) => p.cantidad, formato: "numero" },
  { clave: "cortesias", titulo: "Cortesías", valor: (p) => p.cortesias, formato: "numero" },
  { clave: "monto", titulo: "Venta (con IGV)", valor: (p) => p.monto, formato: "moneda" },
  { clave: "monto_neto", titulo: "Venta sin IGV", valor: (p) => p.monto_neto, formato: "moneda" },
  { clave: "costo_unitario", titulo: "Costo unit.", valor: (p) => p.costo_unitario, formato: "moneda" },
  { clave: "costo_total", titulo: "Costo total", valor: (p) => p.costo_total, formato: "moneda" },
  { clave: "margen", titulo: "Margen", valor: (p) => p.margen, formato: "moneda" },
  { clave: "margen_pct", titulo: "Margen %", valor: (p) => p.margen_pct, formato: "porcentaje" },
];

type Categoria = ReturnType<typeof ventasPorCategoria>[number];

const COLUMNAS_CATEGORIAS: ColumnaReporte<Categoria>[] = [
  { clave: "categoria", titulo: "Categoría", valor: (c) => c.categoria },
  { clave: "cantidad", titulo: "Unidades", valor: (c) => c.cantidad, formato: "numero" },
  { clave: "monto", titulo: "Venta (con IGV)", valor: (c) => c.monto, formato: "moneda" },
  { clave: "costo", titulo: "Costo", valor: (c) => c.costo, formato: "moneda" },
  { clave: "margen_pct", titulo: "Margen %", valor: (c) => c.margen_pct, formato: "porcentaje" },
];

const columnasParticipacion = <T,>(
  titulo: string,
  nombre: (f: T) => string,
  total: (f: T) => number,
  cantidad: (f: T) => number,
  base: number,
): ColumnaReporte<T>[] => [
  { clave: "nombre", titulo, valor: nombre },
  { clave: "cantidad", titulo: "Operaciones", valor: cantidad, formato: "numero" },
  { clave: "total", titulo: "Monto", valor: total, formato: "moneda" },
  { clave: "pct", titulo: "% del total", valor: (f) => porcentaje(total(f), base), formato: "porcentaje" },
];

const COLUMNAS_VENTAS: ColumnaReporte<VentaListado>[] = [
  { clave: "codigo", titulo: "Pedido", valor: (v) => v.codigo },
  { clave: "fecha", titulo: "Cobro", valor: (v) => v.fecha, formato: "fecha" },
  { clave: "tipo", titulo: "Canal", valor: (v) => etiquetaTipoPedido(v.tipo_pedido) },
  { clave: "mesa", titulo: "Mesa", valor: (v) => v.mesa },
  { clave: "mozo", titulo: "Mozo", valor: (v) => v.mozo },
  { clave: "comensales", titulo: "Comensales", valor: (v) => v.comensales, formato: "numero" },
  { clave: "medios", titulo: "Medio de pago", valor: (v) => v.medios },
  { clave: "total", titulo: "Total", valor: (v) => v.total, formato: "moneda" },
];

function armarSecciones(d: ReporteVentas) {
  const platos = d.productos.map(rentabilidadProducto);
  const categorias = ventasPorCategoria(d.productos);
  const totalPagos = sumar(d.por_medio, (m) => m.total);
  const totalVentas = d.resumen_ventas.total;
  const t = {
    cantidad: sumar(platos, (p) => p.cantidad),
    cortesias: sumar(platos, (p) => p.cortesias),
    monto: sumar(platos, (p) => p.monto),
    monto_neto: sumar(platos, (p) => p.monto_neto),
    costo_total: sumar(platos, (p) => p.costo_total),
    margen: sumar(platos, (p) => p.margen),
  };
  const r = d.resumen_ventas;
  return {
    totales: t,
    resumen: seccionResumen("Resumen de ventas", [
      { concepto: "Pedidos cobrados", valor: r.cantidad, formato: "numero" },
      { concepto: "Ventas (con IGV)", valor: r.total },
      { concepto: "IGV", valor: r.igv },
      { concepto: "Descuentos", valor: r.descuentos },
      { concepto: "Ticket promedio", valor: r.cantidad ? r.total / r.cantidad : 0 },
      { concepto: "Comensales", valor: r.comensales, formato: "numero" },
      { concepto: "Unidades vendidas", valor: t.cantidad, formato: "numero" },
      { concepto: "Margen sobre costo de receta", valor: t.margen },
      { concepto: "Margen %", valor: porcentaje(t.margen, t.monto_neto), formato: "porcentaje" },
    ]),
    platos: seccion("Platos y productos vendidos", COLUMNAS_PLATOS, platos, {
      cantidad: t.cantidad,
      cortesias: t.cortesias,
      monto: t.monto,
      monto_neto: t.monto_neto,
      costo_total: t.costo_total,
      margen: t.margen,
      margen_pct: porcentaje(t.margen, t.monto_neto),
    }),
    categorias: seccion("Ventas por categoría", COLUMNAS_CATEGORIAS, categorias, {
      cantidad: t.cantidad,
      monto: t.monto,
      costo: t.costo_total,
    }),
    medios: seccion(
      "Ventas por medio de pago",
      columnasParticipacion<VentaPorMedio>("Medio de pago", (m) => m.nombre, (m) => m.total, (m) => m.cantidad, totalPagos),
      d.por_medio,
      { cantidad: sumar(d.por_medio, (m) => m.cantidad), total: totalPagos },
    ),
    canales: seccion(
      "Ventas por canal",
      columnasParticipacion<VentaPorTipo>("Canal", (x) => etiquetaTipoPedido(x.tipo_pedido), (x) => x.total, (x) => x.cantidad, totalVentas),
      d.por_tipo,
      { cantidad: r.cantidad, total: totalVentas },
    ),
    mozos: seccion(
      "Ventas por mozo",
      columnasParticipacion<VentaPorMozo>("Mozo", (m) => m.nombre, (m) => m.total, (m) => m.cantidad, totalVentas),
      d.por_mozo,
      { cantidad: r.cantidad, total: totalVentas },
    ),
    detalle: seccion("Detalle de ventas", COLUMNAS_VENTAS, d.ventas, {
      comensales: r.comensales,
      total: totalVentas,
    }),
  };
}

export function ReporteVentasView() {
  const r = useReporte("ventas");
  const d = r.datos;
  const s = d ? armarSecciones(d) : null;

  return (
    <ReporteShell
      tipo="ventas"
      rango={r.rango}
      onRangoChange={r.cambiarRango}
      cargando={r.cargando}
      error={r.error}
      onRecargar={r.recargar}
      exportar={s ? () => [s.resumen, s.platos, s.categorias, s.medios, s.canales, s.mozos, s.detalle] : null}
      nota="El costo de cada plato es el costo actual de su receta (o el costo promedio del almacén si no tiene receta)."
    >
      {d && s && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Indicador titulo="Ventas" valor={formatoMoneda(d.resumen_ventas.total)} detalle={`${formatoNumero(d.resumen_ventas.cantidad)} pedidos cobrados`} icono="mdi:cash-register" />
            <Indicador
              titulo="Ticket promedio"
              valor={formatoMoneda(d.resumen_ventas.cantidad ? d.resumen_ventas.total / d.resumen_ventas.cantidad : 0)}
              detalle={`${formatoNumero(d.resumen_ventas.comensales)} comensales`}
              icono="mdi:receipt-text-outline"
            />
            <Indicador titulo="Platos y productos" valor={formatoNumero(s.totales.cantidad)} detalle={`${s.platos.filas.length} productos distintos`} icono="mdi:silverware-fork-knife" />
            <Indicador
              titulo="Margen sobre costo de receta"
              valor={formatoMoneda(s.totales.margen)}
              detalle={formatoPorcentaje(porcentaje(s.totales.margen, s.totales.monto_neto))}
              icono="mdi:chart-line"
              negativo={s.totales.margen < 0}
            />
          </div>

          <TablaSeccion seccion={s.platos} claveFila={(p) => p.id_producto} descripcion="Unidades vendidas, cortesías, venta y margen por producto." />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <TablaSeccion seccion={s.categorias} claveFila={(c) => c.categoria} />
            <TablaSeccion seccion={s.medios} claveFila={(m) => m.medio_pago} descripcion="El crédito es lo fiado al consorcio; se cobra luego en Cuentas por cobrar." />
            <TablaSeccion seccion={s.canales} claveFila={(x) => x.tipo_pedido} />
            <TablaSeccion seccion={s.mozos} claveFila={(m) => m.id_mozo} />
          </div>

          <TablaSeccion seccion={s.detalle} claveFila={(v) => v.id} descripcion={`${d.ventas.length} pedidos cobrados en el período.`} />
        </>
      )}
    </ReporteShell>
  );
}
