"use client";

import { useUnidadesReceta } from "../hooks/use-unidades-receta";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Combobox } from "@/components/form/Combobox";
import Select from "@/components/form/Select";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useRecetas } from "../hooks/use-recetas";
import { Icon } from "@/components/ui/icon";
import { useEnvioUnico } from "@/shared/hooks/use-envio-unico";
import { useEffect, useState } from "react";
import type { ProductoItem, UnidadMedidaItem } from "@/modules/productos/types/productos.types";

type RecetaFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoItem | null;
  unidades?: UnidadMedidaItem[];
  onRecetaUpdated?: () => void;
};

export function RecetaFormModal({
  isOpen,
  onClose,
  producto,
  onRecetaUpdated,
}: RecetaFormModalProps) {
  const {
    recetaActiva,
    insumosBusqueda,
    isLoading,
    isSaving,
    isSearchingInsumos,
    cargarRecetaProducto,
    buscarInsumos,
    crearNuevaVersionReceta,
    agregarInsumoAEnlace,
    quitarInsumoDeReceta,
    tiposProducto,
    categorias,
    subcategorias,
    isLoadingFiltros,
    filtrosError,
    cargarFiltros,
    filtroTipo,
    filtroCategoria,
    filtroSubcategoria,
    aplicarFiltroTipo,
    aplicarFiltroCategoria,
    aplicarFiltroSubcategoria,
    limpiarFiltros,
  } = useRecetas(producto);
  // Las acciones que escriben la receta ignoran un segundo clic mientras responde el backend.
  const { ejecutar } = useEnvioUnico();

  const [selectedInsumoId, setSelectedInsumoId] = useState<number | null>(null);
  const [cantidadInput, setCantidadInput] = useState<number>(1);
  const [mermaInput, setMermaInput] = useState<number>(0);
  const [unidadInputId, setUnidadInputId] = useState<number>(0);
  const [unidadSimbolo, setUnidadSimbolo] = useState<string>("");

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingCantidad, setEditingCantidad] = useState<number>(0);
  const [editingMerma, setEditingMerma] = useState<number>(0);

  const [itemToDelete, setItemToDelete] = useState<{ id: number; nombre: string } | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => {
    if (isOpen && producto?.id) {
      void cargarRecetaProducto();
      void buscarInsumos("");
    } else if (!isOpen) {
      // Al reabrir, los filtros de la sesión anterior no deben persistir.
      limpiarFiltros();
      setSelectedInsumoId(null);
      setUnidadSimbolo("");
    }
  }, [isOpen, producto?.id, cargarRecetaProducto, buscarInsumos, limpiarFiltros]);

  // Sub-plato elegido en el selector. Un insumo crudo nunca tiene receta, así que
