"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Pagination from "@/components/tables/Pagination";
import Alert from "@/components/ui/alert/Alert";
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
import { useCuentasPorCobrar } from "../hooks/use-cuentas-por-cobrar";
import { MESES, QUINCENAS } from "../types/cxc.types";
import {
  formatearFecha,
  formatearSoles,
  nivelCredito,
  urgenciaCobranza,
} from "../utils/formato";
import { AbonoFormModal } from "./abono-form-modal";
import { AjusteFormModal } from "./ajuste-form-modal";
import { ConsumoFormModal } from "./consumo-form-modal";
import { EstadoCuentaModal } from "./estado-cuenta-modal";
import { ReporteQuincenaModal } from "./reporte-quincena-modal";

export function CuentasPorCobrarView() {
  const {
    registros,
    total,
    pagina,
    setPagina,
    pageSize,
    setPageSize,
    totalPages,
    searchInput,
    setSearchInput,
    soloConDeuda,
    alternarSoloConDeuda,
    convenioFiltro,
    cambiarConvenioFiltro,
    convenios,
    clientes,
    resumen,
    anio,
    mes,
    quincena,
    cambiarPeriodo,
    reporte,
    isReporteOpen,
    abrirReporte,
    cerrarReporte,
    isLoading,
    isSaving,
    feedback,
    clearFeedback,
    isConsumoOpen,
    isAbonoOpen,
    isAjusteOpen,
    clienteElegido,
    abrirConsumo,
    abrirAbono,
    abrirAjuste,
    cerrarModales,
    guardarConsumo,
    guardarAbono,
    guardarAjuste,
    estadoCuenta,
    isDetalleOpen,
    isLoadingDetalle,
    verEstadoCuenta,
    cerrarDetalle,
    confirmMov,
    isConfirmOpen,
    isAnulando,
    abrirConfirmAnular,
    cerrarConfirmAnular,
    confirmarAnular,
  } = useCuentasPorCobrar();

  const anioActual = new Date().getFullYear();
  const anios = [anioActual, anioActual - 1, anioActual - 2];

  return (
    <div>
      <PageBreadcrumb pageTitle="Cuentas por cobrar" />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <Icon
          name="mdi:information-outline"
          size={20}
          className="mt-0.5 shrink-0 text-brand-500"
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Lo que el consorcio le debe al restaurante. Los trabajadores almuerzan
          a crédito, el consumo se acumula por quincena, y a inicios de mes se le
          envía el consolidado a cada empresa para que pague y lo descuente por
          planilla. Los clientes y sus convenios se registran en{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            Personas
          </span>
          .
        </p>
      </div>

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

      {/* Lo que nos deben va grande y solo: es la alerta "Por cobrar al
          consorcio" que el cliente pidió ver en el dashboard. */}
      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div
          className={`rounded-xl border p-5 lg:col-span-1 ${
            resumen.deuda_total > 0
              ? "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
              : "border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              resumen.deuda_total > 0
                ? "text-brand-700 dark:text-brand-300"
                : "text-success-700 dark:text-success-300"
            }`}
          >
            Por cobrar al consorcio
          </p>
          <p
            className={`mt-1 text-3xl font-bold ${
              resumen.deuda_total > 0
                ? "text-brand-700 dark:text-brand-400"
                : "text-success-700 dark:text-success-400"
            }`}
          >
            {formatearSoles(resumen.deuda_total)}
          </p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {resumen.clientes_con_deuda} de {resumen.clientes_total} clientes con
            saldo pendiente
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          {[
            {
              etiqueta: "Consumido en la quincena",
              valor: reporte?.total_cargos ?? 0,
              icono: "mdi:silverware-fork-knife",
              color: "text-error-500",
            },
            {
              etiqueta: "Abonado en la quincena",
              valor: reporte?.total_abonos ?? 0,
              icono: "mdi:cash-check",
              color: "text-success-600 dark:text-success-400",
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

          {/* El corte por empresa, que es la unidad en la que se factura.
              Da acceso directo al reporte completo, que es lo que se envía. */}
          <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Corte por empresa
              </p>
              <button
                type="button"
                onClick={abrirReporte}
                className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                Ver reporte completo
                <Icon name="mdi:arrow-right" size={14} />
              </button>
            </div>
            {!reporte || reporte.empresas.length === 0 ? (
              <p className="text-xs text-gray-400">
                Sin movimientos en esta quincena.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {reporte.empresas.slice(0, 5).map((e) => (
                  <div
                    key={e.id_convenio ?? "sin-convenio"}
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 dark:border-gray-700"
                    title={`${e.cantidad_personas} persona(s)`}
                  >
                    <p className="max-w-[140px] truncate text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                      {e.nombre_convenio}
                    </p>
                    <p className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                      {formatearSoles(e.total_neto)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Icon
            name="mdi:calendar-month-outline"
            size={18}
            className="text-gray-400"
          />
          <select
            value={quincena}
            onChange={(e) =>
              cambiarPeriodo(anio, mes, Number(e.target.value))
            }
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {QUINCENAS.map((q) => (
              <option key={q.valor} value={q.valor}>
                {q.etiqueta}
              </option>
            ))}
          </select>
          <select
            value={mes}
            onChange={(e) => cambiarPeriodo(anio, Number(e.target.value), quincena)}
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
            onChange={(e) => cambiarPeriodo(Number(e.target.value), mes, quincena)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <select
          value={convenioFiltro ?? ""}
          onChange={(e) =>
            cambiarConvenioFiltro(e.target.value ? Number(e.target.value) : null)
          }
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="">Todas las empresas</option>
          {convenios.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={alternarSoloConDeuda}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            soloConDeuda
              ? "bg-brand-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          <Icon name="mdi:alert-circle-outline" size={15} />
          Solo con deuda
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => abrirConsumo()}
            startIcon={<Icon name="mdi:silverware-fork-knife" size={17} />}
          >
            Registrar consumo
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={() => abrirAbono()}
            startIcon={<Icon name="mdi:cash-check" size={17} />}
          >
            Registrar abono
          </Button>
        </div>
      </div>

      {/* Si alguien pasó su tope, lo digo acá arriba. Decidimos advertir y no
          bloquear, así que este aviso es lo único que lo hace visible sin tener
          que revisar fila por fila. */}
      {resumen.clientes_sobre_limite > 0 && (
        <div className="mb-5">
          <Alert
            variant="warning"
            title={`${resumen.clientes_sobre_limite} ${
              resumen.clientes_sobre_limite === 1
                ? "cliente superó"
                : "clientes superaron"
            } su límite de crédito`}
            message="Se les sigue atendiendo, pero conviene avisar a su empresa antes del próximo corte."
          />
        </div>
      )}

      <div className="mb-5 w-full max-w-md">
        <Input
          type="search"
          placeholder="Buscar por nombre, documento o empresa..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[980px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300"
                  >
                    Cliente
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300"
                  >
                    Empresa
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300"
                  >
                    Debe
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300"
                  >
                    Crédito
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300"
                  >
                    Último abono
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300"
                  >
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      Cargando clientes...
                    </TableCell>
                  </TableRow>
                ) : registros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-12 text-center">
                      <Icon
                        name="mdi:account-group-outline"
                        size={40}
                        className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                      />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {soloConDeuda
                          ? "Ningún cliente tiene deuda pendiente"
                          : "No hay clientes del consorcio registrados"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {soloConDeuda
                          ? "Quita el filtro para ver a todos."
                          : "Regístralos en Personas, márcalos como cliente y asígnales un convenio."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  registros.map((cli) => {
                    const debe = Number(cli.saldo) > 0;
                    const credito = nivelCredito(
                      Number(cli.saldo),
                      cli.limite_credito,
                    );
                    const atraso = urgenciaCobranza(cli.dias_sin_abonar);

                    return (
                      <TableRow
                        key={cli.id_persona}
                        className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                      >
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                            {cli.nombre}
                          </span>
                          {cli.num_documento && (
                            <span className="mt-0.5 block font-mono text-xs text-gray-400">
                              {cli.num_documento}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          {cli.convenio ? (
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {cli.convenio}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Sin convenio
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-end">
                          <span
                            className={`text-sm font-bold ${
                              debe
                                ? "text-error-600 dark:text-error-400"
                                : "text-success-600 dark:text-success-400"
                            }`}
                          >
                            {debe ? formatearSoles(cli.saldo) : "Al día"}
                          </span>
                        </TableCell>

                        {/* La barra de crédito es lo que convierte el número en
                            una lectura rápida: rojo si se pasó, ámbar si le
                            queda poco margen para el resto de la quincena. */}
                        <TableCell className="px-5 py-4 text-start">
                          {credito.nivel === "sin-tope" ? (
                            <span className="text-xs text-gray-400">
                              Sin tope
                            </span>
                          ) : (
                            <div className="w-28">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-semibold ${
                                    credito.nivel === "excedido"
                                      ? "text-error-600 dark:text-error-400"
                                      : credito.nivel === "atencion"
                                        ? "text-warning-600 dark:text-warning-400"
                                        : "text-success-600 dark:text-success-400"
                                  }`}
                                >
                                  {credito.porcentaje}%
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {formatearSoles(cli.limite_credito)}
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className={`h-full rounded-full ${
                                    credito.nivel === "excedido"
                                      ? "bg-error-500"
                                      : credito.nivel === "atencion"
                                        ? "bg-warning-500"
                                        : "bg-success-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(credito.porcentaje ?? 0, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          {cli.ultimo_abono ? (
                            <>
                              <span className="block text-xs text-gray-500 dark:text-gray-400">
                                {formatearFecha(cli.ultimo_abono)}
                              </span>
                              {/* Umbrales más holgados que en CxP a propósito:
                                  el ciclo del consorcio es quincena + pago a
                                  inicios del mes siguiente, así que ~45 días es
                                  estar al día, no estar atrasado. */}
                              <span
                                className={`mt-0.5 block text-xs font-medium ${
                                  atraso.nivel === "ok"
                                    ? "text-success-600 dark:text-success-400"
                                    : atraso.nivel === "atencion"
                                      ? "text-warning-600 dark:text-warning-400"
                                      : "text-error-500"
                                }`}
                              >
                                {atraso.etiqueta}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">Nunca</span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => verEstadoCuenta(cli)}
                              className="text-gray-500 transition-colors hover:text-brand-600"
                              title="Ver estado de cuenta"
                            >
                              <Icon name="mdi:eye-outline" size={19} />
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirConsumo(cli)}
                              className="text-gray-500 transition-colors hover:text-error-600"
                              title="Registrar consumo a crédito"
                            >
                              <Icon
                                name="mdi:silverware-fork-knife"
                                size={19}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirAbono(cli)}
                              disabled={!debe}
                              className="text-gray-500 transition-colors hover:text-success-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-gray-500"
                              title={
                                debe
                                  ? "Registrar abono"
                                  : "No hay deuda pendiente que abonar"
                              }
                            >
                              <Icon name="mdi:cash-check" size={19} />
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirAjuste(cli)}
                              className="text-gray-500 transition-colors hover:text-warning-600"
                              title="Ajustar saldo"
                            >
                              <Icon name="mdi:tune-variant" size={19} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      <ConsumoFormModal
        isOpen={isConsumoOpen}
        onClose={cerrarModales}
        onSubmit={guardarConsumo}
        clientes={clientes}
        clienteElegido={clienteElegido}
        isSaving={isSaving}
      />

      <AbonoFormModal
        isOpen={isAbonoOpen}
        onClose={cerrarModales}
        onSubmit={guardarAbono}
        clientes={registros}
        clienteElegido={clienteElegido}
        isSaving={isSaving}
      />

      <AjusteFormModal
        isOpen={isAjusteOpen}
        onClose={cerrarModales}
        onSubmit={guardarAjuste}
        cliente={clienteElegido}
        isSaving={isSaving}
      />

      <EstadoCuentaModal
        isOpen={isDetalleOpen}
        onClose={cerrarDetalle}
        estadoCuenta={estadoCuenta}
        isLoading={isLoadingDetalle}
        onAnular={abrirConfirmAnular}
      />

      <ReporteQuincenaModal
        isOpen={isReporteOpen}
        onClose={cerrarReporte}
        reporte={reporte}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cerrarConfirmAnular}
        onConfirm={confirmarAnular}
        isLoading={isAnulando}
        variant="danger"
        title="¿Anular este movimiento?"
        description={
          confirmMov
            ? `Se anulará el ${confirmMov.tipo_movimiento_nombre.toLowerCase()} de ${formatearSoles(confirmMov.monto)} de ${confirmMov.nombre_persona}, y el saldo se recalculará. No se puede anular si la quincena ya está cerrada.`
            : ""
        }
        confirmText="Sí, anular"
        cancelText="Cancelar"
      />
    </div>
  );
}
