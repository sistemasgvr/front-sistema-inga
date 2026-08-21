"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import Pagination from "@/components/tables/Pagination";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { useUsers } from "../hooks/use-users";
import { UserFormModal } from "./user-form-modal";
import { UsersTable } from "./users-table";

export function UsersView() {
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
    isLoading,
    isSaving,
    feedback,
    clearFeedback,
    currentUser,

    editingUser,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveUser,

    availableRoles,
    availableSucursales,

    confirmUser,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  } = useUsers();

  const isDesactivar = confirmUser?.estado === 1;

  const isSuper = Boolean(currentUser?.es_super_admin || (currentUser as any)?.sesion?.es_super_admin);
  const hasListPermission = currentUser?.permisos?.includes("usuarios.listar");

  if (currentUser && !isSuper && !hasListPermission) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Usuarios" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05]">
          <div className="rounded-2xl bg-error-50 p-4 text-error-600 dark:bg-error-500/10 dark:text-error-400 mb-4">
            <Icon name="mdi:shield-lock-outline" size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Acceso Restringido
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            No cuentas con el permiso requerido para visualizar este módulo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Usuarios" />

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

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleFilterStatus("activos")}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            estadoFiltro === "activos"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400"
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
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400"
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
              ? "bg-slate-700 text-white shadow-xs dark:bg-slate-600"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          <Icon name="mdi:account-group-outline" size={16} />
          <span>Total usuarios:</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">
            {resumen.total}
          </span>
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <Input
            type="search"
            placeholder="Buscar por nombre, correo o username..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        <Button
          size="sm"
          type="button"
          onClick={openCreateModal}
          startIcon={<Icon name="mdi:plus" size={18} />}
        >
          Nuevo usuario
        </Button>
      </div>

      <UsersTable
        users={registros}
        currentUser={currentUser}
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

      <UserFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={saveUser}
        user={editingUser}
        availableRoles={availableRoles}
        availableSucursales={availableSucursales}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
        variant={isDesactivar ? "danger" : "warning"}
        title={isDesactivar ? "¿Desactivar usuario?" : "¿Activar usuario?"}
        description={
          isDesactivar
            ? `¿Estás seguro de desactivar a @${confirmUser?.username}? Perderá el acceso al sistema.`
            : `¿Deseas activar nuevamente a @${confirmUser?.username}? Recuperará el acceso.`
        }
        confirmText={isDesactivar ? "Sí, desactivar" : "Sí, activar"}
        cancelText="Cancelar"
      />
    </div>
  );
}