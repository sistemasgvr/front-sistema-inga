"use client";

import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import Pagination from "@/components/tables/Pagination";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import { useCategorias } from "../hooks/use-categorias";
import { CategoriasTable } from "./categorias-table";
import { CategoriaFormModal } from "./categoria-form-modal";

export function CategoriasView() {
  const router = useRouter();

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
    filtroEsCarta,
    setFiltroEsCarta,
    resumen,
    isLoading,
    isSaving,
    loadingCategoriaId,
    currentUser,
    hasLoadedSession,
    editingCategoria,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveCategoria,
    confirmCategoria,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  } = useCategorias();

  const isDesactivar = confirmCategoria?.estado === 1;

  const isSuper = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
  const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];
  const hasListPermission = isSuper || userPermisos.includes(PermisoBanderas.CATEGORIAS_LISTAR);

  const canCreateCategoria = isSuper || userPermisos.includes(PermisoBanderas.CATEGORIAS_CREAR);

  if (hasLoadedSession && currentUser && !hasListPermission) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Categorías" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05]">
          <div className="rounded-2xl bg-error-50 p-4 text-error-600 dark:bg-error-500/10 dark:text-error-400 mb-4">
            <Icon name="mdi:shield-lock-outline" size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Acceso Restringido
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            No cuentas con el permiso requerido (<code className="font-semibold text-gray-700 dark:text-gray-300">categorias.listar</code>) para visualizar este módulo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Gestión de Categorías de Producto" />

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
          <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">{resumen.activos}</span>
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
          <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">{resumen.inactivos}</span>
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
          <span>Total:</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">{resumen.total}</span>
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:max-w-xl">
          <div className="w-full">
            <Input type="search" placeholder="Buscar por código o nombre..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>

          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: "", label: "Todas las cartas" },
                { value: "true", label: "En Carta" },
                { value: "false", label: "No en Carta" },
              ]}
              defaultValue={filtroEsCarta === undefined ? "" : filtroEsCarta ? "true" : "false"}
              placeholder="Carta..."
              onChange={(val) => {
                setFiltroEsCarta(val === "" ? undefined : val === "true");
                setPagina(1);
              }}
            />
          </div>
        </div>

        {canCreateCategoria && (
          <Button size="sm" type="button" onClick={openCreateModal} startIcon={<Icon name="mdi:plus" size={18} />}>
            Nueva Categoría
          </Button>
        )}
      </div>

      <CategoriasTable
        categorias={registros}
        currentUser={currentUser}
        isLoading={isLoading}
        loadingCategoriaId={loadingCategoriaId}
        onEdit={openEditModal}
        onToggleStatus={openConfirmModal}
        onViewSubCategorias={(cat) => {
          router.push(`/productos/subcategorias?id_categoria=${cat.id}`);
        }}
      />

      <div className="mt-5">
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} pageSize={pageSize} onPageChange={setPagina} onPageSizeChange={setPageSize} />
      </div>

      <CategoriaFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={saveCategoria}
        categoria={editingCategoria}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
        variant={isDesactivar ? "danger" : "warning"}
        title={isDesactivar ? "¿Desactivar categoría?" : "¿Activar categoría?"}
        description={isDesactivar ? `¿Estás seguro de desactivar a '${confirmCategoria?.nombre}'?` : `¿Deseas activar '${confirmCategoria?.nombre}'?`}
        confirmText={isDesactivar ? "Sí, desactivar" : "Sí, activar"}
        cancelText="Cancelar"
      />
    </div>
  );
}