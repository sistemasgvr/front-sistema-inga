"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import Pagination from "@/components/tables/Pagination";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
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
    feedback,
    clearFeedback,
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
        setCategoriasList(res.registros);
      } catch {
        // Silencioso
      }
    }
    void loadCats();
  }, []);

  const isDesactivar = confirmSubCategoria?.estado === 1;

  return (
    <div>
      <PageBreadcrumb pageTitle="Gestión de Subcategorías de Producto" />

      {feedback && (
        <div className="mb-5">
          <Alert variant={feedback.variant} title={feedback.title} message={feedback.message} />
          <button type="button" onClick={clearFeedback} className="text-xs mt-2 text-gray-500 underline">Cerrar aviso</button>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleFilterStatus("activos")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              estadoFiltro === "activos" ? "bg-emerald-600 text-white" : "bg-success-50 text-success-600 dark:bg-success-500/10"
            }`}
          >
            <Icon name="mdi:check-circle-outline" size={16} />
            <span>Activos:</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">{resumen.activos}</span>
          </button>
          <button
            type="button"
            onClick={() => handleFilterStatus("inactivos")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              estadoFiltro === "inactivos" ? "bg-rose-600 text-white" : "bg-error-50 text-error-600 dark:bg-error-500/10"
            }`}
          >
            <Icon name="mdi:close-circle-outline" size={16} />
            <span>Inactivos:</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">{resumen.inactivos}</span>
          </button>
          <button
            type="button"
            onClick={() => handleFilterStatus("todos")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              estadoFiltro === "todos" ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800"
            }`}
          >
            <Icon name="mdi:format-list-bulleted" size={16} />
            <span>Total:</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">{resumen.total}</span>
          </button>
        </div>

        {/* Filtro por Categoría Padre */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Categoría:</span>
          <select
            value={filtroCategoria ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setFiltroCategoria(val ? Number(val) : undefined);
              setPagina(1);
            }}
            className="rounded-lg border border-gray-300 bg-transparent px-2.5 py-1 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Todas las categorías</option>
            {categoriasList.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <Input type="search" placeholder="Buscar por código o nombre..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <Button size="sm" type="button" onClick={openCreateModal} startIcon={<Icon name="mdi:plus" size={18} />}>
          Nueva Subcategoría
        </Button>
      </div>

      <SubCategoriasTable
        subcategorias={registros}
        isLoading={isLoading}
        onEdit={openEditModal}
        onToggleStatus={openConfirmModal}
      />

      <div className="mt-5">
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} pageSize={pageSize} onPageChange={setPagina} onPageSizeChange={setPageSize} />
      </div>

      <SubCategoriaFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={saveSubCategoria}
        subcategoria={editingSubCategoria}
        categorias={categoriasList}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
        variant={isDesactivar ? "danger" : "warning"}
        title={isDesactivar ? "¿Desactivar subcategoría?" : "¿Activar subcategoría?"}
        description={isDesactivar ? `¿Estás seguro de desactivar a '${confirmSubCategoria?.nombre}'?` : `¿Deseas activar '${confirmSubCategoria?.nombre}'?`}
        confirmText={isDesactivar ? "Sí, desactivar" : "Sí, activar"}
        cancelText="Cancelar"
      />
    </div>
  );
}