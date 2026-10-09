"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Pagination from "@/components/tables/Pagination";
import { Icon } from "@/components/ui/icon";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import { useStock } from "../hooks/use-stock";
import { StockTable } from "./stock-table";
import { AjusteStockModal } from "./ajuste-stock-modal";

export function InventarioView() {
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
    selectedAlmacenId,
    setSelectedAlmacenId,
    resumen,
    isLoading,
    isSaving,
    currentUser,
    availableAlmacenes, loadAlmacenes, loadingAlmacenes, errorAlmacenes,

    adjustingStockItem,
    isAjusteModalOpen,
    openAjusteModal,
    closeAjusteModal,
    saveAjuste,
  } = useStock();

  const isSuper = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
  const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];
  const hasListPermission = isSuper || userPermisos.includes(PermisoBanderas.INVENTARIO_VER);

  if (currentUser && !hasListPermission) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Control de Stock" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05]">
          <div className="rounded-2xl bg-error-50 p-4 text-error-600 dark:bg-error-500/10 dark:text-error-400 mb-4">
            <Icon name="mdi:shield-lock-outline" size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Acceso Restringido
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            No cuentas con el permiso requerido (<code className="font-semibold text-gray-700 dark:text-gray-300">inventario.ver</code>) para visualizar las existencias.
          </p>
        </div>
      </div>
    );
  }

  const almacenesOptions = [
    { value: "", label: "Todos los almacenes" },
    ...availableAlmacenes.map((a) => ({ value: String(a.id), label: a.nombre })),
  ];

  const unidadesTotales = registros.reduce((acc, item) => acc + Number(item.stock_actual || 0), 0);

  return (
    <div>
      <PageBreadcrumb pageTitle="Control de Stock" />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => handleFilterStatus("todos")}
          className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all ${
            estadoFiltro === "todos"
              ? "border-brand-500 bg-brand-50/20 dark:bg-brand-500/10 shadow-xs"
              : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/[0.05] dark:bg-white/[0.03]"
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Ítems en stock
            </span>
            <h4 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {resumen.total}
            </h4>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Icon name="mdi:package-variant-closed" size={24} />
          </div>
        </div>

        <div
          onClick={() => handleFilterStatus("alertas")}
          className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all ${
            estadoFiltro === "alertas"
              ? "border-rose-500 bg-rose-50/20 dark:bg-rose-500/10 shadow-xs"
              : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/[0.05] dark:bg-white/[0.03]"
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Bajo mínimo
            </span>
            <h4 className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {resumen.alertas}
            </h4>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <Icon name="mdi:alert-circle-outline" size={24} />
          </div>
        </div>

        <div
          onClick={() => handleFilterStatus("normales")}
          className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all ${
            estadoFiltro === "normales"
              ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-500/10 shadow-xs"
              : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/[0.05] dark:bg-white/[0.03]"
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Stock OK
            </span>
            <h4 className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {resumen.normales}
            </h4>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Icon name="mdi:check-circle-outline" size={24} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Unidades totales
            </span>
            <h4 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {unidadesTotales.toLocaleString("es-PE", { maximumFractionDigits: 2 })}
            </h4>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <Icon name="mdi:archive-outline" size={24} />
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:max-w-xl">
          <div className="w-full">
            <Input
              type="search"
              placeholder="Buscar por almacén, código o producto..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              options={almacenesOptions} onOpen={()=>void loadAlmacenes()} isLoading={loadingAlmacenes} loadError={errorAlmacenes}
              defaultValue={selectedAlmacenId ? String(selectedAlmacenId) : ""}
              onChange={(val) => setSelectedAlmacenId(val ? Number(val) : undefined)}
              placeholder="Todos los almacenes..."
            />
          </div>
        </div>
      </div>

      <StockTable
        items={registros}
        currentUser={currentUser}
        isLoading={isLoading}
        onAdjust={openAjusteModal}
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

      <AjusteStockModal
        isOpen={isAjusteModalOpen}
        onClose={closeAjusteModal}
        onSubmit={saveAjuste}
        stockItem={adjustingStockItem}
        isSaving={isSaving}
      />
    </div>
  );
}