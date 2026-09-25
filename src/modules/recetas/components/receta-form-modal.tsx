"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Combobox } from "@/components/form/Combobox";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import { useRecetas } from "../hooks/use-recetas";
import { Icon } from "@/components/ui/icon";
import { useEffect, useState } from "react";
import type { ProductoItem, UnidadMedidaItem } from "@/modules/productos/types/productos.types";

type RecetaFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoItem | null;
  unidades: UnidadMedidaItem[];
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
  } = useRecetas(producto);

  const [selectedInsumoId, setSelectedInsumoId] = useState<number | null>(null);
  const [cantidadInput, setCantidadInput] = useState<number>(1);
  const [mermaInput, setMermaInput] = useState<number>(0);
  const [unidadInputId, setUnidadInputId] = useState<number>(0);
  const [unidadSimbolo, setUnidadSimbolo] = useState<string>("");

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingCantidad, setEditingCantidad] = useState<number>(0);
  const [editingMerma, setEditingMerma] = useState<number>(0);

  useEffect(() => {
    if (isOpen && producto) {
      void cargarRecetaProducto();
      void buscarInsumos("");
    }
  }, [isOpen, producto, cargarRecetaProducto]);

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

  const ingredientesExistentesIds = new Set(
    recetaActiva?.insumos?.map((i) => i.id_producto_insumo) || []
  );

  const insumosDisponibles = insumosBusqueda.filter(
    (i) => !ingredientesExistentesIds.has(i.id)
  );

  const comboboxOptions = insumosDisponibles.map((i) => ({
    value: String(i.id),
    label: i.nombre,
    sublabel: `Código: ${i.codigo_interno || "N/A"} | Unidad: ${i.simbolo_unidad || "und"}`,
  }));

  const isAddDisabled = isSaving || !selectedInsumoId || cantidadInput <= 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      className="max-w-[850px] p-6 sm:p-8"
      showCloseButton={true}
    >
      {/* Cabecera del Constructor */}
      <div className="pb-4 border-b border-gray-100 dark:border-gray-800 pr-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Constructor de Receta: {producto?.nombre ?? ""}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Define las porciones de insumos procesados necesarias para este plato/trago.
        </p>
      </div>

      {/* Contenido principal */}
      <div className="pt-5">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Cargando receta...</div>
        ) : !recetaActiva ? (
          <div className="p-8 text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Este plato no tiene una receta activa configurada.
            </p>
            <button
              type="button"
              onClick={handleInicializar}
              disabled={isSaving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors cursor-pointer"
            >
              Inicializar Receta Versión 1
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase block">Versión Activa</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  v{recetaActiva.version} — {recetaActiva.nombre || "Receta Estándar"}
                </span>
              </div>
              <Badge color="success">Vigente</Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end bg-gray-50/50 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900/30">
              <div className="sm:col-span-5">
                <Label>Insumo Procesado</Label>
                <Combobox
                  options={comboboxOptions}
                  placeholder={
                    comboboxOptions.length === 0 && insumosBusqueda.length > 0
                      ? "Sin insumos disponibles"
                      : "Seleccione ingrediente..."
                  }
                  searchPlaceholder="Buscar ingrediente..."
                  onChange={handleSelectInsumo}
                  onSearchChange={(term) => void buscarInsumos(term)}
                  defaultValue={selectedInsumoId ? String(selectedInsumoId) : ""}
                  isLoading={isSearchingInsumos}
                  disabled={isSaving || comboboxOptions.length === 0}
                />
              </div>

              <div className="sm:col-span-3">
                <Label>Cantidad {unidadSimbolo ? `(${unidadSimbolo})` : ""}</Label>
                <Input
                  type="number"
                  step={0.001}
                  min="0.001"
                  value={cantidadInput}
                  onChange={(e) => setCantidadInput(Number(e.target.value))}
                  placeholder="Ej. 0.250"
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
                  onChange={(e) => setMermaInput(Number(e.target.value))}
                  placeholder="0 %"
                  disabled={isSaving || !selectedInsumoId}
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAgregarInsumo}
                  disabled={isAddDisabled}
                  className="w-full flex h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Icon name="mdi:plus" size={18} />
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="p-3">Ingrediente</th>
                    <th className="p-3 text-center">Cantidad</th>
                    <th className="p-3 text-center">Unidad</th>
                    <th className="p-3 text-center">% Merma</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(!recetaActiva.insumos || recetaActiva.insumos.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-400">
                        No hay ingredientes registrados en esta receta.
                      </td>
                    </tr>
                  ) : (
                    recetaActiva.insumos.map((item) => {
                      const isEditingThis = editingItemId === item.id;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="p-3 font-semibold text-gray-900 dark:text-white">
                            {item.nombre_insumo || `Insumo #${item.id_producto_insumo}`}
                          </td>

                          <td className="p-3 text-center font-bold text-brand-600 dark:text-brand-400">
                            {isEditingThis ? (
                              <input
                                type="number"
                                step={0.001}
                                min="0.001"
                                value={editingCantidad}
                                onChange={(e) => setEditingCantidad(Number(e.target.value))}
                                className="w-20 rounded-lg border border-brand-500 bg-white px-2 py-1 text-center text-xs text-gray-900 shadow-xs focus:outline-hidden dark:bg-gray-800 dark:text-white"
                                autoFocus
                              />
                            ) : (
                              <span>{item.cantidad}</span>
                            )}
                          </td>

                          <td className="p-3 text-center text-gray-500">
                            {item.simbolo_unidad || "und"}
                          </td>

                          <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                            {isEditingThis ? (
                              <input
                                type="number"
                                step={0.1}
                                min="0"
                                max="100"
                                value={editingMerma}
                                onChange={(e) => setEditingMerma(Number(e.target.value))}
                                className="w-16 rounded-lg border border-brand-500 bg-white px-2 py-1 text-center text-xs text-gray-900 shadow-xs focus:outline-hidden dark:bg-gray-800 dark:text-white"
                              />
                            ) : (
                              <span>{Number(item.porcentaje_merma || 0)}%</span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isEditingThis ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveCantidadInline(item)}
                                    disabled={isSaving || editingCantidad <= 0}
                                    className="text-success-600 hover:text-success-700 transition-colors cursor-pointer"
                                    title="Guardar cambio"
                                  >
                                    <Icon name="mdi:check" size={18} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingItemId(null)}
                                    disabled={isSaving}
                                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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
                                    className="text-gray-400 hover:text-brand-600 transition-colors cursor-pointer"
                                    title="Editar cantidad y merma"
                                  >
                                    <Icon name="mdi:pencil-outline" size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => quitarInsumoDeReceta(item.id)}
                                    disabled={isSaving}
                                    className="text-gray-400 hover:text-error-600 transition-colors cursor-pointer"
                                    title="Eliminar ingrediente"
                                  >
                                    <Icon name="mdi:trash-can-outline" size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}