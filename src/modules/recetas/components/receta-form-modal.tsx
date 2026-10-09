"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Combobox } from "@/components/form/Combobox";
import Select from "@/components/form/Select";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useRecetas } from "../hooks/use-recetas";
import { Icon } from "@/components/ui/icon";
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

  const [selectedInsumoId, setSelectedInsumoId] = useState<number | null>(null);
  const [cantidadInput, setCantidadInput] = useState<number>(1);
  const [mermaInput, setMermaInput] = useState<number>(0);
  const [unidadInputId, setUnidadInputId] = useState<number>(0);
  const [unidadSimbolo, setUnidadSimbolo] = useState<string>("");

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingCantidad, setEditingCantidad] = useState<number>(0);
  const [editingMerma, setEditingMerma] = useState<number>(0);

  const [itemToDelete, setItemToDelete] = useState<{ id: number; nombre: string } | null>(null);

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
    if (onRecetaUpdated) {
      onRecetaUpdated();
    }
    onClose();
  };

  async function handleInicializar() {
    await crearNuevaVersionReceta(`Receta - ${producto?.nombre}`, 1);
  }

  async function handleAgregarInsumo() {
    if (!selectedInsumoId || cantidadInput <= 0 || !unidadInputId) return;

    await agregarInsumoAEnlace({
      id_producto_insumo: selectedInsumoId,
      cantidad: cantidadInput,
      id_unidad_medida: unidadInputId,
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
    if (editingCantidad <= 0) return;

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
      `Código: ${i.codigo_interno || "N/A"}`,
      i.simbolo_unidad ? `Porción UM: ${i.simbolo_unidad}` : null,
      i.nombre_tipo_producto ? `Tipo: ${i.nombre_tipo_producto}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
  }));

  const isAddDisabled = isSaving || !selectedInsumoId || cantidadInput <= 0;

  const costoTotalReceta = Number(recetaActiva?.costo_total_calculado || 0);
  const precioVentaPlato = Number(producto?.precio_venta || 0);
  const margenEstimado = precioVentaPlato > 0 ? precioVentaPlato - costoTotalReceta : 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[840px] p-6"
        showCloseButton={true}
      >
        <div className="pb-4 border-b border-gray-100 dark:border-white/[0.05] pr-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="mdi:receipt-text-outline" size={20} className="text-brand-600 dark:text-brand-400" />
              <span>Ficha de Receta: {producto?.nombre ?? ""}</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Gestiona las porciones e insumos procesados vinculados a este plato.
            </p>
          </div>

          {recetaActiva && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-left sm:text-right">
                <span className="block text-[10px] font-bold uppercase text-gray-400">Costo Receta</span>
                <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">S/ {costoTotalReceta.toFixed(2)}</span>
              </div>
              {precioVentaPlato > 0 && (
                <div className="text-left sm:text-right border-l border-gray-200 dark:border-white/[0.08] pl-3">
                  <span className="block text-[10px] font-bold uppercase text-gray-400">Margen Estimado</span>
                  <span className={`text-sm font-extrabold ${margenEstimado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                    S/ {margenEstimado.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-500">Cargando receta...</div>
          ) : !recetaActiva ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Este producto no cuenta con una versión de receta activa.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleInicializar}
                disabled={isSaving}
              >
                Inicializar Receta v1
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  Versión actual: <strong className="text-gray-900 dark:text-white">v{recetaActiva.version} — {recetaActiva.nombre || "Receta Estándar"}</strong>
                </span>
                <Badge size="sm" color="success">Vigente</Badge>
              </div>

              {/* Filtros del recetario, en fila propia de ancho completo: el selector
                      admite insumos crudos y sub-platos, así que tipo, categoría
                      y subcategoría acotan el universo igual que en el catálogo.
                      Cada uno ocupa la misma columna para que ninguno quede
                      apretado dentro del campo del selector. */}
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      options={[
                        { value: "", label: "Todos" },
                        ...tiposProducto.map((t) => ({
                          value: String(t.id),
                          label: t.nombre,
                        })),
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
                        ...categorias.map((c) => ({
                          value: String(c.id),
                          label: c.nombre,
                        })),
                      ]}
                      defaultValue={filtroCategoria ? String(filtroCategoria) : ""}
                      onChange={(v) =>
                        void aplicarFiltroCategoria(v ? Number(v) : null)
                      }
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
                        ...subcategorias.map((s) => ({
                          value: String(s.id),
                          label: s.nombre,
                        })),
                      ]}
                      defaultValue={
                        filtroSubcategoria ? String(filtroSubcategoria) : ""
                      }
                      onChange={(v) =>
                        void aplicarFiltroSubcategoria(v ? Number(v) : null)
                      }
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
                    className="mb-3 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                  >
                    <Icon name="mdi:filter-remove-outline" size={14} />
                    Limpiar filtros
                  </button>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
                  <div className="sm:col-span-5">
                  <Label>Insumo o sub-plato *</Label>
                  <Combobox
                    options={comboboxOptions}
                    placeholder={
                      comboboxOptions.length === 0 && insumosBusqueda.length > 0
                        ? "Sin insumos disponibles"
                        : "Buscar insumo o plato..."
                    }
                    searchPlaceholder="Buscar por código o nombre..."
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

                <div className="sm:col-span-3">
                  <Label>Cantidad {unidadSimbolo ? `(${unidadSimbolo})` : ""}</Label>
                  <Input
                    type="number"
                    step={0.001}
                    min="0.001"
                    value={cantidadInput}
                    onChange={(e) => setCantidadInput(Math.max(0.001, Number(e.target.value)))}
                    placeholder="1.00"
                    disabled={isSaving || !selectedInsumoId}
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
                    onChange={(e) => setMermaInput(Math.max(0, Math.min(100, Number(e.target.value))))}
                    placeholder="0 %"
                    disabled={isSaving || !selectedInsumoId}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onClick={handleAgregarInsumo}
                    disabled={isAddDisabled}
                    startIcon={<Icon name="mdi:plus" size={16} />}
                  >
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                    <TableRow>
                      <TableCell isHeader className="px-4 py-3 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Ingrediente</TableCell>
                      <TableCell isHeader className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Cantidad</TableCell>
                      <TableCell isHeader className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Unidad</TableCell>
                      <TableCell isHeader className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Costo Est.</TableCell>
                      <TableCell isHeader className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Subtotal</TableCell>
                      <TableCell isHeader className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">% Merma</TableCell>
                      <TableCell isHeader className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Acciones</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {(!recetaActiva.insumos || recetaActiva.insumos.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={7} className="px-4 py-6 text-center text-xs text-gray-400">
                          No hay ingredientes registrados en esta versión.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recetaActiva.insumos.map((item) => {
                        const isEditingThis = editingItemId === item.id;

                        return (
                          <TableRow key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                            <TableCell className="px-4 py-3 text-start font-semibold text-xs text-gray-900 dark:text-white">
                              {item.nombre_insumo || `Insumo #${item.id_producto_insumo}`}
                            </TableCell>

                            <TableCell className="px-4 py-3 text-center font-bold text-xs text-brand-600 dark:text-brand-400">
                              {isEditingThis ? (
                                <input
                                  type="number"
                                  step={0.001}
                                  min="0.001"
                                  value={editingCantidad}
                                  onChange={(e) => setEditingCantidad(Math.max(0.001, Number(e.target.value)))}
                                  className="w-20 rounded-lg border border-brand-500 bg-white px-2 py-1 text-center text-xs text-gray-900 focus:outline-hidden dark:bg-gray-800 dark:text-white"
                                  autoFocus
                                />
                              ) : (
                                <span>{item.cantidad}</span>
                              )}
                            </TableCell>

                            <TableCell className="px-4 py-3 text-center text-xs text-gray-500">
                              {item.simbolo_unidad || "und"}
                            </TableCell>

                            <TableCell className="px-4 py-3 text-center text-xs">
                              {item.costo_unitario_estimado && Number(item.costo_unitario_estimado) > 0 ? (
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  S/ {Number(item.costo_unitario_estimado).toFixed(2)}
                                </span>
                              ) : (
                                <div className="inline-flex items-center justify-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                  <span>S/ 0.00</span>
                                  <Icon name="mdi:alert-circle-outline" size={15} />
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="px-4 py-3 text-end text-xs font-semibold text-gray-700 dark:text-gray-300">
                              S/ {Number(item.monto_subtotal ?? 0).toFixed(2)}
                            </TableCell>

                            <TableCell className="px-4 py-3 text-center text-xs text-gray-600 dark:text-gray-400">
                              {isEditingThis ? (
                                <input
                                  type="number"
                                  step={0.1}
                                  min="0"
                                  max="100"
                                  value={editingMerma}
                                  onChange={(e) => setEditingMerma(Math.max(0, Math.min(100, Number(e.target.value))))}
                                  className="w-16 rounded-lg border border-brand-500 bg-white px-2 py-1 text-center text-xs text-gray-900 focus:outline-hidden dark:bg-gray-800 dark:text-white"
                                />
                              ) : (
                                <span>{Number(item.porcentaje_merma || 0)}%</span>
                              )}
                            </TableCell>

                            <TableCell className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {isEditingThis ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveCantidadInline(item)}
                                      disabled={isSaving || editingCantidad <= 0}
                                      className="text-success-600 hover:text-success-700 cursor-pointer"
                                      title="Guardar"
                                    >
                                      <Icon name="mdi:check" size={18} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingItemId(null)}
                                      disabled={isSaving}
                                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
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
                                      className="text-gray-400 hover:text-brand-600 cursor-pointer"
                                      title="Editar cantidad"
                                    >
                                      <Icon name="mdi:pencil-outline" size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setItemToDelete({ id: item.id, nombre: item.nombre_insumo || `Insumo #${item.id_producto_insumo}` })}
                                      disabled={isSaving}
                                      className="text-gray-400 hover:text-error-600 cursor-pointer"
                                      title="Eliminar ingrediente"
                                    >
                                      <Icon name="mdi:trash-can-outline" size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </Modal>

      {itemToDelete && (
        <Modal
          isOpen={Boolean(itemToDelete)}
          onClose={() => setItemToDelete(null)}
          className="max-w-[380px] p-5 text-center"
          showCloseButton={false}
        >
          <div className="space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30">
              <Icon name="mdi:alert-circle-outline" size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                ¿Quitar ingrediente?
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Se removerá <strong className="text-gray-700 dark:text-gray-300">{itemToDelete.nombre}</strong> de la receta.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="rounded-xl border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
