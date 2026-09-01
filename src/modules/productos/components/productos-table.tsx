"use client";

import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import type { ProductoItem } from "../types/productos.types";

type ProductosTableProps = {
  productos: ProductoItem[];
  isLoading: boolean;
  onEdit: (prod: ProductoItem) => void;
  onToggleDisponibilidad: (id: number) => void;
  onToggleStatus: (prod: ProductoItem) => void;
  onManageReceta: (prod: ProductoItem) => void;
};

const TIPO_PRODUCTO_MAP: Record<number, { label: string; color: string }> = {
  1: { label: "Insumo Crudo", color: "warning" },
  2: { label: "Insumo Procesado", color: "info" },
  3: { label: "Plato Carta", color: "success" },
  4: { label: "Plato Menú", color: "success" },
  5: { label: "Trago", color: "primary" },
  6: { label: "Bebida U.", color: "primary" },
  7: { label: "Adicional", color: "light" },
};

export function ProductosTable({
  productos,
  isLoading,
  onEdit,
  onToggleDisponibilidad,
  onToggleStatus,
  onManageReceta,
}: ProductosTableProps) {
  const safeProductos = Array.isArray(productos) ? productos : [];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Código / Nombre</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Subcategoría</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Tipo</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Precio Venta</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Disponible</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Estado</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">Cargando productos...</TableCell>
                </TableRow>
              ) : safeProductos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">No se encontraron productos.</TableCell>
                </TableRow>
              ) : (
                safeProductos.map((prod) => {
                  const isActivo = prod.estado === 1;
                  const tipoInfo = TIPO_PRODUCTO_MAP[prod.tipo_producto] || { label: "General", color: "light" };
                  const aceptaReceta = [3, 4, 5].includes(prod.tipo_producto);

                  return (
                    <TableRow key={prod.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-xs font-bold text-brand-600 dark:text-brand-400">{prod.codigo_interno}</span>
                        <span className="block text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{prod.nombre}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{prod.nombre_subcategoria || "Sin subcategoría"}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={tipoInfo.color as any}>{tipoInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-end">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">S/ {Number(prod.precio_venta).toFixed(2)}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleDisponibilidad(prod.id)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                            prod.disponible_venta
                              ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                              : "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
                          }`}
                          title="Cambiar disponibilidad en carta"
                        >
                          <Icon name={prod.disponible_venta ? "mdi:check" : "mdi:close"} size={14} />
                          {prod.disponible_venta ? "En Carta" : "Agotado"}
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
                              className="text-gray-500 hover:text-brand-600 transition-colors"
                              title="Gestionar Receta"
                            >
                              <Icon name="mdi:receipt-text-outline" size={19} />
                            </button>
                          )}
                          {isActivo && (
                            <button
                              type="button"
                              onClick={() => onEdit(prod)}
                              className="text-gray-500 hover:text-brand-600 transition-colors"
                              title="Editar producto"
                            >
                              <Icon name="mdi:pencil-outline" size={19} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleStatus(prod)}
                            className={isActivo ? "text-gray-500 hover:text-error-600" : "text-success-600 hover:text-success-700"}
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
  );
}