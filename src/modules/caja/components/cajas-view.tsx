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
import { useCajas } from "../hooks/use-cajas";
import { formatearFechaHora, formatearSoles } from "../utils/formato";
import { CajaFormModal } from "./caja-form-modal";

export function CajasView() {
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
    editingCaja,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveCaja,
    confirmCaja,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  } = useCajas();

  const isDesactivar = confirmCaja?.estado === 1;

  return (
    <div>
      <PageBreadcrumb pageTitle="Cajas físicas" />

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

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { etiqueta: "Total", valor: resumen.total, icono: "mdi:cash-register", color: "text-gray-700 dark:text-gray-200" },
          { etiqueta: "Activas", valor: resumen.activos, icono: "mdi:check-circle-outline", color: "text-success-600 dark:text-success-400" },
          { etiqueta: "Con turno abierto", valor: resumen.abiertas, icono: "mdi:lock-open-variant-outline", color: "text-brand-500" },
          { etiqueta: "Inactivas", valor: resumen.inactivos, icono: "mdi:close-circle-outline", color: "text-error-500" },
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
        {(
          [
            { valor: "activos", etiqueta: "Activas" },
            { valor: "inactivos", etiqueta: "Inactivas" },
            { valor: "todos", etiqueta: "Todas" },
          ] as const
        ).map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => handleFilterStatus(f.valor)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              estadoFiltro === f.valor
                ? "bg-slate-700 text-white dark:bg-slate-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <Input
            type="search"
            placeholder="Buscar por código o nombre..."
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
          Nueva caja
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[820px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Código / Nombre
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Sucursal
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Turno actual
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
                    <TableCell colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                      Cargando cajas...
                    </TableCell>
                  </TableRow>
                ) : registros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-5 py-12 text-center">
                      <Icon
                        name="mdi:cash-register"
                        size={40}
                        className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                      />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        No hay cajas registradas
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Crea al menos una para que los cajeros puedan abrir turno.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  registros.map((item) => {
                    const isActivo = item.estado === 1;
                    return (
                      <TableRow
                        key={item.id}
                        className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                      >
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block text-xs font-bold text-brand-600 dark:text-brand-400">
                            {item.codigo}
                          </span>
                          <span className="mt-0.5 block text-sm font-semibold text-gray-900 dark:text-white">
                            {item.nombre}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {item.nombre_sucursal}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          {item.tiene_turno_abierto ? (
                            <>
                              <Badge size="sm" color="success">
                                Abierto
                              </Badge>
                              <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
                                {item.turno_cajero}
                              </span>
                              <span className="block text-xs text-gray-400">
                                desde {formatearFechaHora(item.turno_fecha_apertura)} ·{" "}
                                {formatearSoles(item.turno_monto_apertura)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">Libre</span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <Badge size="sm" color={isActivo ? "success" : "error"}>
                            {isActivo ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            {isActivo && (
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="text-gray-500 transition-colors hover:text-brand-600"
                                title="Editar caja"
                              >
                                <Icon name="mdi:pencil-outline" size={19} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openConfirmModal(item)}
                              disabled={isActivo && item.tiene_turno_abierto}
                              className={
                                isActivo
                                  ? "text-gray-500 transition-colors hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-gray-500"
                                  : "text-success-600 transition-colors hover:text-success-700"
                              }
                              title={
                                isActivo && item.tiene_turno_abierto
                                  ? "No se puede dar de baja: tiene un turno abierto"
                                  : isActivo
                                    ? "Dar de baja"
                                    : "Reactivar"
                              }
                            >
                              <Icon
                                name={isActivo ? "mdi:trash-can-outline" : "mdi:refresh"}
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

      <CajaFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={saveCaja}
        caja={editingCaja}
        sucursales={sucursales}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
        variant={isDesactivar ? "danger" : "warning"}
        title={isDesactivar ? "¿Dar de baja la caja?" : "¿Reactivar caja?"}
        description={
          isDesactivar
            ? `'${confirmCaja?.nombre}' dejará de estar disponible para abrir turnos. El historial de turnos se conserva.`
            : `'${confirmCaja?.nombre}' volverá a estar disponible para abrir turnos.`
        }
        confirmText={isDesactivar ? "Sí, dar de baja" : "Sí, reactivar"}
        cancelText="Cancelar"
      />
    </div>
  );
}
