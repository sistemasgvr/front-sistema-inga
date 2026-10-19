"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { DateRangePicker } from "@/components/form/DateRangePicker";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { NavTabs } from "@/components/ui/table/NavTabs";
import { getStoredUser } from "@/modules/auth";
import {
  estadoResultados,
  formatoMoneda,
  formatoNumero,
  formatoPorcentaje,
  Indicador,
  useSesionCliente,
  type Granularidad,
} from "@/modules/reportes";
import { formatearRango, hoyIso } from "@/shared/utils/fecha";
import { useDashboard } from "../hooks/use-dashboard";
import { ayudasDashboard } from "../utils/ayudas";
import { PestanaGastos } from "./pestana-gastos";
import { PestanaMozos } from "./pestana-mozos";
import { PestanaPlatos } from "./pestana-platos";
import { PestanaResumen } from "./pestana-resumen";
import { PestanaVentas } from "./pestana-ventas";

const GRANULARIDADES: { valor: Granularidad; etiqueta: string }[] = [
  { valor: "dia", etiqueta: "Día" },
  { valor: "semana", etiqueta: "Semana" },
  { valor: "mes", etiqueta: "Mes" },
];

type Pestana = "resumen" | "ventas" | "platos" | "mozos" | "gastos";

const PESTANAS: { id: Pestana; label: string; icono: string }[] = [
  { id: "resumen", label: "Resumen", icono: "mdi:chart-areaspline" },
  { id: "ventas", label: "Ventas", icono: "mdi:cash-register" },
  { id: "platos", label: "Platos", icono: "mdi:silverware-fork-knife" },
  { id: "mozos", label: "Mozos", icono: "mdi:account-tie-outline" },
  { id: "gastos", label: "Gastos", icono: "mdi:cash-minus" },
];

/** Pestañas con gráficos en el tiempo: solo en ellas tiene sentido agrupar por día, semana o mes. */
const CON_GRANULARIDAD: Pestana[] = ["resumen", "gastos"];

/** Nombre para el saludo, leído de la sesión del navegador. */
function nombreUsuario(): string {
  const user = getStoredUser();
  if (!user) return "Usuario";
  return user.nombres ? `${user.nombres} ${user.apellidos}`.trim() : user.username;
}

export function DashboardView() {
  // En el servidor no hay sesión: "Usuario" hasta hidratar, sin desajuste de HTML.
  const name = useSesionCliente(nombreUsuario, "Usuario");
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const d = useDashboard();
  const hoy = useMemo(() => hoyIso(), []);

  const estado = d.datos ? estadoResultados(d.datos) : null;
  const periodo = formatearRango(d.rango);
  const ayudas = ayudasDashboard(periodo);

  return (
    <div>
      <PageBreadcrumb pageTitle="Dashboard" />

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          Bienvenido, {name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {/* null = todavía no se leyó la sesión (servidor e hidratación). */}
          {d.permitido === null ? (
            "Cargando tu panel…"
          ) : d.permitido ? (
            <>
              Ventas, platos, mozos, gastos y rentabilidad de Ingá. Pasa el cursor por el ícono{" "}
              <Icon name="mdi:help-circle-outline" size={14} className="inline" aria-hidden="true" /> de cada cifra para ver cómo se
              calcula. Para el detalle y la exportación a Excel, ve a{" "}
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

      {d.permitido === true && (
        <>
          <div className="mb-5 flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-72">
              <DateRangePicker label="Período" value={d.rango} onChange={d.cambiarRango} max={hoy} />
            </div>
            {CON_GRANULARIDAD.includes(pestana) && (
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
            )}
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
                  titulo="Ventas totales"
                  valor={formatoMoneda(estado.ventas_brutas)}
                  detalle={`Con IGV. Sin IGV: ${formatoMoneda(estado.ventas_netas)} (la misma venta, no se suma)`}
                  icono="mdi:cash-register"
                  ayuda={ayudas.ventas}
                />
                <Indicador
                  titulo="Ticket promedio"
                  valor={formatoMoneda(estado.ticket_promedio)}
                  detalle={`Ventas ÷ ${formatoNumero(estado.cantidad_ventas)} pedidos cobrados`}
                  icono="mdi:receipt-text-outline"
                  ayuda={ayudas.ticket}
                />
                <Indicador
                  titulo="Margen bruto"
                  valor={formatoMoneda(estado.margen_bruto)}
                  detalle={`${formatoPorcentaje(estado.margen_bruto_pct)} · costo de recetas ${formatoMoneda(estado.costo_ventas)}`}
                  icono="mdi:chart-line"
                  ayuda={ayudas.margen}
                  negativo={estado.margen_bruto < 0}
                />
                <Indicador
                  titulo="Utilidad operativa"
                  valor={formatoMoneda(estado.utilidad_operativa)}
                  detalle={`${formatoPorcentaje(estado.utilidad_pct)} · gastos ${formatoMoneda(estado.total_gastos)}`}
                  icono="mdi:finance"
                  ayuda={ayudas.utilidad}
                  negativo={estado.utilidad_operativa < 0}
                />
              </div>

              <NavTabs
                tabs={PESTANAS.map((p) => ({ id: p.id, label: p.label, icon: <Icon name={p.icono} size={16} aria-hidden="true" /> }))}
                activeTab={pestana}
                onChange={(id: Pestana) => setPestana(id)}
              />

              {/* Solo se monta la pestaña visible: los gráficos toman el ancho real al aparecer. */}
              {pestana === "resumen" && (
                <PestanaResumen
                  datos={d.datos}
                  desde={d.rango.desde}
                  hasta={d.rango.hasta}
                  granularidad={d.granularidad}
                  ayudaFlujo={ayudas.ingresosGastos}
                />
              )}
              {pestana === "ventas" && <PestanaVentas datos={d.datos} estado={estado} ayudas={ayudas} />}
              {pestana === "platos" && <PestanaPlatos datos={d.datos} />}
              {pestana === "mozos" && <PestanaMozos datos={d.datos} />}
              {pestana === "gastos" && (
                <PestanaGastos
                  datos={d.datos}
                  estado={estado}
                  desde={d.rango.desde}
                  hasta={d.rango.hasta}
                  granularidad={d.granularidad}
                  periodo={periodo}
                  ayudas={ayudas}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
