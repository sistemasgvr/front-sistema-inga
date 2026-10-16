"use client";

import { useReporte } from "../hooks/use-reporte";
import type { CuentaReporte, ReporteCuentas } from "../types/reportes.types";
import { resumenCuentas, sumar } from "../utils/calculos";
import { seccion, type ColumnaReporte } from "../utils/columnas";
import { formatoMoneda } from "../utils/formato";
import { Indicador } from "./indicador";
import { ReporteShell } from "./reporte-shell";
import { TablaSeccion } from "./seccion-reporte";

const columnas = (persona: string, conConvenio: boolean): ColumnaReporte<CuentaReporte>[] => [
  { clave: "nombre", titulo: persona, valor: (c) => c.nombre },
  { clave: "documento", titulo: "Documento", valor: (c) => c.num_documento },
  ...(conConvenio ? [{ clave: "convenio", titulo: "Convenio", valor: (c: CuentaReporte) => c.convenio ?? null }] : []),
  { clave: "cargos", titulo: "Cargos del período", valor: (c) => c.cargos_periodo, formato: "moneda" },
  { clave: "abonos", titulo: "Abonos del período", valor: (c) => c.abonos_periodo, formato: "moneda" },
  { clave: "ajustes", titulo: "Ajustes del período", valor: (c) => c.ajustes_periodo, formato: "moneda" },
  { clave: "saldo", titulo: "Saldo actual", valor: (c) => c.saldo, formato: "moneda" },
];

const totalesCuentas = (filas: CuentaReporte[]) => ({
  cargos: sumar(filas, (c) => c.cargos_periodo),
  abonos: sumar(filas, (c) => c.abonos_periodo),
  ajustes: sumar(filas, (c) => c.ajustes_periodo),
  saldo: sumar(filas, (c) => c.saldo),
});

function armarSecciones(d: ReporteCuentas) {
  return {
    cxc: resumenCuentas(d.por_cobrar),
    cxp: resumenCuentas(d.por_pagar),
    porCobrar: seccion("Cuentas por cobrar", columnas("Cliente", true), d.por_cobrar, totalesCuentas(d.por_cobrar)),
    porPagar: seccion("Cuentas por pagar", columnas("Proveedor", false), d.por_pagar, totalesCuentas(d.por_pagar)),
  };
}

export function ReporteCuentasView() {
  const r = useReporte("cuentas");
  const d = r.datos;
  const s = d ? armarSecciones(d) : null;

  return (
    <ReporteShell
      tipo="cuentas"
      rango={r.rango}
      onRangoChange={r.cambiarRango}
      cargando={r.cargando}
      error={r.error}
      onRecargar={r.recargar}
      exportar={s ? () => [s.porCobrar, s.porPagar] : null}
      nota="El saldo es el actual. Los cargos y abonos son los del período elegido."
    >
      {d && s && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Indicador titulo="Nos deben (CxC)" valor={formatoMoneda(s.cxc.saldo)} detalle={`${s.cxc.con_saldo} clientes con saldo`} icono="mdi:cash-plus" />
            <Indicador titulo="Cobrado en el período" valor={formatoMoneda(s.cxc.abonos)} detalle={`Fiado: ${formatoMoneda(s.cxc.cargos)}`} icono="mdi:hand-coin-outline" />
            <Indicador titulo="Debemos (CxP)" valor={formatoMoneda(s.cxp.saldo)} detalle={`${s.cxp.con_saldo} proveedores con saldo`} icono="mdi:cash-remove" />
            <Indicador titulo="Pagado en el período" valor={formatoMoneda(s.cxp.abonos)} detalle={`Compras a crédito: ${formatoMoneda(s.cxp.cargos)}`} icono="mdi:truck-outline" />
          </div>

          <TablaSeccion seccion={s.porCobrar} claveFila={(c) => c.id_persona} descripcion="Consumos a crédito del consorcio y sus abonos." vacio="Sin deudas ni movimientos." />
          <TablaSeccion seccion={s.porPagar} claveFila={(c) => c.id_persona} descripcion="Compras a crédito a proveedores y sus pagos." vacio="Sin deudas ni movimientos." />
        </>
      )}
    </ReporteShell>
  );
}
