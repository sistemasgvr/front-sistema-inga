"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import Pagination from "@/components/tables/Pagination";
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
    handleToggleStatus,
  } = useUsers();

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

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-md items-center gap-2">
          <Input
            type="search"
            placeholder="Buscar por nombre, correo o rol..."
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
        onToggleStatus={handleToggleStatus}
      />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          {total} usuario{total === 1 ? "" : "s"} en total
        </p>
        <Pagination
          currentPage={pagina}
          totalPages={totalPages}
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
    </div>
  );
}
