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
    editingUser,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveUser,
    confirmUser,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
    pageSize,
  } = useUsers();

  const isDesactivar = confirmUser?.estado === 1;

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

      {/* CHIPS INTERACTIVOS CON LAS CADENAS QUE ESPERA NESTJS */}
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleFilterStatus("todos")}
          className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            estadoFiltro === "todos"
              ? "bg-brand-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          <span>Total usuarios:</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[11px]">
            {resumen.total}
          </span>
        </button>

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
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-md items-center gap-2">
          <Input
            type="search"
            placeholder="Buscar por nombre, correo o username..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applySearch();
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={applySearch}
            startIcon={<Icon name="mdi:magnify" size={18} />}
          >
            Buscar
          </Button>
        </div>

        <Button
          size="sm"
          type="button"
          onClick={openCreateModal}
          startIcon={<Icon name="mdi:account-plus-outline" size={18} />}
        >
          Nuevo usuario
        </Button>
      </div>

      <UsersTable
        users={registros}
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
        />
      </div>

      <UserFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={saveUser}
        user={editingUser}
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