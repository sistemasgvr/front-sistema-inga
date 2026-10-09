"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useState } from "react";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import Pagination from "@/components/tables/Pagination";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { useTiposProducto, TipoProductoFormModal } from "@/modules/tipos-producto";
import { useProductos } from "../hooks/use-productos";
import { ProductosTable } from "./productos-table";
import { ProductoFormModal } from "./producto-form-modal";
import { RecetaFormModal } from "@/modules/recetas/components/receta-form-modal";

export function ProductosView() {
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
    tipoFiltro,
    handleFilterTipo,
    categoriaFiltro,
    subcategoriaFiltro,
    handleFilterCategoria,
    handleFilterSubcategoria,
    resumen,
    unidades,
    categorias,
    subcategorias,
    almacenes,
    estaciones,
    isLoading,
    isSaving,
    loadingProductoId,
    editingProducto,
    isFormOpen,
    openCreateModal, loadCatalogosAuxiliares,
    openEditModal,
    closeFormModal,
    saveProducto,
    handleToggleDisponibilidad,
    openRecetasModal,
    recetaProducto,
    isRecetaOpen,
    closeRecetasModal,
    confirmProducto,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  } = useProductos();

  const tipos = useTiposProducto();
  const tiposProductoBD = tipos.options;
  const isDesactivar = confirmProducto?.estado === 1;

  const tipoSelectOptions = [
    { value: "", label: "Todos los tipos" },
    ...tiposProductoBD.map((t) => ({
      value: String(t.id),
      label: t.nombre,
    })),
  ];

  // Alta de un tipo de producto nuevo desde el "+" del filtro de tipo.
  const [isTipoModalOpen, setIsTipoModalOpen] = useState(false);

  const categoriaSelectOptions = [
    { value: "", label: "Todas las categorías" },
    ...categorias.map((c) => ({ value: String(c.id), label: c.nombre })),
  ];

  // Solo las subcategorías de la categoría elegida: el backend filtra igual,
  // pero mostrar todas dejaría elegir una que la consulta va a descartar.
  const subcategoriaSelectOptions = [
    { value: "", label: "Todas las subcategorías" },
    ...subcategorias
      .filter((s) => !categoriaFiltro || s.id_categoria === categoriaFiltro)
      .map((s) => ({ value: String(s.id), label: s.nombre })),
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Gestión de Productos e Insumos" />

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
<div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:max-w-4xl">
          <div>
            <Input
              type="search"
              placeholder="Buscar por código o nombre..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Tipo: el "+" crea un tipo de producto nuevo sin salir de la vista. */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Select
                options={tipoSelectOptions}
                onOpen={() => void tipos.load()} isLoading={tipos.isLoading} loadError={tipos.error}
                defaultValue={tipoFiltro ? String(tipoFiltro) : ""}
                placeholder="Tipo producto..."
                onChange={(val) => handleFilterTipo(val ? Number(val) : undefined)}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsTipoModalOpen(true)}
              title="Crear un tipo de producto"
              className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-500"
            >
              <Icon name="mdi:plus" size={20} />
            </button>
          </div>

          <div>
            <Select
              options={categoriaSelectOptions}
              onOpen={() => void loadCatalogosAuxiliares()}
              defaultValue={categoriaFiltro ? String(categoriaFiltro) : ""}
              placeholder="Categoría..."
              onChange={(val) => handleFilterCategoria(val ? Number(val) : undefined)}
            />
          </div>

          {/* Sin categoría no hay subcategorías que ofrecer. */}
          <div>
            <Select
              options={subcategoriaSelectOptions}
              onOpen={() => void loadCatalogosAuxiliares()}
              defaultValue={subcategoriaFiltro ? String(subcategoriaFiltro) : ""}
              placeholder="Subcategoría..."
              disabled={!categoriaFiltro}
              onChange={(val) => handleFilterSubcategoria(val ? Number(val) : undefined)}
            />
          </div>
        </div>

        <Button size="sm" type="button" onClick={openCreateModal} startIcon={<Icon name="mdi:plus" size={18} />}>
          Nuevo Registro
        </Button>
      </div>

      <ProductosTable
        productos={registros}
        isLoading={isLoading}
        loadingProductoId={loadingProductoId}
        onEdit={openEditModal}
        onToggleDisponibilidad={handleToggleDisponibilidad}
        onToggleStatus={openConfirmModal}
        onManageReceta={openRecetasModal}
      />

      <div className="mt-5">
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} pageSize={pageSize} onPageChange={setPagina} onPageSizeChange={setPageSize} />
      </div>

      <ProductoFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={saveProducto}
        producto={editingProducto}
        unidades={unidades}
        categorias={categorias}
        subcategorias={subcategorias}
        almacenes={almacenes}
        estaciones={estaciones}
        isSaving={isSaving}
      />

      <RecetaFormModal
        isOpen={isRecetaOpen}
        onClose={closeRecetasModal}
        producto={recetaProducto}
        unidades={unidades}
        onRecetaUpdated={() => setPagina((p) => p)}
      />

      {/* Se recarga el catálogo de tipos para que el nuevo quede disponible
          en el filtro, y se deja seleccionado. */}
      {isTipoModalOpen && (
        <TipoProductoFormModal
          onClose={() => setIsTipoModalOpen(false)}
          onCreated={(nuevo) => {
            setIsTipoModalOpen(false);
            void tipos.load();
            handleFilterTipo(nuevo.id);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
        variant={isDesactivar ? "danger" : "warning"}
        title={isDesactivar ? "¿Dar de baja registro?" : "¿Activar registro?"}
        description={isDesactivar ? `¿Estás seguro de dar de baja a '${confirmProducto?.nombre}'?` : `¿Deseas activar '${confirmProducto?.nombre}'?`}
        confirmText={isDesactivar ? "Sí, dar de baja" : "Sí, activar"}
        cancelText="Cancelar"
      />
    </div>
  );
}
