"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import Pagination from "@/components/tables/Pagination";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import { useSubCategorias } from "../hooks/use-subcategorias";
import { SubCategoriasTable } from "./subcategorias-table";
import { SubCategoriaFormModal } from "./subcategoria-form-modal";
import { useEffect, useState } from "react";
import { listCategorias } from "../../categorias/services/categorias.service";
import type { CategoriaItem } from "../../categorias/types/categorias.types";

export function SubCategoriasView() {
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
    filtroCategoria,
    setFiltroCategoria,
    resumen,
    isLoading,
    isSaving,
    loadingSubCategoriaId,
    currentUser,
    hasLoadedSession,
    editingSubCategoria,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveSubCategoria,
    confirmSubCategoria,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  } = useSubCategorias();

  const [categoriasList, setCategoriasList] = useState<CategoriaItem[]>([]);

  useEffect(() => {
    async function loadCats() {
      try {
        const res = await listCategorias({ pagina: 1, limite: 100, estado: "activos" });
        setCategoriasList(res.registros ?? []);
      } catch {
      }
    }
    void loadCats();
  }, []);

  const isDesactivar = confirmSubCategoria?.estado === 1;

  const isSuper = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
  const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];

  const hasListPermission =
    isSuper ||
    userPermisos.includes(PermisoBanderas.CATEGORIAS_LISTAR) ||
    userPermisos.includes(PermisoBanderas.SUBCATEGORIAS_LISTAR);

  const canCreate =
    isSuper ||
    userPermisos.includes(PermisoBanderas.CATEGORIAS_CREAR) ||
    userPermisos.includes(PermisoBanderas.SUBCATEGORIAS_CREAR);

  if (hasLoadedSession && currentUser && !hasListPermission) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Subcategorías" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05]">
          <div className="rounded-2xl bg-error-50 p-4 text-error-600 dark:bg-error-500/10 dark:text-error-400 mb-4">
            <Icon name="mdi:shield-lock-outline" size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Acceso Restringido
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            No cuentas con el permiso requerido (<code className="font-semibold text-gray-700 dark:text-gray-300">subcategorias.listar</code>) para visualizar este módulo.
          </p>
        </div>
      </div>
    );
  }

  const filtroCategoriasOptions = [
    { value: "", label: "Todas las categorías" },
    ...categoriasList.map((cat) => ({
      value: String(cat.id),
      label: cat.nombre,
    })),
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Gestión de Subcategorías de Producto" />

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
          <span>Total:</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">
            {resumen.total}
          </span>
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2.5 sm:max-w-xl sm:flex-row sm:items-center">
          <div className="w-full sm:w-2/3">
            <Input
              type="search"
              placeholder="Buscar por código o nombre..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-1/3">
            <Select
              options={filtroCategoriasOptions}
              defaultValue={filtroCategoria ? String(filtroCategoria) : ""}
              placeholder="Categoría..."
              onChange={(val) => {
                if (!val || val === "") {
                  setFiltroCategoria(undefined);
                } else {
                  const parsed = Number(val);
                  setFiltroCategoria(isNaN(parsed) ? undefined : parsed);
                }
                setPagina(1);
              }}
            />
          </div>
        </div>

        {canCreate && (
          <Button
            size="sm"
            type="button"
            className="w-full sm:w-auto"
            onClick={() => openCreateModal()}
            startIcon={<Icon name="mdi:plus" size={18} />}
          >
            Nueva Subcategoría
          </Button>
        )}
      </div>

      <SubCategoriasTable
        subcategorias={registros}
        currentUser={currentUser}
        isLoading={isLoading}
        loadingSubCategoriaId={loadingSubCategoriaId}
        onEdit={openEditModal}
        onToggleStatus={openConfirmModal}
        onAddSubCategoriaToCat={(idCategoria) => {
          openCreateModal(idCategoria);
        }}
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

      <SubCategoriaFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={saveSubCategoria}
        subcategoria={editingSubCategoria}
        categorias={categoriasList}
        filtroCategoria={filtroCategoria}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
        variant={isDesactivar ? "danger" : "warning"}
        title={isDesactivar ? "¿Desactivar subcategoría?" : "¿Activar subcategoría?"}
        description={
          isDesactivar
            ? `¿Estás seguro de desactivar la subcategoría '${confirmSubCategoria?.nombre}'?`
            : `¿Deseas activar nuevamente la subcategoría '${confirmSubCategoria?.nombre}'?`
        }
        confirmText={isDesactivar ? "Sí, desactivar" : "Sí, activar"}
        cancelText="Cancelar"
      />
    </div>
  );
}