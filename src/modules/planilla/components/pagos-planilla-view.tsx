"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
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
import { useEffect, useState } from "react";
import { usePagosPlanilla } from "../hooks/use-pagos-planilla";
import { listTrabajadores } from "../services/planilla.service";
import { MESES, QUINCENAS, type TrabajadorItem } from "../types/planilla.types";
import { etiquetaPeriodo, formatearFecha, formatearSoles } from "../utils/formato";
import { PagoFormModal } from "./pago-form-modal";

export function PagosPlanillaView() {
  const {
    anio,
    mes,
    quincena,
    cambiarPeriodo,
    cambiarQuincena,
    registros,
    total,
    pagina,
    setPagina,
    pageSize,
    setPageSize,
    totalPages,
    resumen,
    reporte,
    turnoAbierto,
    isLoading,
    isSaving,
    feedback,
    clearFeedback,
    isPagoOpen,
    trabajadorPreseleccionado,
    abrirPago,
    cerrarPago,
    guardarPago,
    confirmPago,
    isConfirmOpen,
    isAnulando,
    abrirConfirmAnular,
    cerrarConfirmAnular,
    confirmarAnular,
  } = usePagosPlanilla();

  // Lista de personal activo para el selector del modal de pago.
  const [trabajadores, setTrabajadores] = useState<TrabajadorItem[]>([]);

  useEffect(() => {
    listTrabajadores({ pagina: 1, limite: 200, estado: "activos" })
      .then((r) => setTrabajadores(r.registros))
      .catch(() => setTrabajadores([]));
  }, []);

  const anioActual = new Date().getFullYear();
  const anios = [anioActual, anioActual - 1, anioActual - 2];

  return (
    <div>
      <PageBreadcrumb pageTitle="Pagos de planilla" />

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

      {/* Selector de período. Va arriba de todo porque define qué muestran
          todas las tarjetas y tablas de abajo. */}
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
            onClick={() => cambiarQuincena(null)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              quincena === null
                ? "bg-slate-700 text-white dark:bg-slate-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Mes completo
          </button>
          {QUINCENAS.map((q) => (
            <button
              key={q.valor}
              type="button"
              onClick={() => cambiarQuincena(q.valor)}
              title={q.detalle}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                quincena === q.valor
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {q.etiqueta}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <Button
            size="sm"
            type="button"
            onClick={() => abrirPago()}
            startIcon={<Icon name="mdi:cash-plus" size={18} />}
          >
            Registrar pago
          </Button>
        </div>
      </div>

      {!turnoAbierto && (
        <div className="mb-5">
          <Alert
            variant="info"
            title="No tienes un turno de caja abierto"
            message="Puedes registrar pagos por Yape o transferencia. Para pagar en efectivo, abre un turno en Caja para que el egreso cuadre con el cajón."
          />
        </div>
      )}

      {/* Totales del período, desglosados por medio. El desglose importa
          porque solo el efectivo sale del cajón; lo demás sale del banco. */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            etiqueta: "Total pagado",
            valor: resumen.monto_total,
            icono: "mdi:cash-multiple",
            color: "text-gray-700 dark:text-gray-200",
          },
          {
            etiqueta: "Efectivo",
            valor: resumen.efectivo,
            icono: "mdi:cash",
            color: "text-success-600 dark:text-success-400",
          },
          {
            etiqueta: "Yape",
            valor: resumen.yape,
            icono: "mdi:cellphone",
            color: "text-brand-500",
          },
          {
            etiqueta: "Transferencia",
            valor: resumen.tarjeta,
            icono: "mdi:bank-outline",
            color: "text-blue-600 dark:text-blue-400",
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
            <p className={`mt-1.5 text-xl font-bold ${t.color}`}>
              {formatearSoles(t.valor)}
            </p>
          </div>
        ))}
      </div>

      {/* Pendientes de pago. Es lo más útil de la pantalla el día de pago, por
          eso va antes del listado de pagos ya hechos. */}
      {quincena !== null && reporte && reporte.cantidad_pendientes > 0 && (
        <div className="mb-5 rounded-xl border border-warning-200 bg-warning-50 p-5 dark:border-warning-500/30 dark:bg-warning-500/10">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon name="mdi:account-clock-outline" size={20} className="text-warning-500" />
              <h4 className="text-sm font-bold text-warning-700 dark:text-warning-400">
                Falta pagar a {reporte.cantidad_pendientes}{" "}
                {reporte.cantidad_pendientes === 1 ? "persona" : "personas"}
              </h4>
            </div>
            {reporte.estimado_pendiente > 0 && (
              <span className="text-xs text-warning-700 dark:text-warning-400">
                Estimado por desembolsar:{" "}
                <span className="font-bold">
                  {formatearSoles(reporte.estimado_pendiente)}
                </span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {reporte.pendientes.map((p) => (
              <button
                key={p.id_trabajador}
                type="button"
                onClick={() => abrirPago(p.id_trabajador)}
                className="flex items-center gap-2 rounded-lg border border-warning-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-warning-500/40 dark:bg-gray-900 dark:text-gray-300"
                title={`Registrar el pago de ${p.nombre_trabajador}`}
              >
                <Icon name="mdi:plus-circle-outline" size={14} />
                {p.nombre_trabajador}
                {Number(p.sueldo_referencial) > 0 && (
                  <span className="text-gray-400">
                    {formatearSoles(p.sueldo_referencial)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {quincena !== null &&
        reporte &&
        reporte.cantidad_pendientes === 0 &&
        reporte.cantidad_pagados > 0 && (
          <div className="mb-5">
            <Alert
              variant="success"
              title="Quincena completa"
              message={`Todo el personal activo ya cobró ${etiquetaPeriodo(anio, mes, quincena)}.`}
            />
          </div>
        )}

      {/* Listado de pagos */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[860px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Trabajador
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Período
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Fecha de pago
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
                      Cargando pagos...
                    </TableCell>
                  </TableRow>
                ) : registros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-12 text-center">
                      <Icon
                        name="mdi:cash-clock"
                        size={40}
                        className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                      />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sin pagos en {etiquetaPeriodo(anio, mes, quincena)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Registra el primer pago o cambia el período.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  registros.map((pago) => (
                    <TableRow
                      key={pago.id}
                      className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                    >
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                          {pago.nombre_trabajador}
                        </span>
                        {pago.puesto && (
                          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                            {pago.puesto}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        <Badge size="sm" color="light">
                          {pago.quincena === 1 ? "1ra" : "2da"} quincena
                        </Badge>
                        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                          {MESES[pago.mes - 1]} {pago.anio}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {formatearFecha(pago.fecha_pago)}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <Badge
                          size="sm"
                          color={pago.medio_pago === 1 ? "success" : "info"}
                        >
                          {pago.medio_pago_nombre ?? "—"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-end">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatearSoles(pago.monto)}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => abrirConfirmAnular(pago)}
                          className="text-gray-500 transition-colors hover:text-error-600"
                          title="Anular este pago"
                        >
                          <Icon name="mdi:close-circle-outline" size={19} />
                        </button>
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

      <PagoFormModal
        isOpen={isPagoOpen}
        onClose={cerrarPago}
        onSubmit={guardarPago}
        trabajadores={trabajadores}
        trabajadorPreseleccionado={trabajadorPreseleccionado}
        turnoAbierto={turnoAbierto}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cerrarConfirmAnular}
        onConfirm={confirmarAnular}
        isLoading={isAnulando}
        variant="danger"
        title="¿Anular este pago?"
        description={
          confirmPago
            ? `Se anulará el pago de ${formatearSoles(confirmPago.monto)} a ${confirmPago.nombre_trabajador}. Queda el registro de que existió y podrás cargar el corregido. Si fue en efectivo y su turno ya se cerró, el sistema no lo permitirá.`
            : ""
        }
        confirmText="Sí, anular"
        cancelText="Cancelar"
      />
    </div>
  );
}
