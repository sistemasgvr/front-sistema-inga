"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Pagination from "@/components/tables/Pagination";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGastos } from "../hooks/use-gastos";
import { MESES, TIPO_GASTO, TIPOS_GASTO } from "../types/gastos.types";
import { etiquetaMes, formatearFecha, formatearSoles } from "../utils/formato";
import { GastoFormModal } from "./gasto-form-modal";

export function GastosView() {
  const {
    anio,
    mes,
    cambiarPeriodo,
    tipoFiltro,
    filtrarPorTipo,
    registros,
    total,
    pagina,
    setPagina,
    pageSize,
    setPageSize,
    totalPages,
    searchInput,
    setSearchInput,
    resumen,
    reporte,
    categorias,
    turnoAbierto,
    isLoading,
    isSaving,
    feedback,
    clearFeedback,
    editing,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    save,
    confirmGasto,
    isConfirmOpen,
    isAnulando,
    abrirConfirmAnular,
    cerrarConfirmAnular,
    confirmarAnular,
  } = useGastos();

  const anioActual = new Date().getFullYear();
  const anios = [anioActual, anioActual - 1, anioActual - 2];
  const variacion = reporte?.variacion_porcentual ?? null;

  return (
    <div>
      <PageBreadcrumb pageTitle="Gastos administrativos" />

      {feedback && (
        <div className="mb-5">
          <Alert
            variant={feedback.variant}
            title={feedback.title}
            message={feedback.message}
          />
          <button
            type="button"
            onClick={clearFeedback}
            className="mt-2 text-xs text-gray-500 underline"
          >
            Cerrar aviso
          </button>
        </div>
      )}

      {/* El período manda sobre todo lo demás: estos gastos se revisan al
          cerrar el mes, no día a día. */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <Icon name="mdi:calendar-month-outline" size={18} className="text-gray-400" />
          <select
            value={mes}
            onChange={(e) => cambiarPeriodo(anio, Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {MESES.map((nombre, i) => (
              <option key={nombre} value={i + 1}>
                {nombre}
              </option>
            ))}
          </select>
          <select
            value={anio}
            onChange={(e) => cambiarPeriodo(Number(e.target.value), mes)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => filtrarPorTipo(null)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tipoFiltro === null
                ? "bg-slate-700 text-white dark:bg-slate-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Todos
          </button>
          {TIPOS_GASTO.map((t) => (
            <button
              key={t.valor}
              type="button"
              onClick={() => filtrarPorTipo(t.valor)}
              title={t.detalle}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                tipoFiltro === t.valor
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              <Icon name={t.icono} size={14} />
              {t.etiqueta}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <Button
            size="sm"
            type="button"
            onClick={openCreateModal}
            startIcon={<Icon name="mdi:plus" size={18} />}
          >
            Nuevo gasto
          </Button>
        </div>
      </div>

      {!turnoAbierto && (
        <div className="mb-5">
          <Alert
            variant="info"
            title="No tienes un turno de caja abierto"
            message="Puedes registrar gastos por Yape o transferencia. Para pagar en efectivo, abre un turno en Caja para que el egreso cuadre con el cajón."
          />
        </div>
      )}

      {/* El total del mes va grande y solo: es el número que entra al cálculo
          de rentabilidad del negocio. */}
      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-500/30 dark:bg-brand-500/10 lg:col-span-1">
          <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
            Total de {etiquetaMes(anio, mes)}
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-700 dark:text-brand-300">
            {formatearSoles(resumen.monto_total)}
          </p>

          {/* Comparación contra el mes anterior: es lo que permite notar que
              la luz subió o que el alquiler se pagó dos veces. */}
          {variacion !== null && (
            <p
              className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                variacion > 0
                  ? "text-error-600 dark:text-error-400"
                  : variacion < 0
                    ? "text-success-600 dark:text-success-400"
                    : "text-gray-500"
              }`}
            >
              <Icon
                name={
                  variacion > 0
                    ? "mdi:trending-up"
                    : variacion < 0
                      ? "mdi:trending-down"
                      : "mdi:trending-neutral"
                }
                size={15}
              />
              {variacion > 0 ? "+" : ""}
              {variacion}% vs. mes anterior (
              {formatearSoles(reporte?.total_mes_anterior)})
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          {[
            {
              etiqueta: "Fijos",
              valor: resumen.fijos,
              icono: "mdi:calendar-sync-outline",
              color: "text-blue-600 dark:text-blue-400",
            },
            {
              etiqueta: "Variables",
              valor: resumen.variables,
              icono: "mdi:calendar-question-outline",
              color: "text-warning-600 dark:text-warning-400",
            },
            {
              etiqueta: "En efectivo",
              valor: resumen.efectivo,
              icono: "mdi:cash",
              color: "text-success-600 dark:text-success-400",
            },
            {
              etiqueta: "Yape + transfer.",
              valor: resumen.yape + resumen.tarjeta,
              icono: "mdi:bank-outline",
              color: "text-gray-700 dark:text-gray-200",
            },
          ].map((t) => (
            <div
              key={t.etiqueta}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex items-center gap-2">
                <Icon name={t.icono} size={16} className={t.color} />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t.etiqueta}
                </span>
              </div>
              <p className={`mt-1.5 text-lg font-bold ${t.color}`}>
                {formatearSoles(t.valor)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Desglose por categoría: responde "¿en qué se fue la plata este mes?" */}
      {reporte && reporte.por_categoria.length > 0 && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
            En qué se fue el mes
          </h4>
          <div className="space-y-2.5">
            {reporte.por_categoria.map((cat) => {
              const porcentaje =
                reporte.monto_total > 0
                  ? (cat.monto / reporte.monto_total) * 100
                  : 0;
              return (
                <div key={cat.id_categoria}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                      {cat.nombre_categoria}
                      <Badge
                        size="sm"
                        color={cat.tipo_gasto === TIPO_GASTO.FIJO ? "info" : "warning"}
                      >
                        {cat.tipo_gasto_nombre}
                      </Badge>
                    </span>
                    <span className="shrink-0 font-semibold text-gray-800 dark:text-white">
                      {formatearSoles(cat.monto)}{" "}
                      <span className="font-normal text-gray-400">
                        ({porcentaje.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  {/* Barra proporcional: comunica el peso relativo más rápido
                      que el número solo. */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full ${
                        cat.tipo_gasto === TIPO_GASTO.FIJO
                          ? "bg-blue-500"
                          : "bg-warning-500"
                      }`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-5 w-full max-w-md">
        <Input
          type="search"
          placeholder="Buscar por concepto o comprobante..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Concepto
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Categoría
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Fecha
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Medio
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Monto
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                      Cargando gastos...
                    </TableCell>
                  </TableRow>
                ) : registros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-12 text-center">
                      <Icon
                        name="mdi:receipt-text-outline"
                        size={40}
                        className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                      />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sin gastos en {etiquetaMes(anio, mes)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Registra el primero o cambia el período.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  registros.map((gasto) => (
                    <TableRow
                      key={gasto.id}
                      className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                    >
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                          {gasto.concepto}
                        </span>
                        {gasto.num_comprobante && (
                          <span className="mt-0.5 block font-mono text-xs text-gray-400">
                            {gasto.num_comprobante}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-sm text-gray-700 dark:text-gray-300">
                          {gasto.nombre_categoria}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          {gasto.nombre_categoria_padre && (
                            <span className="text-xs text-gray-400">
                              {gasto.nombre_categoria_padre}
                            </span>
                          )}
                          <Badge
                            size="sm"
                            color={
                              gasto.tipo_gasto === TIPO_GASTO.FIJO ? "info" : "warning"
                            }
                          >
                            {gasto.tipo_gasto_nombre}
                          </Badge>
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {formatearFecha(gasto.fecha_gasto)}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <Badge
                          size="sm"
                          color={gasto.medio_pago === 1 ? "success" : "light"}
                        >
                          {gasto.medio_pago_nombre ?? "—"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-end">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatearSoles(gasto.monto)}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(gasto)}
                            className="text-gray-500 transition-colors hover:text-brand-600"
                            title="Editar gasto"
                          >
                            <Icon name="mdi:pencil-outline" size={19} />
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirConfirmAnular(gasto)}
                            className="text-gray-500 transition-colors hover:text-error-600"
                            title="Anular gasto"
                          >
                            <Icon name="mdi:close-circle-outline" size={19} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Pagination
          currentPage={pagina}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPagina}
          onPageSizeChange={setPageSize}
        />
      </div>

      <GastoFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={save}
        gasto={editing}
        categorias={categorias}
        turnoAbierto={turnoAbierto}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cerrarConfirmAnular}
        onConfirm={confirmarAnular}
        isLoading={isAnulando}
        variant="danger"
        title="¿Anular este gasto?"
        description={
          confirmGasto
            ? `Se anulará '${confirmGasto.concepto}' por ${formatearSoles(confirmGasto.monto)}. Queda el registro de que existió. Si fue en efectivo y su turno ya se cerró, el sistema no lo permitirá.`
            : ""
        }
        confirmText="Sí, anular"
        cancelText="Cancelar"
      />
    </div>
  );
}
