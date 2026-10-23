"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ParametrosRuta from "@/components/common/ParametrosRuta";
import SinPermiso from "@/components/common/SinPermiso";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Pagination from "@/components/tables/Pagination";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import { useStock } from "../hooks/use-stock";
import { StockTable } from "./stock-table";
import { AjusteStockModal } from "./ajuste-stock-modal";
import { DescarteStockModal } from "./descarte-stock-modal";

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

    descartingStockItem,
    openDescarteModal,
    closeDescarteModal,
    saveDescarte,
  } = useStock();

  const isSuper = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
  const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];
  const hasListPermission = isSuper || userPermisos.includes(PermisoBanderas.INVENTARIO_VER);

  if (currentUser && !hasListPermission) {
    return <SinPermiso pageTitle="Control de Stock" />;
  }

  const almacenesOptions = [
    { value: "", label: "Todos los almacenes" },
    ...availableAlmacenes.map((a) => ({ value: String(a.id), label: a.nombre })),
  ];


  return (
    <div>
      <PageBreadcrumb pageTitle="Control de Stock" />
      {/* Enlace desde una alerta de stock: filtra el producto bajo el mínimo. */}
      <ParametrosRuta
        nombres={["estado", "buscar"]}
        onParametros={({ estado, buscar }) => {
          if (buscar !== undefined) setSearchInput(buscar);
          if (estado === "alertas" || estado === "normales" || estado === "todos") handleFilterStatus(estado);
        }}
      />

      <div className="mb-5 flex flex-wrap gap-2" aria-label="Indicadores de stock">
        {([{ estado: "todos", label: "Ítems en stock", valor: resumen.total }, { estado: "alertas", label: "Bajo mínimo", valor: resumen.alertas }, { estado: "normales", label: "Stock OK", valor: resumen.normales }] as const).map(item => (
          <button key={item.estado} type="button" aria-pressed={estadoFiltro === item.estado} onClick={() => handleFilterStatus(item.estado)} className={"rounded-full border px-3 py-1.5 text-sm " + (estadoFiltro === item.estado ? "bg-brand-600 text-white border-brand-600" : "border-gray-200 text-gray-600 dark:text-gray-300")}>
            {item.label} <strong className="ml-2">{item.valor}</strong>
          </button>
        ))}
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
        onDiscard={openDescarteModal}
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

      <DescarteStockModal
        isOpen={Boolean(descartingStockItem)}
        onClose={closeDescarteModal}
        onSubmit={saveDescarte}
        stockItem={descartingStockItem}
        isSaving={isSaving}
      />
    </div>
  );
}