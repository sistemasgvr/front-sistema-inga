"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SinPermiso from "@/components/common/SinPermiso";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import Pagination from "@/components/tables/Pagination";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import { useAlmacenes } from "../hooks/use-almacenes";
import { AlmacenesTable } from "./almacenes-table";
import { AlmacenFormModal } from "./almacen-form-modal";

export function AlmacenesView() {
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
    loadingAlmacenId,
    currentUser,

    editingAlmacen,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveAlmacen,

    availableSucursales,

    confirmAlmacen,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  } = useAlmacenes();

  const isDesactivar = confirmAlmacen?.estado === 1;

  const isSuper = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
  const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];
  const hasListPermission = userPermisos.includes(PermisoBanderas.ALMACENES_LISTAR);

  const canCreateAlmacen = isSuper || userPermisos.includes(PermisoBanderas.ALMACENES_CREAR);
  const defaultSucursalId = currentUser?.id_sucursal_default ?? 1;

  if (currentUser && !isSuper && !hasListPermission) {
    return <SinPermiso pageTitle="Almacenes" />;
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Almacenes" />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleFilterStatus("activos")}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
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
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
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
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            estadoFiltro === "todos"
              ? "bg-slate-700 text-white shadow-xs dark:bg-slate-600"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          <Icon name="mdi:format-list-bulleted" size={16} />
          <span>Total almacenes:</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">
            {resumen.total}
          </span>
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <Input
            type="search"
            placeholder="Buscar por nombre..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        {canCreateAlmacen && (
          <Button
            size="sm"
            type="button"
            className="w-full sm:w-auto"
            onClick={openCreateModal}
            startIcon={<Icon name="mdi:plus" size={18} />}
          >
            Nuevo almacén
          </Button>
        )}
      </div>

      <AlmacenesTable
        almacenes={registros}
        currentUser={currentUser}
        isLoading={isLoading}
        loadingAlmacenId={loadingAlmacenId}
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

      <AlmacenFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={saveAlmacen}
        almacen={editingAlmacen}
        availableSucursales={availableSucursales}
        isSaving={isSaving}
        defaultSucursalId={defaultSucursalId}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
        variant={isDesactivar ? "danger" : "warning"}
        title={isDesactivar ? "¿Desactivar almacén?" : "¿Activar almacén?"}
        description={
          isDesactivar
            ? `¿Estás seguro de desactivar a '${confirmAlmacen?.nombre}'?`
            : `¿Deseas activar nuevamente a '${confirmAlmacen?.nombre}'?`
        }
        confirmText={isDesactivar ? "Sí, desactivar" : "Sí, activar"}
        cancelText="Cancelar"
      />
    </div>
  );
}