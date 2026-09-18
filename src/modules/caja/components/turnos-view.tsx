"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Pagination from "@/components/tables/Pagination";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { Icon } from "@/components/ui/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTurnos } from "../hooks/use-turnos";
import { ESTADO_TURNO } from "../types/caja.types";
import { formatearFechaHora, formatearSoles } from "../utils/formato";
import { TurnoDetalleModal } from "./turno-detalle-modal";

export function TurnosView() {
  const {
    registros,
    total,
    pagina,
    setPagina,
    pageSize,
    setPageSize,
    totalPages,
    filtros,
    aplicarFiltro,
    resumen,
    isLoading,
    feedback,
    clearFeedback,
    detalle,
    isDetalleOpen,
    isLoadingDetalle,
    verDetalle,
    cerrarDetalle,
  } = useTurnos();

  return (
    <div>
      <PageBreadcrumb pageTitle="Historial de turnos" />

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

      {/* Los descuadres van primero porque es lo que el administrador entra a
          buscar: turnos cerrados donde lo contado no coincidió con el sistema. */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          {
            etiqueta: "Con descuadre",
            valor: resumen.con_descuadre,
            icono: "mdi:alert-circle-outline",
            color: "text-error-500",
          },
          {
            etiqueta: "Abiertos ahora",
            valor: resumen.abiertos,
            icono: "mdi:lock-open-variant-outline",
            color: "text-success-600 dark:text-success-400",
          },
          {
            etiqueta: "Cerrados",
            valor: resumen.cerrados,
            icono: "mdi:lock-outline",
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
            <p className={`mt-1.5 text-2xl font-bold ${t.color}`}>{t.valor}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Estado:
        </span>
        {[
          { valor: undefined, etiqueta: "Todos" },
          { valor: ESTADO_TURNO.ABIERTO, etiqueta: "Abiertos" },
          { valor: ESTADO_TURNO.CERRADO, etiqueta: "Cerrados" },
        ].map((f) => (
          <button
            key={f.etiqueta}
            type="button"
            onClick={() => aplicarFiltro({ estado_turno: f.valor })}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filtros.estado_turno === f.valor
                ? "bg-slate-700 text-white dark:bg-slate-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[940px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Caja / Cajero
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Apertura
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Cierre
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Diferencia
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Estado
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Detalle
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                      Cargando turnos...
                    </TableCell>
                  </TableRow>
                ) : registros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-12 text-center">
                      <Icon
                        name="mdi:clipboard-text-clock-outline"
                        size={40}
                        className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                      />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        No hay turnos registrados
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Aparecerán acá en cuanto un cajero abra su primer turno.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  registros.map((turno) => {
                    const abierto = turno.estado_turno === ESTADO_TURNO.ABIERTO;
                    // `sistema − declarado`: positiva = faltante, negativa = sobrante.
                    const dif = Number(turno.monto_diferencia ?? 0);
                    const cuadra = Math.abs(dif) < 0.01;
                    const faltante = dif > 0;

                    return (
                      <TableRow
                        key={turno.id}
                        className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                      >
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                            {turno.nombre_caja}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                            {turno.nombre_cajero}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {formatearFechaHora(turno.fecha_apertura)}
                          </span>
                          <span className="mt-0.5 block text-sm text-gray-700 dark:text-gray-300">
                            {formatearSoles(turno.monto_apertura)}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          {turno.fecha_cierre ? (
                            <>
                              <span className="block text-xs text-gray-500 dark:text-gray-400">
                                {formatearFechaHora(turno.fecha_cierre)}
                              </span>
                              <span className="mt-0.5 block text-sm text-gray-700 dark:text-gray-300">
                                {formatearSoles(turno.monto_cierre_declarado)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">En curso</span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-end">
                          {abierto ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            <span
                              className={`text-sm font-semibold ${
                                cuadra
                                  ? "text-success-600 dark:text-success-400"
                                  : faltante
                                    ? "text-error-500"
                                    : "text-warning-600 dark:text-warning-400"
                              }`}
                              title={faltante ? "Faltante" : "Sobrante"}
                            >
                              {cuadra
                                ? "Cuadró"
                                : `${faltante ? "Falta" : "Sobra"} ${formatearSoles(Math.abs(dif))}`}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <Badge size="sm" color={abierto ? "success" : "light"}>
                            {abierto ? "Abierto" : "Cerrado"}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => verDetalle(turno)}
                            className="text-gray-500 transition-colors hover:text-brand-600"
                            title="Ver detalle del turno"
                          >
                            <Icon name="mdi:eye-outline" size={19} />
                          </button>
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

      <TurnoDetalleModal
        isOpen={isDetalleOpen}
        onClose={cerrarDetalle}
        detalle={detalle}
        isLoading={isLoadingDetalle}
      />
    </div>
  );
}
