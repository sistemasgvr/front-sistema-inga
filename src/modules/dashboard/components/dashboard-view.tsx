"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { DateRangePicker } from "@/components/form/DateRangePicker";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { getStoredUser } from "@/modules/auth";
import {
  estadoResultados,
  formatoMoneda,
  formatoNumero,
  formatoPorcentaje,
  Indicador,
  type Granularidad,
} from "@/modules/reportes";
import { hoyIso } from "@/shared/utils/fecha";
import { useDashboard } from "../hooks/use-dashboard";
import { GraficosDashboard } from "./graficos-dashboard";

const GRANULARIDADES: { valor: Granularidad; etiqueta: string }[] = [
  { valor: "dia", etiqueta: "Día" },
  { valor: "semana", etiqueta: "Semana" },
  { valor: "mes", etiqueta: "Mes" },
];

export function DashboardView() {
  const [name, setName] = useState("Usuario");
  const d = useDashboard();
  const hoy = useMemo(() => hoyIso(), []);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      const displayName = user.nombres
        ? `${user.nombres} ${user.apellidos}`.trim()
        : user.username;

      setName(displayName);
    }
  }, []);

  const estado = d.datos ? estadoResultados(d.datos) : null;

  return (
    <div>
      <PageBreadcrumb pageTitle="Dashboard" />

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          Bienvenido, {name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {d.permitido ? (
            <>
              Ventas, platos, gastos y rentabilidad de Ingá. Para el detalle y la exportación a Excel, ve a{" "}
              <Link href="/reportes" className="text-brand-500 hover:underline">
                Reportes
              </Link>
              .
            </>
          ) : (
            "Tu rol no tiene acceso a los indicadores del negocio (permiso «Ver dashboard gerencial»)."
          )}
        </p>
      </div>

      {d.permitido && (
        <>
          <div className="mb-5 flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-72">
              <DateRangePicker label="Período" value={d.rango} onChange={d.cambiarRango} max={hoy} />
            </div>
            <div role="group" aria-label="Agrupar por" className="inline-flex rounded-lg border border-gray-300 p-0.5 dark:border-gray-700">
              {GRANULARIDADES.map((g) => (
                <button
                  key={g.valor}
                  type="button"
                  aria-pressed={d.granularidad === g.valor}
                  onClick={() => d.cambiarGranularidad(g.valor)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    d.granularidad === g.valor
                      ? "bg-brand-500 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
                >
                  {g.etiqueta}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={d.recargar}
              disabled={d.cargando}
              startIcon={<Icon name="mdi:refresh" size={18} aria-hidden="true" />}
            >
              Actualizar
            </Button>
          </div>

          {!d.completo ? (
            <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Elige la fecha final del período.</p>
          ) : d.error ? (
            <div className="rounded-2xl border border-error-200 bg-error-50 p-5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              <p className="font-medium">No se pudieron cargar los indicadores.</p>
              <p className="mt-1">{d.error}</p>
            </div>
          ) : d.cargando || !d.datos || !estado ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500 dark:text-gray-400" role="status">
              <Icon name="mdi:loading" className="animate-spin" size={20} aria-hidden="true" />
              Cargando indicadores…
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Indicador
                  titulo="Ventas"
                  valor={formatoMoneda(estado.ventas_brutas)}
                  detalle={`Sin IGV: ${formatoMoneda(estado.ventas_netas)}`}
                  icono="mdi:cash-register"
                />
                <Indicador
                  titulo="Ticket promedio"
                  valor={formatoMoneda(estado.ticket_promedio)}
                  detalle={`${formatoNumero(estado.cantidad_ventas)} pedidos cobrados`}
                  icono="mdi:receipt-text-outline"
                />
                <Indicador
                  titulo="Margen bruto"
                  valor={formatoMoneda(estado.margen_bruto)}
                  detalle={`${formatoPorcentaje(estado.margen_bruto_pct)} · costo de recetas ${formatoMoneda(estado.costo_ventas)}`}
                  icono="mdi:chart-line"
                  negativo={estado.margen_bruto < 0}
                />
                <Indicador
                  titulo="Utilidad operativa"
                  valor={formatoMoneda(estado.utilidad_operativa)}
                  detalle={`${formatoPorcentaje(estado.utilidad_pct)} · gastos ${formatoMoneda(estado.total_gastos)}`}
                  icono="mdi:finance"
                  negativo={estado.utilidad_operativa < 0}
                />
                <Indicador
                  titulo="Comensales"
                  valor={formatoNumero(estado.comensales)}
                  detalle={`Consumo por comensal: ${formatoMoneda(estado.consumo_por_comensal)}`}
                  icono="mdi:account-group-outline"
                />
                <Indicador titulo="Compras del día" valor={formatoMoneda(estado.gastos_diarios)} icono="mdi:cart-outline" />
                <Indicador titulo="Gastos administrativos" valor={formatoMoneda(estado.gastos_administrativos)} icono="mdi:office-building-outline" />
                <Indicador titulo="Planilla" valor={formatoMoneda(estado.planilla)} icono="mdi:account-cash-outline" />
              </div>

              <GraficosDashboard datos={d.datos} desde={d.rango.desde} hasta={d.rango.hasta} granularidad={d.granularidad} />

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Margen bruto = ventas sin IGV − costo actual de las recetas de lo vendido. Utilidad operativa = ventas sin IGV −
                (compras del día + gastos administrativos + planilla). Son dos miradas distintas: no se restan juntas.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
