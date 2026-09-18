"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Pagination from "@/components/tables/Pagination";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { usePersonas } from "../hooks/use-personas";
import type { PersonaRolFilter } from "../types/personas.types";
import { PersonaFormModal } from "./persona-form-modal";
import { PersonasTable } from "./personas-table";

/**
 * Filtro por rol. Lo separo del filtro de estado porque responden preguntas
 * distintas: "¿a quién estoy mirando?" y "¿está activo o dado de baja?".
 * Mezclarlos en una sola fila de chips confundía cuál estaba aplicando.
 */
const FILTROS_ROL: { valor: PersonaRolFilter; etiqueta: string; icono: string }[] = [
  { valor: "todos", etiqueta: "Todos", icono: "mdi:account-multiple-outline" },
  { valor: "clientes", etiqueta: "Clientes", icono: "mdi:silverware-fork-knife" },
  { valor: "proveedores", etiqueta: "Proveedores", icono: "mdi:truck-outline" },
];

export function PersonasView() {
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
    rolFiltro,
    handleFilterRol,
    resumen,
    convenios,
    isLoading,
    isSaving,
    feedback,
    clearFeedback,
    editingPersona,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    savePersona,
    confirmPersona,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  } = usePersonas();

  const isDesactivar = confirmPersona?.estado === 1;

  return (
    <div>
      <PageBreadcrumb pageTitle="Clientes y proveedores" />

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

      {/* Tarjetas de resumen. Las pongo arriba porque responden de un vistazo
          la pregunta más frecuente: cuántos clientes y cuántos proveedores
          tengo cargados. Además son clicables y aplican el filtro. */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            etiqueta: "Total activos",
            valor: resumen.activos,
            icono: "mdi:account-multiple-outline",
            color: "text-gray-700 dark:text-gray-200",
            onClick: () => {
              handleFilterRol("todos");
              handleFilterStatus("activos");
            },
          },
          {
            etiqueta: "Clientes",
            valor: resumen.clientes,
            icono: "mdi:silverware-fork-knife",
            color: "text-success-600 dark:text-success-400",
            onClick: () => {
              handleFilterRol("clientes");
              handleFilterStatus("activos");
            },
          },
          {
            etiqueta: "Proveedores",
            valor: resumen.proveedores,
            icono: "mdi:truck-outline",
            color: "text-blue-600 dark:text-blue-400",
            onClick: () => {
              handleFilterRol("proveedores");
              handleFilterStatus("activos");
            },
          },
          {
            etiqueta: "Dados de baja",
            valor: resumen.inactivos,
            icono: "mdi:account-off-outline",
            color: "text-error-500",
            onClick: () => {
              handleFilterRol("todos");
              handleFilterStatus("inactivos");
            },
          },
        ].map((tarjeta) => (
          <button
            key={tarjeta.etiqueta}
            type="button"
            onClick={tarjeta.onClick}
            className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-brand-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
          >
            <div className="flex items-center gap-2">
              <Icon name={tarjeta.icono} size={17} className={tarjeta.color} />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {tarjeta.etiqueta}
              </span>
            </div>
            <p className={`mt-1.5 text-2xl font-bold ${tarjeta.color}`}>
              {tarjeta.valor}
            </p>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Ver:
          </span>
          {FILTROS_ROL.map((filtro) => (
            <button
              key={filtro.valor}
              type="button"
              onClick={() => handleFilterRol(filtro.valor)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                rolFiltro === filtro.valor
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              <Icon name={filtro.icono} size={15} />
              {filtro.etiqueta}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Estado:
          </span>
          {(
            [
              { valor: "activos", etiqueta: "Activos" },
              { valor: "inactivos", etiqueta: "De baja" },
              { valor: "todos", etiqueta: "Todos" },
            ] as const
          ).map((filtro) => (
            <button
              key={filtro.valor}
              type="button"
              onClick={() => handleFilterStatus(filtro.valor)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                estadoFiltro === filtro.valor
                  ? "bg-slate-700 text-white dark:bg-slate-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {filtro.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <Input
            type="search"
            placeholder="Buscar por nombre, razón social o documento..."
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
          Nueva persona
        </Button>
      </div>

      <PersonasTable
        personas={registros}
        isLoading={isLoading}
        onEdit={openEditModal}
        onToggleStatus={openConfirmModal}
      />

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

      <PersonaFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={savePersona}
        persona={editingPersona}
        convenios={convenios}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
        variant={isDesactivar ? "danger" : "warning"}
        title={isDesactivar ? "¿Dar de baja a esta persona?" : "¿Reactivar persona?"}
        description={
          isDesactivar
            ? `'${confirmPersona?.nombre_completo}' dejará de aparecer en los buscadores de compras y de cobro. Su historial se conserva. Si tiene deuda pendiente, el sistema no permitirá la baja.`
            : `'${confirmPersona?.nombre_completo}' volverá a estar disponible en los buscadores.`
        }
        confirmText={isDesactivar ? "Sí, dar de baja" : "Sí, reactivar"}
        cancelText="Cancelar"
      />
    </div>
  );
}