// este estado solo existe cuando el usuario compone platos con platos.
  const insumoSeleccionado = insumosBusqueda.find((i) => i.id === selectedInsumoId);

  const unidadesReceta = useUnidadesReceta(isOpen, insumoSeleccionado?.id_unidad_medida);
  const unidadCantidad = unidadesReceta.compatibles.find(u => Number(u.id) === Number(unidadInputId));
  const factorCantidad = unidadCantidad?.factor ?? (Number(unidadInputId) === Number(insumoSeleccionado?.id_unidad_medida) ? 1 : 0);
  const validarInputs = () => Array.from(document.querySelectorAll<HTMLInputElement>('[data-receta] input')).every(input => input.reportValidity());
  const hayFiltrosActivos = Boolean(
    filtroTipo || filtroCategoria || filtroSubcategoria
  );

  /**
   * prod_preparar rechaza la producción anticipada si la receta tiene grupos de
   * sustitución: el sub-plato solo podrá producirse cuando llegue el pedido.
   * Se avisa al seleccionar, no al guardar, para que la decisión sea informada.
   */
  const avisoSustitucion = insumoSeleccionado?.tiene_grupos_sustitucion
    ? `"${insumoSeleccionado.nombre}" tiene insumos con grupo de sustitución. ` +
      `No podrá anticiparse en el almacén: solo se prepara al momento del pedido, ` +
      `eligiendo una de sus alternativas.`
    : null;

  const handleSelectInsumo = (valueStr: string) => {
    const id = Number(valueStr);
    setSelectedInsumoId(id);

    const insumoEncontrado = insumosBusqueda.find((i) => i.id === id);
    if (insumoEncontrado) {
      setUnidadInputId(insumoEncontrado.id_unidad_medida);
      setUnidadSimbolo(insumoEncontrado.simbolo_unidad || "und");
    }
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    if (onRecetaUpdated) {
      onRecetaUpdated();
    }
    onClose();
  };

  async function handleInicializar() {
    await crearNuevaVersionReceta(`Receta - ${producto?.nombre}`, 1);
  }

  async function handleAgregarInsumo() {
    if (isSaving || !selectedInsumoId || !Number.isFinite(cantidadInput) || cantidadInput <= 0 || !unidadInputId || !factorCantidad || !validarInputs()) return;

    await agregarInsumoAEnlace({
      id_producto_insumo: selectedInsumoId,
      cantidad: Number((cantidadInput * factorCantidad).toFixed(4)),
      id_unidad_medida: Number(insumoSeleccionado!.id_unidad_medida),
      porcentaje_merma: mermaInput,
    });

    setSelectedInsumoId(null);
    setCantidadInput(1);
    setMermaInput(0);
    setUnidadSimbolo("");
  }

  const startEditCantidad = (idInsumoReceta: number, cantidadActual: number, mermaActual: number) => {
    setEditingItemId(idInsumoReceta);
    setEditingCantidad(cantidadActual);
    setEditingMerma(mermaActual || 0);
  };

  const handleSaveCantidadInline = async (item: any) => {
    if (isSaving || !Number.isFinite(editingCantidad) || editingCantidad <= 0 || !validarInputs()) return;

    await agregarInsumoAEnlace({
      id_producto_insumo: item.id_producto_insumo,
      cantidad: editingCantidad,
      id_unidad_medida: item.id_unidad_medida,
      porcentaje_merma: editingMerma,
    });

    setEditingItemId(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await quitarInsumoDeReceta(itemToDelete.id);
    setItemToDelete(null);
  };

  const ingredientesExistentesIds = new Set(
    recetaActiva?.insumos?.map((i) => i.id_producto_insumo) || []
  );

  const insumosDisponibles = insumosBusqueda.filter(
    (i) => !ingredientesExistentesIds.has(i.id)
  );

  // El recetario es multi-nivel: un sub-plato se marca para que el usuario no lo
// confunda con un insumo crudo. Su costo y su desglose están en otro nivel.
  const comboboxOptions = insumosDisponibles.map((i) => ({
    value: String(i.id),
    label: i.tiene_receta ? `${i.nombre}  ·  sub-plato` : i.nombre,
    sublabel: [
      i.simbolo_unidad ? `Porción UM: ${i.simbolo_unidad}` : null,
      i.nombre_tipo_producto ? `Tipo: ${i.nombre_tipo_producto}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
  }));

  const isAddDisabled = isSaving || !selectedInsumoId || cantidadInput <= 0;

  const costoTotalReceta = Number(recetaActiva?.costo_total_calculado || 0);
  const precioVentaPlato = Number(producto?.precio_venta || 0);
  const margenEstimado = precioVentaPlato - costoTotalReceta;
  const margenPorcentaje = precioVentaPlato > 0 ? (margenEstimado / precioVentaPlato) * 100 : 0;
  const tienePrecio = Boolean(producto?.permite_venta) && precioVentaPlato > 0;
  const totalFiltrosActivos = [filtroTipo, filtroCategoria, filtroSubcategoria].filter(Boolean).length;
  const insumos = recetaActiva?.insumos ?? [];

  const unidadOptions = unidadesReceta.compatibles.length
    ? unidadesReceta.compatibles.map((u) => ({ value: String(u.id), label: `${u.nombre} (${u.simbolo})` }))
    : [{ value: String(unidadInputId), label: unidadSimbolo || "Unidad" }];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[900px] p-0"
        showCloseButton={true}
      >
        <div data-receta className="flex max-h-[90vh] flex-col">
          {/* Encabezado */}
          <div className="border-b border-gray-100 px-6 pt-6 pb-4 pr-16 dark:border-white/[0.05]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <Icon name="mdi:receipt-text-outline" size={22} />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Registra tus ingredientes o sub-platos para: {producto?.nombre ?? ""}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  El costo de la receta se recalcula cada vez que agregas o editas un ingrediente.
                </p>
              </div>
            </div>
          </div>

          <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {isLoading ? (
              <div className="py-10 text-center text-sm text-gray-500">Cargando receta...</div>
            ) : !recetaActiva ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center dark:border-gray-700">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <Icon name="mdi:chef-hat" size={26} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Este producto todavía no tiene una receta
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Iníciala para registrar sus ingredientes y conocer cuánto cuesta elaborarlo.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void ejecutar(handleInicializar)}
                  disabled={isSaving}
                  startIcon={<Icon name="mdi:plus" size={18} />}
                >
                  Iniciar receta
                </Button>
              </div>
            ) : (
              <>
                {/* Resumen de costo y margen */}
                <div className="grid grid-cols-1 divide-y divide-gray-200 rounded-xl border border-gray-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-white/[0.05] dark:border-white/[0.05]">
                  <div className="px-4 py-3">
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Costo de receta</span>
                    <span className="mt-0.5 block text-lg font-bold text-gray-900 dark:text-white">
                      S/ {costoTotalReceta.toFixed(2)}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Precio de venta</span>
                    <span className="mt-0.5 block text-lg font-bold text-gray-900 dark:text-white">
                      {tienePrecio ? `S/ ${precioVentaPlato.toFixed(2)}` : "—"}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Margen estimado</span>
                    {tienePrecio ? (
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`text-lg font-bold ${
                            margenEstimado >= 0
                              ? "text-success-600 dark:text-success-400"
                              : "text-error-600 dark:text-error-400"
                          }`}
                        >
                          S/ {margenEstimado.toFixed(2)}
                        </span>
                        <Badge size="sm" color={margenEstimado >= 0 ? "success" : "error"}>
                          {margenEstimado >= 0 ? "Positivo" : "Negativo"} · {margenPorcentaje.toFixed(0)}%
                        </Badge>
                      </div>
                    ) : (
                      <span className="mt-1 block text-xs text-gray-400">
                        {producto?.permite_venta ? "Configura un precio de venta" : "Producto no destinado a la venta"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Agregar ingrediente */}
                <section className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Agregar ingrediente</h4>
                    <button
                      type="button"
                      onClick={() => setMostrarFiltros((v) => !v)}
                      aria-expanded={mostrarFiltros}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-white/[0.05]"
                    >
                      <Icon name="mdi:filter-variant" size={16} />
                      Filtros
                      {totalFiltrosActivos > 0 && (
                        <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
                          {totalFiltrosActivos}
                        </span>
                      )}
                      <Icon name={mostrarFiltros ? "mdi:chevron-up" : "mdi:chevron-down"} size={16} />
                    </button>
                  </div>

                  {/* Los filtros acotan el buscador: admite insumos crudos y
                      sub-platos, así que tipo, categoría y subcategoría reducen
                      el universo igual que en el catálogo. */}
                  {mostrarFiltros && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <Label>Tipo</Label>
                          <Select
                            options={[
                              { value: "", label: "Todos" },
                              ...tiposProducto.map((t) => ({ value: String(t.id), label: t.nombre })),
                            ]}
                            defaultValue={filtroTipo ? String(filtroTipo) : ""}
                            onChange={(v) => void aplicarFiltroTipo(v ? Number(v) : null)}
                            onOpen={() => void cargarFiltros()}
                            isLoading={isLoadingFiltros}
                            loadError={filtrosError}
                          />
                        </div>
                        <div>
                          <Label>Categoría</Label>
                          <Select
                            options={[
                              { value: "", label: "Todas" },
                              ...categorias.map((c) => ({ value: String(c.id), label: c.nombre })),
                            ]}
                            defaultValue={filtroCategoria ? String(filtroCategoria) : ""}
                            onChange={(v) => void aplicarFiltroCategoria(v ? Number(v) : null)}
                            onOpen={() => void cargarFiltros()}
                            isLoading={isLoadingFiltros}
                            loadError={filtrosError}
                          />
                        </div>
                        <div>
                          <Label>Subcategoría</Label>
                          <Select
                            options={[
                              { value: "", label: "Todas" },
                              ...subcategorias.map((s) => ({ value: String(s.id), label: s.nombre })),
                            ]}
                            defaultValue={filtroSubcategoria ? String(filtroSubcategoria) : ""}
                            onChange={(v) => void aplicarFiltroSubcategoria(v ? Number(v) : null)}
                            onOpen={() => void cargarFiltros()}
                            isLoading={isLoadingFiltros}
                            loadError={filtrosError}
                            // Sin categoría no hay subcategorías que ofrecer.
                            disabled={!filtroCategoria}
                          />
                        </div>
                      </div>
                      {hayFiltrosActivos && (
                        <button
                          type="button"
                          onClick={limpiarFiltros}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                        >
                          <Icon name="mdi:filter-remove-outline" size={14} />
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <Label>Insumo o sub-plato *</Label>
                    <Combobox
                      options={comboboxOptions}
                      placeholder={
                        comboboxOptions.length === 0 && insumosBusqueda.length > 0
                          ? "Sin insumos disponibles"
                          : "Buscar insumo o plato..."
                      }
                      searchPlaceholder="Buscar por nombre..."
                      onChange={handleSelectInsumo}
                      onSearchChange={(term) => void buscarInsumos(term)}
                      defaultValue={selectedInsumoId ? String(selectedInsumoId) : ""}
                      isLoading={isSearchingInsumos}
                      disabled={isSaving || comboboxOptions.length === 0}
                    />

                    {/* Aviso de producción anticipada: se muestra al seleccionar,
                        para que la restricción se conozca antes de guardar. */}
                    {avisoSustitucion && (
                      <div className="mt-2">
                        <Alert
                          variant="warning"
                          title="Preparación solo por pedido"
                          message={avisoSustitucion}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-12 sm:items-start">
                    <div className="sm:col-span-3">
                      <Label>Cantidad *</Label>
                      <Input
                        type="number"
                        step={0.001}
                        min="0.001"
                        value={cantidadInput}
                        onChange={(e) => setCantidadInput(Number(e.target.value))}
                        placeholder="Ej. 200"
                        disabled={isSaving || !selectedInsumoId}
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <Label>Unidad</Label>
                      <Select
                        options={unidadOptions}
                        defaultValue={String(unidadInputId)}
                        placeholder="Unidad"
                        onChange={(value) => setUnidadInputId(Number(value))}
                        onOpen={() => void unidadesReceta.load()}
                        isLoading={unidadesReceta.isLoading}
                        loadError={unidadesReceta.error}
                        disabled={!selectedInsumoId || isSaving}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>% Merma</Label>
                      <Input
                        type="number"
                        step={0.1}
                        min="0"
                        max="100"
                        value={mermaInput}
                        onChange={(e) => setMermaInput(Number(e.target.value))}
                        placeholder="0"
                        disabled={isSaving || !selectedInsumoId}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-3 sm:pt-[26px]">
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={() => void ejecutar(handleAgregarInsumo)}
                        disabled={isAddDisabled}
                        startIcon={<Icon name="mdi:plus" size={18} />}
                      >
                        Agregar
                      </Button>
                    </div>
                  </div>

                  {selectedInsumoId && factorCantidad > 0 && factorCantidad !== 1 && (
                    <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Icon name="mdi:swap-horizontal" size={14} />
                      Equivale a{" "}
                      <strong className="text-gray-700 dark:text-gray-300">
                        {(cantidadInput * factorCantidad).toLocaleString("es-PE", { maximumFractionDigits: 4 })} {unidadSimbolo}
                      </strong>{" "}
                      del stock.
                    </p>
                  )}
                </section>

                {/* Ingredientes de la receta */}
                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Ingredientes <span className="font-normal text-gray-400">({insumos.length})</span>
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <Table>
                      <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                        <TableRow>
                          <TableCell isHeader className="px-4 py-3 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Ingrediente</TableCell>
                          <TableCell isHeader className="px-4 py-3 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Cantidad</TableCell>
                          <TableCell isHeader className="px-4 py-3 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Costo unit.</TableCell>
                          <TableCell isHeader className="px-4 py-3 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Merma</TableCell>
                          <TableCell isHeader className="px-4 py-3 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Subtotal</TableCell>
                          <TableCell isHeader className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Acciones</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {insumos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                              Aún no hay ingredientes. Búscalos arriba y agrégalos a la receta.
                            </TableCell>
                          </TableRow>
                        ) : (
                          insumos.map((item) => {
                            const isEditingThis = editingItemId === item.id;
                            const sinCosto = !(Number(item.costo_unitario_estimado) > 0);
                            const simbolo = item.simbolo_unidad || "und";

                            return (
                              <TableRow key={item.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                <TableCell className="px-4 py-3 text-start text-sm font-medium text-gray-900 dark:text-white">
                                  {item.nombre_insumo || `Insumo #${item.id_producto_insumo}`}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-end text-sm text-gray-700 dark:text-gray-300">
                                  {isEditingThis ? (
                                    <div className="ml-auto flex w-32 items-center gap-1.5">
                                      <Input
                                        type="number"
                                        step={0.001}
                                        min="0.001"
                                        value={editingCantidad}
                                        onChange={(e) => setEditingCantidad(Number(e.target.value))}
                                      />
                                      <span className="text-xs text-gray-500">{simbolo}</span>
                                    </div>
                                  ) : (
                                    <span>
                                      {Number(item.cantidad).toLocaleString("es-PE", { maximumFractionDigits: 4 })}{" "}
                                      <span className="text-xs text-gray-500">{simbolo}</span>
                                    </span>
                                  )}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-end text-sm">
                                  {sinCosto ? (
                                    <span
                                      className="inline-flex items-center gap-1 text-warning-600 dark:text-warning-400"
                                      title="Este insumo aún no tiene costo registrado"
                                    >
                                      <Icon name="mdi:alert-circle-outline" size={15} />
                                      S/ 0.00
                                    </span>
                                  ) : (
                                    <span className="text-gray-700 dark:text-gray-300">
                                      S/ {Number(item.costo_unitario_estimado).toFixed(2)}
                                    </span>
                                  )}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-end text-sm text-gray-600 dark:text-gray-400">
                                  {isEditingThis ? (
                                    <div className="ml-auto w-20">
                                      <Input
                                        type="number"
                                        step={0.1}
                                        min="0"
                                        max="100"
                                        value={editingMerma}
                                        onChange={(e) => setEditingMerma(Number(e.target.value))}
                                      />
                                    </div>
                                  ) : (
                                    <span>{Number(item.porcentaje_merma || 0)}%</span>
                                  )}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-end text-sm font-semibold text-gray-900 dark:text-white">
                                  S/ {Number(item.monto_subtotal ?? 0).toFixed(2)}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {isEditingThis ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => void ejecutar(() => handleSaveCantidadInline(item))}
                                          disabled={isSaving || editingCantidad <= 0}
                                          className="cursor-pointer text-success-600 hover:text-success-700 disabled:opacity-40"
                                          title="Guardar"
                                        >
                                          <Icon name="mdi:check" size={18} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingItemId(null)}
                                          disabled={isSaving}
                                          className="cursor-pointer text-gray-400 hover:text-gray-600"
                                          title="Cancelar"
                                        >
                                          <Icon name="mdi:close" size={18} />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => startEditCantidad(item.id, Number(item.cantidad), Number(item.porcentaje_merma || 0))}
                                          disabled={isSaving}
                                          className="cursor-pointer text-gray-400 hover:text-brand-600"
                                          title="Editar cantidad y merma"
                                        >
                                          <Icon name="mdi:pencil-outline" size={18} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setItemToDelete({ id: item.id, nombre: item.nombre_insumo || `Insumo #${item.id_producto_insumo}` })}
                                          disabled={isSaving}
                                          className="cursor-pointer text-gray-400 hover:text-error-600"
                                          title="Quitar ingrediente"
                                        >
                                          <Icon name="mdi:trash-can-outline" size={18} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                        {insumos.length > 0 && (
                          <TableRow className="bg-gray-50/60 dark:bg-white/[0.02]">
                            <TableCell colSpan={4} className="px-4 py-3 text-end text-sm font-semibold text-gray-600 dark:text-gray-300">
                              Costo total de la receta
                            </TableCell>
                            <TableCell className="px-4 py-3 text-end text-sm font-bold text-gray-900 dark:text-white">
                              S/ {costoTotalReceta.toFixed(2)}
                            </TableCell>
                            <TableCell className="px-4 py-3">{null}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Pie */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.05]">
            <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Icon name="mdi:content-save-check-outline" size={16} />
              Cada cambio se guarda al momento.
            </p>
            <Button type="button" size="sm" variant="outline" onClick={handleCloseModal} disabled={isSaving}>
              Listo
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isSaving}
        variant="danger"
        title="¿Quitar ingrediente?"
        description={`Se quitará '${itemToDelete?.nombre ?? ""}' de la receta y se recalculará su costo.`}
        confirmText="Sí, quitar"
        cancelText="Cancelar"
      />
    </>
  );
}
