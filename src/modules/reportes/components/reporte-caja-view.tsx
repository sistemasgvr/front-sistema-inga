"use client";

import { useReporte } from "../hooks/use-reporte";
import type { MovimientoCaja, ReporteCaja, TurnoReporte } from "../types/reportes.types";
import { resumenCaja, sumar } from "../utils/calculos";
import { seccion, seccionResumen, type ColumnaReporte } from "../utils/columnas";
import { formatoMoneda, formatoNumero } from "../utils/formato";
import { Indicador } from "./indicador";
import { ReporteShell } from "./reporte-shell";
import { TablaSeccion } from "./seccion-reporte";

const COLUMNAS_TURNOS: ColumnaReporte<TurnoReporte>[] = [
  { clave: "caja", titulo: "Caja", valor: (t) => t.caja },
  { clave: "cajero", titulo: "Cajero", valor: (t) => t.cajero },
  { clave: "apertura", titulo: "Apertura", valor: (t) => t.fecha_apertura, formato: "fecha" },
  { clave: "cierre", titulo: "Cierre", valor: (t) => t.fecha_cierre ?? "Abierto", formato: "fecha" },
  { clave: "monto_apertura", titulo: "Fondo inicial", valor: (t) => t.monto_apertura, formato: "moneda" },
  { clave: "efectivo", titulo: "Ventas efectivo", valor: (t) => t.totales?.ventas_efectivo, formato: "moneda" },
  { clave: "yape", titulo: "Yape", valor: (t) => t.totales?.ventas_yape, formato: "moneda" },
  { clave: "tarjeta", titulo: "Tarjeta", valor: (t) => t.totales?.ventas_tarjeta, formato: "moneda" },
  { clave: "credito", titulo: "Crédito", valor: (t) => t.totales?.ventas_credito, formato: "moneda" },
  { clave: "ventas", titulo: "Total ventas", valor: (t) => t.totales?.total_ventas, formato: "moneda" },
  { clave: "esperado", titulo: "Efectivo esperado", valor: (t) => t.totales?.efectivo_esperado, formato: "moneda" },
  { clave: "declarado", titulo: "Declarado", valor: (t) => t.monto_declarado, formato: "moneda" },
  { clave: "diferencia", titulo: "Diferencia", valor: (t) => t.monto_diferencia, formato: "moneda" },
];

const COLUMNAS_MOVIMIENTOS: ColumnaReporte<MovimientoCaja>[] = [
  { clave: "fecha", titulo: "Fecha", valor: (m) => m.fecha, formato: "fecha" },
  { clave: "caja", titulo: "Caja", valor: (m) => m.caja },
  { clave: "tipo", titulo: "Tipo", valor: (m) => (m.tipo_movimiento === 1 ? "Ingreso" : "Egreso") },
  { clave: "motivo", titulo: "Motivo", valor: (m) => m.motivo },
  { clave: "usuario", titulo: "Registró", valor: (m) => m.usuario },
  { clave: "monto", titulo: "Monto", valor: (m) => m.monto, formato: "moneda" },
];

function armarSecciones(d: ReporteCaja) {
  const resumen = resumenCaja(d.turnos);
  const ingresos = sumar(d.movimientos, (m) => (m.tipo_movimiento === 1 ? m.monto : 0));
  const egresos = sumar(d.movimientos, (m) => (m.tipo_movimiento === 2 ? m.monto : 0));
  return {
    resumen,
    ingresos,
    egresos,
    tablaResumen: seccionResumen("Resumen de caja", [
      { concepto: "Turnos", valor: resumen.turnos, formato: "numero" },
      { concepto: "Turnos abiertos", valor: resumen.abiertos, formato: "numero" },
      { concepto: "Ventas cobradas", valor: resumen.ventas },
      { concepto: "Ventas en efectivo", valor: resumen.ventas_efectivo },
      { concepto: "Faltantes", valor: resumen.faltantes },
      { concepto: "Sobrantes", valor: resumen.sobrantes },
      { concepto: "Faltante neto", valor: resumen.diferencia_neta },
      { concepto: "Ingresos manuales", valor: ingresos },
      { concepto: "Egresos manuales", valor: egresos },
    ]),
    turnos: seccion("Turnos y cierres", COLUMNAS_TURNOS, d.turnos, {
      efectivo: resumen.ventas_efectivo,
      yape: sumar(d.turnos, (t) => t.totales?.ventas_yape),
      tarjeta: sumar(d.turnos, (t) => t.totales?.ventas_tarjeta),
      credito: sumar(d.turnos, (t) => t.totales?.ventas_credito),
      ventas: resumen.ventas,
      diferencia: resumen.diferencia_neta,
    }),
    movimientos: seccion("Movimientos manuales de caja", COLUMNAS_MOVIMIENTOS, d.movimientos),
  };
}

export function ReporteCajaView() {
  const r = useReporte("caja");
  const d = r.datos;
  const s = d ? armarSecciones(d) : null;

  return (
    <ReporteShell
      tipo="caja"
      rango={r.rango}
      onRangoChange={r.cambiarRango}
      cargando={r.cargando}
      error={r.error}
      onRecargar={r.recargar}
      exportar={s ? () => [s.tablaResumen, s.turnos, s.movimientos] : null}
      nota="Turnos abiertos en el período. La diferencia es el efectivo esperado menos lo declarado: positiva = faltante, negativa = sobrante."
    >
      {d && s && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Indicador
              titulo="Turnos"
              valor={formatoNumero(s.resumen.turnos)}
              detalle={`${s.resumen.cerrados} cerrados · ${s.resumen.abiertos} abiertos`}
              icono="mdi:cash-clock"
            />
            <Indicador titulo="Ventas cobradas" valor={formatoMoneda(s.resumen.ventas)} detalle={`Efectivo: ${formatoMoneda(s.resumen.ventas_efectivo)}`} icono="mdi:cash-register" />
            <Indicador
              titulo="Faltante neto"
              valor={formatoMoneda(s.resumen.diferencia_neta)}
              detalle={`Faltantes ${formatoMoneda(s.resumen.faltantes)} · Sobrantes ${formatoMoneda(s.resumen.sobrantes)}`}
              icono="mdi:scale-balance"
              negativo={s.resumen.diferencia_neta > 0}
            />
            <Indicador
              titulo="Movimientos manuales"
              valor={formatoMoneda(s.ingresos - s.egresos)}
              detalle={`Ingresos ${formatoMoneda(s.ingresos)} · Egresos ${formatoMoneda(s.egresos)}`}
              icono="mdi:swap-vertical"
            />
          </div>

          <TablaSeccion seccion={s.turnos} claveFila={(t) => t.id} />
          <TablaSeccion seccion={s.movimientos} claveFila={(m) => m.id} descripcion="Ingresos y retiros registrados a mano en los turnos." />
        </>
      )}
    </ReporteShell>
  );
}
