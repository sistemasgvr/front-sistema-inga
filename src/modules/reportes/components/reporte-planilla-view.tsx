"use client";

import { useReporte } from "../hooks/use-reporte";
import type { PagoPlanilla, ReportePlanilla } from "../types/reportes.types";
import { planillaPorTrabajador, sumar } from "../utils/calculos";
import { seccion, type ColumnaReporte } from "../utils/columnas";
import { formatoMoneda, formatoNumero } from "../utils/formato";
import { Indicador } from "./indicador";
import { ReporteShell } from "./reporte-shell";
import { TablaSeccion } from "./seccion-reporte";

const COLUMNAS_PAGOS: ColumnaReporte<PagoPlanilla>[] = [
  { clave: "fecha", titulo: "Fecha de pago", valor: (p) => p.fecha, formato: "fecha" },
  { clave: "trabajador", titulo: "Trabajador", valor: (p) => p.trabajador },
  { clave: "puesto", titulo: "Puesto", valor: (p) => p.puesto },
  {
    clave: "periodo",
    titulo: "Período",
    valor: (p) => `${p.quincena === 1 ? "1ra" : "2da"} quincena ${String(p.mes).padStart(2, "0")}/${p.anio}`,
  },
  { clave: "medio", titulo: "Medio", valor: (p) => p.medio },
  { clave: "monto", titulo: "Monto", valor: (p) => p.monto, formato: "moneda" },
];

type PorTrabajador = ReturnType<typeof planillaPorTrabajador>[number];

const COLUMNAS_TRABAJADOR: ColumnaReporte<PorTrabajador>[] = [
  { clave: "trabajador", titulo: "Trabajador", valor: (t) => t.trabajador },
  { clave: "pagos", titulo: "Pagos", valor: (t) => t.pagos, formato: "numero" },
  { clave: "monto", titulo: "Total pagado", valor: (t) => t.monto, formato: "moneda" },
];

function armarSecciones(d: ReportePlanilla) {
  const porTrabajador = planillaPorTrabajador(d.pagos);
  const total = sumar(d.pagos, (p) => p.monto);
  return {
    total,
    porTrabajador: seccion("Planilla por trabajador", COLUMNAS_TRABAJADOR, porTrabajador, { pagos: d.pagos.length, monto: total }),
    pagos: seccion("Pagos de planilla", COLUMNAS_PAGOS, d.pagos, { monto: total }),
  };
}

export function ReportePlanillaView() {
  const r = useReporte("planilla");
  const d = r.datos;
  const s = d ? armarSecciones(d) : null;

  return (
    <ReporteShell
      tipo="planilla"
      rango={r.rango}
      onRangoChange={r.cambiarRango}
      cargando={r.cargando}
      error={r.error}
      onRecargar={r.recargar}
      exportar={s ? () => [s.porTrabajador, s.pagos] : null}
      nota="Pagos registrados con fecha de pago dentro del período."
    >
      {d && s && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Indicador titulo="Total pagado" valor={formatoMoneda(s.total)} icono="mdi:account-cash-outline" />
            <Indicador titulo="Pagos" valor={formatoNumero(d.pagos.length)} icono="mdi:receipt-text-outline" />
            <Indicador titulo="Trabajadores pagados" valor={formatoNumero(s.porTrabajador.filas.length)} icono="mdi:account-group-outline" />
          </div>

          <TablaSeccion seccion={s.porTrabajador} claveFila={(t) => t.trabajador} />
          <TablaSeccion seccion={s.pagos} claveFila={(p) => p.id} />
        </>
      )}
    </ReporteShell>
  );
}
