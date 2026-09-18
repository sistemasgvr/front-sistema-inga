"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Pagination from "@/components/tables/Pagination";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { useConvenios } from "../hooks/use-convenios";
import { ConvenioFormModal } from "./convenio-form-modal";
import { ConveniosTable } from "./convenios-table";

export function ConveniosView() {
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
    condicionesPago,
    isLoading,
    isSaving,
    feedback,
    clearFeedback,
    editingConvenio,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveConvenio,
    confirmConvenio,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  } = useConvenios();

  const isDesactivar = confirmConvenio?.estado === 1;

  return (
    <div>
      <PageBreadcrumb pageTitle="Convenios de crédito" />

      {/* Explico de entrada qué es esta pantalla. Es un concepto propio del
          negocio y no todos los que entren van a saber de qué se trata. */}
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <Icon
          name="mdi:information-outline"
          size={20}
          className="mt-0.5 shrink-0 text-brand-500"
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Un convenio es una empresa del consorcio cuyo personal consume en el
          restaurante y lo paga después. Acá defines su límite de crédito y cada
          cuánto se cierra la cuenta. Los clientes se asignan desde{" "}
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

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleFilterStatus("activos")}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            estadoFiltro === "activos"
              ? "bg-emerald-600 text-white"
              : "bg-success-50 text-success-600 dark:bg-success-500/10"
          }`}
        >
          <Icon name="mdi:check-circle-outline" size={16} />
          <span>Activos:</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">
            {resumen.activos}
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleFilterStatus("inactivos")}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            estadoFiltro === "inactivos"
              ? "bg-rose-600 text-white"
              : "bg-error-50 text-error-600 dark:bg-error-500/10"
          }`}
        >
          <Icon name="mdi:close-circle-outline" size={16} />
          <span>Inactivos:</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">
            {resumen.inactivos}
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleFilterStatus("todos")}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            estadoFiltro === "todos"
              ? "bg-slate-700 text-white"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800"
          }`}
        >
          <Icon name="mdi:format-list-bulleted" size={16} />
          <span>Total:</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">
            {resumen.total}
          </span>
        </button>
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
          Nuevo convenio
        </Button>
      </div>

      <ConveniosTable
        convenios={registros}
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

      <ConvenioFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={saveConvenio}
        convenio={editingConvenio}
        condicionesPago={condicionesPago}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
        variant={isDesactivar ? "danger" : "warning"}
        title={isDesactivar ? "¿Dar de baja el convenio?" : "¿Reactivar convenio?"}
        description={
          isDesactivar
            ? `'${confirmConvenio?.nombre}' dejará de estar disponible para asignar a nuevos clientes. El historial de consumos se conserva.`
            : `'${confirmConvenio?.nombre}' volverá a estar disponible para asignar a clientes.`
        }
        confirmText={isDesactivar ? "Sí, dar de baja" : "Sí, reactivar"}
        cancelText="Cancelar"
      />
    </div>
  );
}
