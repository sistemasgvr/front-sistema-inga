"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { useRoles } from "../hooks/use-roles";
import { RoleFormModal } from "./role-form-modal";
import { RolePermissionsModal } from "./role-permissions-modal";
import { RolesTable } from "./roles-table";

export function RolesView() {
  const {
    registros,
    total,
    pagina,
    setPagina,
    pageSize,
    totalPages,
    searchInput,
    setSearchInput,
    applySearch,
    estadoFiltro,
    handleFilterStatus,
    resumen,
    isLoading,
    isSaving,
    feedback,
    clearFeedback,

    // Modal Form
    editingRole,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveRole,

    // Modal Permisos
    permissionsRole,
    isPermissionsOpen,
    catalogPermissions,
    selectedPermissionIds,
    isLoadingPermissions,
    openPermissionsModal,
    closePermissionsModal,
    savePermissions,

    // Modal Confirm
    confirmRole,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  } = useRoles();

  const isDesactivar = confirmRole?.estado === 1;

  return (
    <div>
      <PageBreadcrumb pageTitle="Roles y Permisos" />

      {feedback ? (
        <div className="mb-5">
          <Alert
            variant={feedback.variant}
            title={feedback.title}
            message={feedback.message}
          />
          <button
            type="button"
            onClick={clearFeedback}
            className="text-theme-xs mt-2 text-gray-500 underline hover:text-gray-700 dark:text-gray-400"
          >
            Cerrar aviso
          </button>
        </div>
      ) : null}

      {/* CHIPS INTERACTIVOS DE RESUMEN */}
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleFilterStatus("activos")}
          className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            estadoFiltro === "activos"
              ? "bg-success-500 text-white"
              : "bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400"
          }`}
        >
          <span>Activos:</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[11px]">
            {resumen.activos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleFilterStatus("inactivos")}
          className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            estadoFiltro === "inactivos"
              ? "bg-error-500 text-white"
              : "bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400"
          }`}
        >
          <span>Inactivos:</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[11px]">
            {resumen.inactivos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleFilterStatus("todos")}
          className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            estadoFiltro === "todos"
              ? "bg-brand-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          <span>Total roles:</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[11px]">
            {resumen.total}
          </span>
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-md items-center gap-2">
          <Input
            type="search"
            placeholder="Buscar por código o nombre..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applySearch();
              }
            }}
          />
          <Button size="sm" variant="outline" type="button" onClick={applySearch}>
            Buscar
          </Button>
        </div>

        <Button size="sm" type="button" onClick={openCreateModal}>
          Nuevo Rol
        </Button>
      </div>

      <RolesTable
        roles={registros}
        isLoading={isLoading}
        onEdit={openEditModal}
        onPermissions={openPermissionsModal}
        onToggleStatus={openConfirmModal}
      />

      <div className="mt-5">
        <Pagination
          currentPage={pagina}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPagina}
        />
      </div>

      {/* Modal Formulario Rol */}
      <RoleFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={saveRole}
        role={editingRole}
        isSaving={isSaving}
      />

      {/* Modal Matriz de Permisos */}
      <RolePermissionsModal
        isOpen={isPermissionsOpen}
        onClose={closePermissionsModal}
        onSubmit={savePermissions}
        role={permissionsRole}
        catalog={catalogPermissions}
        initialSelectedIds={selectedPermissionIds}
        isLoading={isLoadingPermissions}
        isSaving={isSaving}
      />

      {/* Modal Confirmación Activar / Desactivar */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
        variant={isDesactivar ? "danger" : "warning"}
        title={isDesactivar ? "¿Desactivar rol?" : "¿Activar rol?"}
        description={
          isDesactivar
            ? `¿Estás seguro de desactivar el rol '${confirmRole?.nombre}'? Los usuarios con este rol perdonarán los accesos vinculados.`
            : `¿Deseas activar el rol '${confirmRole?.nombre}'?`
        }
        confirmText={isDesactivar ? "Sí, desactivar" : "Sí, activar"}
        cancelText="Cancelar"
      />
    </div>
  );
}