"use client";

import { useReporte } from "../hooks/use-reporte";
import type { GastoAdministrativo, GastoDiarioDia, GastoDiarioItem, ReporteGastos } from "../types/reportes.types";
import { gastosAdministrativosPorCategoria, redondear, sumar } from "../utils/calculos";
import { seccion, seccionResumen, type ColumnaReporte } from "../utils/columnas";
import { formatoMoneda, formatoNumero } from "../utils/formato";
import { Indicador } from "./indicador";
import { ReporteShell } from "./reporte-shell";
import { TablaSeccion } from "./seccion-reporte";
import { plural } from "@/shared/utils/plural";

const COLUMNAS_DIAS: ColumnaReporte<GastoDiarioDia>[] = [
  { clave: "fecha", titulo: "Fecha", valor: (g) => g.fecha, formato: "fecha" },
  { clave: "efectivo", titulo: "Efectivo", valor: (g) => g.efectivo, formato: "moneda" },
  { clave: "yape", titulo: "Yape", valor: (g) => g.yape, formato: "moneda" },
  { clave: "credito", titulo: "Crédito proveedor", valor: (g) => g.credito, formato: "moneda" },
  { clave: "total", titulo: "Total", valor: (g) => g.total, formato: "moneda" },
];

const COLUMNAS_ITEMS: ColumnaReporte<GastoDiarioItem>[] = [
  { clave: "item", titulo: "Insumo / producto", valor: (g) => g.item },
  { clave: "categoria", titulo: "Categoría", valor: (g) => g.categoria },
  { clave: "compras", titulo: "Compras", valor: (g) => g.compras, formato: "numero" },
  { clave: "credito", titulo: "A crédito", valor: (g) => g.credito, formato: "moneda" },
  { clave: "total", titulo: "Total", valor: (g) => g.total, formato: "moneda" },
];

type Categoria = ReturnType<typeof gastosAdministrativosPorCategoria>[number];

const COLUMNAS_CATEGORIAS: ColumnaReporte<Categoria>[] = [
  { clave: "categoria", titulo: "Categoría", valor: (c) => c.categoria },
  { clave: "gastos", titulo: "Gastos", valor: (c) => c.gastos, formato: "numero" },
  { clave: "fijos", titulo: "Fijos", valor: (c) => c.fijos, formato: "moneda" },
  { clave: "variables", titulo: "Variables", valor: (c) => c.variables, formato: "moneda" },
  { clave: "monto", titulo: "Total", valor: (c) => c.monto, formato: "moneda" },
];

const COLUMNAS_ADMIN: ColumnaReporte<GastoAdministrativo>[] = [
  { clave: "fecha", titulo: "Fecha", valor: (g) => g.fecha, formato: "fecha" },
  { clave: "categoria", titulo: "Categoría", valor: (g) => g.categoria },
  { clave: "subcategoria", titulo: "Subcategoría", valor: (g) => g.subcategoria },
  { clave: "tipo", titulo: "Tipo", valor: (g) => (g.tipo_gasto === 1 ? "Fijo" : "Variable") },
  { clave: "concepto", titulo: "Concepto", valor: (g) => g.concepto },
  { clave: "medio", titulo: "Medio", valor: (g) => g.medio },
  { clave: "comprobante", titulo: "Comprobante", valor: (g) => g.num_comprobante },
  { clave: "monto", titulo: "Monto", valor: (g) => g.monto, formato: "moneda" },
];

function armarSecciones(d: ReporteGastos) {
  // Los días abiertos sin compras no aportan nada al reporte.
  const dias = d.gastos_diarios.filter((g) => g.total > 0);
  const categorias = gastosAdministrativosPorCategoria(d.gastos_administrativos);
  const t = {
    diarios: sumar(dias, (g) => g.total),
    credito: sumar(dias, (g) => g.credito),
    admin: sumar(d.gastos_administrativos, (g) => g.monto),
  };
  return {
    totales: t,
    dias,
    resumen: seccionResumen("Resumen de gastos", [
      { concepto: "Compras del día", valor: t.diarios },
      { concepto: "De ellas, a crédito de proveedor", valor: t.credito },
      { concepto: "Gastos administrativos", valor: t.admin },
      { concepto: "Total de gastos", valor: redondear(t.diarios + t.admin) },
    ]),
    porDia: seccion("Compras del día por fecha", COLUMNAS_DIAS, dias, {
      efectivo: sumar(dias, (g) => g.efectivo),
      yape: sumar(dias, (g) => g.yape),
      credito: t.credito,
      total: t.diarios,
    }),
    porItem: seccion("Compras del día por insumo", COLUMNAS_ITEMS, d.gastos_diarios_items, {
      compras: sumar(d.gastos_diarios_items, (g) => g.compras),
      credito: sumar(d.gastos_diarios_items, (g) => g.credito),
      total: sumar(d.gastos_diarios_items, (g) => g.total),
    }),
    categorias: seccion("Gastos administrativos por categoría", COLUMNAS_CATEGORIAS, categorias, {
      gastos: d.gastos_administrativos.length,
      fijos: sumar(categorias, (c) => c.fijos),
      variables: sumar(categorias, (c) => c.variables),
      monto: t.admin,
    }),
    detalle: seccion("Detalle de gastos administrativos", COLUMNAS_ADMIN, d.gastos_administrativos, { monto: t.admin }),
  };
}

export function ReporteGastosView() {
  const r = useReporte("gastos");
  const d = r.datos;
  const s = d ? armarSecciones(d) : null;

  return (
    <ReporteShell
      tipo="gastos"
      rango={r.rango}
      onRangoChange={r.cambiarRango}
      cargando={r.cargando}
      error={r.error}
      onRecargar={r.recargar}
      exportar={s ? () => [s.resumen, s.porDia, s.porItem, s.categorias, s.detalle] : null}
      nota="La planilla tiene su propio reporte; el reporte general reúne gastos y planilla."
    >
      {d && s && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Indicador titulo="Total de gastos" valor={formatoMoneda(s.totales.diarios + s.totales.admin)} icono="mdi:cash-minus" />
            <Indicador titulo="Compras del día" valor={formatoMoneda(s.totales.diarios)} detalle={`${plural(s.dias.length, "día", "días")} con compras`} icono="mdi:cart-outline" />
            <Indicador titulo="A crédito de proveedor" valor={formatoMoneda(s.totales.credito)} detalle="Pasa a Cuentas por pagar" icono="mdi:truck-outline" />
            <Indicador
              titulo="Gastos administrativos"
              valor={formatoMoneda(s.totales.admin)}
              detalle={`${formatoNumero(d.gastos_administrativos.length)} registros`}
              icono="mdi:office-building-outline"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <TablaSeccion seccion={s.porDia} claveFila={(g) => g.fecha} />
            <TablaSeccion seccion={s.porItem} claveFila={(g) => `${g.categoria}|${g.item}`} />
          </div>

          <TablaSeccion seccion={s.categorias} claveFila={(c) => c.categoria} />
          <TablaSeccion seccion={s.detalle} claveFila={(g) => g.id} />
        </>
      )}
    </ReporteShell>
  );
}
