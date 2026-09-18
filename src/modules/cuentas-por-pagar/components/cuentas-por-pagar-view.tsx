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
import { useCuentasPorPagar } from "../hooks/use-cuentas-por-pagar";
import { MESES } from "../types/cxp.types";
import {
  etiquetaMes,
  formatearFecha,
  formatearSoles,
  urgenciaAtraso,
} from "../utils/formato";
import { AbonoFormModal } from "./abono-form-modal";
import { CargoFormModal } from "./cargo-form-modal";
import { EstadoCuentaModal } from "./estado-cuenta-modal";

export function CuentasPorPagarView() {
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
    resumen,
    anio,
    mes,
    cambiarPeriodo,
    reporte,
    turnoAbierto,
    proveedores,
    isLoading,
    isSaving,
    feedback,
    clearFeedback,
    isAbonoOpen,
    isCargoOpen,
    proveedorElegido,
    abrirAbono,
    abrirCargo,
    cerrarModales,
    guardarAbono,
    guardarCargo,
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
  } = useCuentasPorPagar();

  const anioActual = new Date().getFullYear();
  const anios = [anioActual, anioActual - 1, anioActual - 2];

  return (
    <div>
      <PageBreadcrumb pageTitle="Cuentas por pagar" />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <Icon
          name="mdi:information-outline"
          size={20}
          className="mt-0.5 shrink-0 text-brand-500"
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Lo que el restaurante le debe a sus proveedores de crédito. Las compras
          a crédito suman deuda y los abonos semanales la reducen. Los proveedores
          se registran en{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            Personas
          </span>
          , marcándolos como proveedor.
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

      {/* La deuda total va grande y sola: es la alerta "Deudas por pagar" que
          el cliente pidió explícitamente ver en el dashboard. */}
      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div
          className={`rounded-xl border p-5 lg:col-span-1 ${
            resumen.deuda_total > 0
              ? "border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10"
              : "border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              resumen.deuda_total > 0
                ? "text-error-700 dark:text-error-300"
                : "text-success-700 dark:text-success-300"
            }`}
          >
            Deuda total con proveedores
          </p>
          <p
            className={`mt-1 text-3xl font-bold ${
              resumen.deuda_total > 0
                ? "text-error-700 dark:text-error-400"
                : "text-success-700 dark:text-success-400"
            }`}
          >
            {formatearSoles(resumen.deuda_total)}
          </p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {resumen.proveedores_con_deuda} de {resumen.proveedores_total}{" "}
            proveedores con saldo pendiente
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          {[
            {
              etiqueta: `Comprado en ${etiquetaMes(anio, mes)}`,
              valor: reporte?.cargos_periodo ?? 0,
              icono: "mdi:cart-arrow-down",
              color: "text-error-500",
            },
            {
              etiqueta: `Abonado en ${etiquetaMes(anio, mes)}`,
              valor: reporte?.abonos_periodo ?? 0,
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

          {/* Desglose por semana: el corte con proveedores es semanal, así que
              es el ritmo en el que realmente se mira el pago. */}
          <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              Por semana
            </p>
            {!reporte || reporte.por_semana.length === 0 ? (
              <p className="text-xs text-gray-400">
                Sin movimientos en este mes.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {reporte.por_semana.map((s) => (
                  <div
                    key={s.semana}
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 dark:border-gray-700"
                    title={`${formatearFecha(s.desde)} – ${formatearFecha(s.hasta)}`}
                  >
                    <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                      Sem. {s.semana}
                    </p>
                    <p className="text-[11px] text-error-500">
                      +{formatearSoles(s.cargos)}
                    </p>
                    <p className="text-[11px] text-success-600 dark:text-success-400">
                      −{formatearSoles(s.abonos)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {!turnoAbierto && (
        <div className="mb-5">
          <Alert
            variant="info"
            title="No tienes un turno de caja abierto"
            message="Puedes abonar por Yape o transferencia. Para abonar en efectivo, abre un turno en Caja para que el egreso cuadre con el cajón."
          />
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
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

        <button
          type="button"
          onClick={alternarSoloConDeuda}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            soloConDeuda
              ? "bg-error-500 text-white"
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
            onClick={() => abrirCargo()}
            startIcon={<Icon name="mdi:cart-plus" size={17} />}
          >
            Compra a crédito
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

      <div className="mb-5 w-full max-w-md">
        <Input
          type="search"
          placeholder="Buscar proveedor por nombre o documento..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[880px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Proveedor
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Deuda
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Comprado
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Abonado
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Último abono
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
                      Cargando proveedores...
                    </TableCell>
                  </TableRow>
                ) : registros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-12 text-center">
                      <Icon
                        name="mdi:truck-outline"
                        size={40}
                        className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                      />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {soloConDeuda
                          ? "Ningún proveedor tiene deuda pendiente"
                          : "No hay proveedores registrados"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {soloConDeuda
                          ? "Quita el filtro para ver a todos."
                          : "Regístralos en Personas y márcalos como proveedor."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  registros.map((prov) => {
                    const debe = Number(prov.saldo) > 0;
                    const atraso = urgenciaAtraso(prov.dias_sin_abonar);

                    return (
                      <TableRow
                        key={prov.id_persona}
                        className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                      >
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                            {prov.nombre}
                          </span>
                          {prov.num_documento && (
                            <span className="mt-0.5 block font-mono text-xs text-gray-400">
                              {prov.num_documento}
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
                            {debe ? formatearSoles(prov.saldo) : "Al día"}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-end">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatearSoles(prov.total_cargos)}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-end">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatearSoles(prov.total_abonos)}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          {prov.ultimo_abono ? (
                            <>
                              <span className="block text-xs text-gray-500 dark:text-gray-400">
                                {formatearFecha(prov.ultimo_abono)}
                              </span>
                              {/* El color del atraso convierte la tabla en
                                  alerta: con corte semanal, más de 7 días ya
                                  es una semana de retraso. */}
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
                              onClick={() => verEstadoCuenta(prov)}
                              className="text-gray-500 transition-colors hover:text-brand-600"
                              title="Ver estado de cuenta"
                            >
                              <Icon name="mdi:eye-outline" size={19} />
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirCargo(prov)}
                              className="text-gray-500 transition-colors hover:text-error-600"
                              title="Registrar compra a crédito"
                            >
                              <Icon name="mdi:cart-plus" size={19} />
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirAbono(prov)}
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

      <AbonoFormModal
        isOpen={isAbonoOpen}
        onClose={cerrarModales}
        onSubmit={guardarAbono}
        proveedores={registros}
        proveedorElegido={proveedorElegido}
        turnoAbierto={turnoAbierto}
        isSaving={isSaving}
      />

      <CargoFormModal
        isOpen={isCargoOpen}
        onClose={cerrarModales}
        onSubmit={guardarCargo}
        proveedores={proveedores}
        proveedorElegido={proveedorElegido}
        isSaving={isSaving}
      />

      <EstadoCuentaModal
        isOpen={isDetalleOpen}
        onClose={cerrarDetalle}
        estadoCuenta={estadoCuenta}
        isLoading={isLoadingDetalle}
        onAnular={abrirConfirmAnular}
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
            ? `Se anulará el ${confirmMov.tipo_movimiento_nombre.toLowerCase()} de ${formatearSoles(confirmMov.monto)} a ${confirmMov.nombre_proveedor}, y el saldo se recalculará. Solo se puede anular el movimiento más reciente.`
            : ""
        }
        confirmText="Sí, anular"
        cancelText="Cancelar"
      />
    </div>
  );
}
