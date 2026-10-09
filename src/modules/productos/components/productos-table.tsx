"use client";

import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { useState } from "react";
import type { ProductoItem } from "../types/productos.types";

type ProductosTableProps = {
  productos: ProductoItem[];
  isLoading: boolean;
  /** Id del producto cuyas acciones están en curso, si hay alguna. */
  loadingProductoId: number | null;
  onEdit: (prod: ProductoItem) => void;
  onToggleDisponibilidad: (id: number) => void;
  onToggleStatus: (prod: ProductoItem) => void;
  onManageReceta: (prod: ProductoItem) => void;
};


export function ProductosTable({
  productos,
  isLoading,
  loadingProductoId,
  onEdit,
  onToggleDisponibilidad,
  onToggleStatus,
  onManageReceta,
}: ProductosTableProps) {
  const safeProductos = Array.isArray(productos) ? productos : [];
  const [selectedImage, setSelectedImage] = useState<{ url: string; nombre: string } | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1050px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Ítem / Código</TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Subcategoría</TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Tipo</TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Costo</TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Precio Venta</TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Disponible</TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Estado</TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="px-5 py-8 text-center text-sm text-gray-500">Cargando productos...</TableCell>
                  </TableRow>
                ) : safeProductos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="px-5 py-8 text-center text-sm text-gray-500">No se encontraron productos.</TableCell>
                  </TableRow>
                ) : (
                  safeProductos.map((prod) => {
                    const isActivo = prod.estado === 1;
                    const tipoInfo = { label: prod.nombre_tipo_producto || "Sin tipo", color: "light" };
                    const aceptaReceta = Boolean(prod.requiere_receta);
                    const costo = aceptaReceta
                      ? prod.costo_receta_calculado
                      : prod.costo_unitario;

                    return (
                      <TableRow key={prod.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <TableCell className="px-5 py-3.5 text-start">
                          <div className="flex items-center gap-3">
                            {prod.imagen_url ? (
                              <button
                                type="button"
                                onClick={() => setSelectedImage({ url: prod.imagen_url!, nombre: prod.nombre })}
                                className="relative group shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                                title="Hacer clic para ampliar"
                              >
                                <img
                                  src={prod.imagen_url}
                                  alt={prod.nombre}
                                  className="h-10 w-10 object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Icon name="mdi:magnify-plus-outline" size={14} />
                                </div>
                              </button>
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                                <Icon name="mdi:image-off-outline" size={20} />
                              </div>
                            )}
                            <div>
                              <span className="block text-xs font-bold text-brand-600 dark:text-brand-400">{prod.codigo_interno}</span>
                              <span className="block text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{prod.nombre}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{prod.nombre_subcategoria || "Sin subcategoría"}</span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <Badge size="sm" color={tipoInfo.color as any}>{tipoInfo.label}</Badge>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-end">
                          {costo != null ? (
                            <span
                              className="text-sm font-semibold text-amber-600 dark:text-amber-400"
                              title={aceptaReceta ? "Costo de receta" : "Costo unitario"}
                            >
                              S/ {Number(costo).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-end">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">S/ {Number(prod.precio_venta).toFixed(2)}</span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <button
                            type="button"
                            disabled={!prod.permite_venta}
                            onClick={() => onToggleDisponibilidad(prod.id)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                              prod.disponible_venta
                                ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                                : "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
                            }`}
                            title="Cambiar disponibilidad en carta"
                          >
                            <Icon name={prod.disponible_venta ? "mdi:check" : "mdi:close"} size={14} />
                            {!prod.permite_venta ? "No aplica" : prod.disponible_venta ? "En Carta" : "Agotado"}
                          </button>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <Badge size="sm" color={isActivo ? "success" : "error"}>{isActivo ? "Activo" : "Inactivo"}</Badge>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            {isActivo && aceptaReceta && (
                              <button
                                type="button"
                                onClick={() => onManageReceta(prod)}
                                className="text-gray-500 hover:text-brand-600 transition-colors cursor-pointer"
                                title="Gestionar Receta"
                              >
                                <Icon name="mdi:receipt-text-outline" size={19} />
                              </button>
                            )}
                            {isActivo && (
                              <button
                                type="button"
                                onClick={() => onEdit(prod)}
                                disabled={loadingProductoId !== null}
                                className="text-gray-500 hover:text-brand-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                  loadingProductoId === prod.id
                                    ? "Cargando producto..."
                                    : "Editar producto"
                                }
                              >
                                <Icon
                                  name={
                                    loadingProductoId === prod.id
                                      ? "mdi:loading"
                                      : "mdi:pencil-outline"
                                  }
                                  size={19}
                                />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onToggleStatus(prod)}
                              className={isActivo ? "text-gray-500 hover:text-error-600 cursor-pointer" : "text-success-600 hover:text-success-700 cursor-pointer"}
                              title={isActivo ? "Dar de baja" : "Activar"}
                            >
                              <Icon name={isActivo ? "mdi:trash-can-outline" : "mdi:refresh"} size={19} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {selectedImage && (
        <Modal
          isOpen={Boolean(selectedImage)}
          onClose={() => setSelectedImage(null)}
          className="max-w-[500px] p-4 text-center"
          showCloseButton={false}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
              <h4 className="col-start-2 break-words text-sm font-bold text-gray-900 dark:text-white">
                {selectedImage.nombre}
              </h4>
              <button type="button" aria-label="Cerrar imagen" onClick={() => setSelectedImage(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
                <Icon name="mdi:close" size={24} />
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-black/5 dark:bg-black/40 p-1">
              <img
                src={selectedImage.url}
                alt={selectedImage.nombre}
                className="max-h-[380px] w-full object-contain rounded-lg mx-auto"
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
