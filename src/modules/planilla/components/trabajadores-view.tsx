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
import { useTrabajadores } from "../hooks/use-trabajadores";
import { etiquetaPeriodo, formatearFecha, formatearSoles } from "../utils/formato";
import { TrabajadorFormModal } from "./trabajador-form-modal";

export function TrabajadoresView() {
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
    estadoFiltro,
    handleFilterStatus,
    resumen,
    sucursales,
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
    confirmItem,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  } = useTrabajadores();

  const isDesactivar = confirmItem?.estado === 1;

  return (
    <div>
      <PageBreadcrumb pageTitle="Personal en planilla" />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <Icon
          name="mdi:information-outline"
          size={20}
          className="mt-0.5 shrink-0 text-brand-500"
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Registro mínimo del personal, solo para poder pagarle la quincena y que
          ese gasto entre al cuadre. Los pagos se registran en{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            Pagos de planilla
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

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(
          [
            { valor: "activos", etiqueta: "Activos", conteo: resumen.activos },
            { valor: "inactivos", etiqueta: "De baja", conteo: resumen.inactivos },
            { valor: "todos", etiqueta: "Todos", conteo: resumen.total },
          ] as const
        ).map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => handleFilterStatus(f.valor)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              estadoFiltro === f.valor
                ? "bg-slate-700 text-white dark:bg-slate-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            <span>{f.etiqueta}:</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">
              {f.conteo}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <Input
            type="search"
            placeholder="Buscar por nombre, documento o puesto..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          type="button"
          onClick={openCreateModal}
          startIcon={<Icon name="mdi:plus" size={18} />}
        >
          Nuevo trabajador
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[880px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Trabajador
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Documento
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Sueldo quincena
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    {etiquetaPeriodo(resumen.anio, resumen.mes)}
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Último pago
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Estado
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">
                      Cargando personal...
                    </TableCell>
                  </TableRow>
                ) : registros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-5 py-12 text-center">
                      <Icon
                        name="mdi:account-hard-hat-outline"
                        size={40}
                        className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                      />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        No hay personal registrado
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Agrega a los trabajadores para poder registrar sus pagos.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  registros.map((item) => {
                    const isActivo = item.estado === 1;
                    const quincenas = Array.isArray(item.quincenas_pagadas)
                      ? item.quincenas_pagadas
                      : [];

                    return (
                      <TableRow
                        key={item.id}
                        className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                      >
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                            {item.nombre_completo}
                          </span>
                          {item.puesto && (
                            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                              {item.puesto}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          {item.num_documento ? (
                            <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                              {item.num_documento}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-end">
                          {Number(item.sueldo_referencial) > 0 ? (
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {formatearSoles(item.sueldo_referencial)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Sin definir</span>
                          )}
                        </TableCell>

                        {/* Marcas por quincena: responde de un vistazo la
                            pregunta del día de pago, "¿ya cobró esta quincena?" */}
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex items-center gap-1.5">
                            {[1, 2].map((q) => {
                              const pagada = quincenas.includes(q);
                              return (
                                <span
                                  key={q}
                                  title={`${q === 1 ? "1ra" : "2da"} quincena ${pagada ? "pagada" : "pendiente"}`}
                                  className={`flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold ${
                                    pagada
                                      ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                                      : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                                  }`}
                                >
                                  <Icon
                                    name={pagada ? "mdi:check" : "mdi:minus"}
                                    size={12}
                                  />
                                  {q === 1 ? "1ra" : "2da"}
                                </span>
                              );
                            })}
                          </div>
                          {Number(item.pagado_periodo) > 0 && (
                            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                              {formatearSoles(item.pagado_periodo)}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          {item.ultimo_pago_fecha ? (
                            <>
                              <span className="block text-xs text-gray-500 dark:text-gray-400">
                                {formatearFecha(item.ultimo_pago_fecha)}
                              </span>
                              <span className="mt-0.5 block text-sm text-gray-700 dark:text-gray-300">
                                {formatearSoles(item.ultimo_pago_monto)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">Nunca</span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <Badge size="sm" color={isActivo ? "success" : "error"}>
                            {isActivo ? "Activo" : "De baja"}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            {isActivo && (
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="text-gray-500 transition-colors hover:text-brand-600"
                                title="Editar trabajador"
                              >
                                <Icon name="mdi:pencil-outline" size={19} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openConfirmModal(item)}
                              className={
                                isActivo
                                  ? "text-gray-500 transition-colors hover:text-error-600"
                                  : "text-success-600 transition-colors hover:text-success-700"
                              }
                              title={isActivo ? "Dar de baja" : "Reactivar"}
                            >
                              <Icon
                                name={isActivo ? "mdi:account-off-outline" : "mdi:refresh"}
                                size={19}
                              />
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

      <TrabajadorFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={save}
        trabajador={editing}
        sucursales={sucursales}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
        variant={isDesactivar ? "danger" : "warning"}
        title={isDesactivar ? "¿Dar de baja al trabajador?" : "¿Reactivar trabajador?"}
        description={
          isDesactivar
            ? `'${confirmItem?.nombre_completo}' dejará de aparecer al registrar pagos. Su histórico de planilla se conserva.`
            : `'${confirmItem?.nombre_completo}' volverá a aparecer al registrar pagos.`
        }
        confirmText={isDesactivar ? "Sí, dar de baja" : "Sí, reactivar"}
        cancelText="Cancelar"
      />
    </div>
  );
}
