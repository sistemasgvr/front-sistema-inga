"use client";

import { useReporte } from "../hooks/use-reporte";
import type { ReporteGeneral, VentaPorMedio } from "../types/reportes.types";
import {
  estadoResultados,
  lineasEstadoResultados,
  rentabilidadProducto,
  resumenCaja,
  resumenCuentas,
  resumenInventario,
  sumar,
  type LineaResultado,
  type ProductoRentabilidad,
} from "../utils/calculos";
import { seccion, seccionResumen, type ColumnaReporte } from "../utils/columnas";
import { formatoMoneda, formatoNumero, formatoPorcentaje } from "../utils/formato";
import { Indicador } from "./indicador";
import { ReporteShell } from "./reporte-shell";
import { TablaSeccion } from "./seccion-reporte";

const COLUMNAS_RESULTADO: ColumnaReporte<LineaResultado>[] = [
  { clave: "concepto", titulo: "Concepto", valor: (l) => l.concepto },
  { clave: "monto", titulo: "Monto", valor: (l) => l.monto, formato: "moneda" },
  { clave: "pct", titulo: "% de ventas sin IGV", valor: (l) => l.pct, formato: "porcentaje" },
];

const COLUMNAS_MEDIOS: ColumnaReporte<VentaPorMedio>[] = [
  { clave: "nombre", titulo: "Medio de pago", valor: (m) => m.nombre },
  { clave: "cantidad", titulo: "Operaciones", valor: (m) => m.cantidad, formato: "numero" },
  { clave: "total", titulo: "Monto", valor: (m) => m.total, formato: "moneda" },
];

const COLUMNAS_TOP: ColumnaReporte<ProductoRentabilidad>[] = [
  { clave: "nombre", titulo: "Producto", valor: (p) => p.nombre },
  { clave: "cantidad", titulo: "Cantidad", valor: (p) => p.cantidad, formato: "numero" },
  { clave: "monto", titulo: "Venta", valor: (p) => p.monto, formato: "moneda" },
  { clave: "margen", titulo: "Margen", valor: (p) => p.margen, formato: "moneda" },
  { clave: "margen_pct", titulo: "Margen %", valor: (p) => p.margen_pct, formato: "porcentaje" },
];

function armarSecciones(d: ReporteGeneral) {
  const estado = estadoResultados(d);
  const caja = resumenCaja(d.turnos);
  const cxc = resumenCuentas(d.por_cobrar);
  const cxp = resumenCuentas(d.por_pagar);
  const inventario = resumenInventario(d.stock);
  const top = d.productos
    .map(rentabilidadProducto)
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 10);
  return {
    estado,
    resultados: seccion("Estado de resultados", COLUMNAS_RESULTADO, lineasEstadoResultados(estado)),
    indicadores: seccionResumen("Indicadores", [
      { concepto: "Pedidos cobrados", valor: estado.cantidad_ventas, formato: "numero" },
      { concepto: "Comensales", valor: estado.comensales, formato: "numero" },
      { concepto: "Ticket promedio", valor: estado.ticket_promedio },
      { concepto: "Consumo por comensal", valor: estado.consumo_por_comensal },
      { concepto: "Descuentos otorgados", valor: estado.descuentos },
    ]),
    medios: seccion("Cobros por medio de pago", COLUMNAS_MEDIOS, d.por_medio, {
      cantidad: sumar(d.por_medio, (m) => m.cantidad),
      total: sumar(d.por_medio, (m) => m.total),
    }),
    posicion: seccionResumen("Caja, cuentas e inventario", [
      { concepto: "Turnos de caja en el período", valor: caja.turnos, formato: "numero" },
      { concepto: "Faltantes de caja", valor: caja.faltantes },
      { concepto: "Sobrantes de caja", valor: caja.sobrantes },
      { concepto: "Cobrado de cuentas por cobrar", valor: cxc.abonos },
      { concepto: "Saldo por cobrar (actual)", valor: cxc.saldo },
      { concepto: "Pagado a proveedores", valor: cxp.abonos },
      { concepto: "Saldo por pagar (actual)", valor: cxp.saldo },
      { concepto: "Inventario valorizado (actual)", valor: inventario.valorizado },
      { concepto: "Productos bajo stock mínimo", valor: inventario.bajo_minimo, formato: "numero" },
    ]),
    top: seccion("Top 10 productos por venta", COLUMNAS_TOP, top),
  };
}

export function ReporteGeneralView() {
  const r = useReporte("general");
  const s = r.datos ? armarSecciones(r.datos) : null;
  const e = s?.estado;

  return (
    <ReporteShell
      tipo="general"
      rango={r.rango}
      onRangoChange={r.cambiarRango}
      cargando={r.cargando}
      error={r.error}
      onRecargar={r.recargar}
      exportar={s ? () => [s.resultados, s.indicadores, s.medios, s.posicion, s.top] : null}
      nota="El margen bruto usa el costo actual de las recetas. La utilidad operativa resta lo efectivamente gastado (compras del día, gastos administrativos y planilla); no se restan ambos para no contar dos veces los insumos."
    >
      {s && e && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Indicador titulo="Ventas" valor={formatoMoneda(e.ventas_brutas)} detalle={`${formatoNumero(e.cantidad_ventas)} pedidos · ticket ${formatoMoneda(e.ticket_promedio)}`} icono="mdi:cash-register" />
            <Indicador
              titulo="Margen bruto"
              valor={formatoMoneda(e.margen_bruto)}
              detalle={`${formatoPorcentaje(e.margen_bruto_pct)} de la venta sin IGV`}
              icono="mdi:chart-line"
              negativo={e.margen_bruto < 0}
            />
            <Indicador titulo="Gastos pagados" valor={formatoMoneda(e.total_gastos)} detalle="Compras + administrativos + planilla" icono="mdi:cash-minus" />
            <Indicador
              titulo="Utilidad operativa"
              valor={formatoMoneda(e.utilidad_operativa)}
              detalle={`${formatoPorcentaje(e.utilidad_pct)} de la venta sin IGV`}
              icono="mdi:finance"
              negativo={e.utilidad_operativa < 0}
            />
          </div>

          <TablaSeccion seccion={s.resultados} claveFila={(l) => l.concepto} />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <TablaSeccion seccion={s.medios} claveFila={(m) => m.medio_pago} />
            <TablaSeccion seccion={s.posicion} claveFila={(p) => p.concepto} />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <TablaSeccion seccion={s.indicadores} claveFila={(p) => p.concepto} />
            <TablaSeccion seccion={s.top} claveFila={(p) => p.id_producto} />
          </div>
        </>
      )}
    </ReporteShell>
  );
}
