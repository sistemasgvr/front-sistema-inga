"use client";

import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import type { SubCategoriaItem } from "../types/subcategorias.types";

type SubCategoriasTableProps = {
  subcategorias: SubCategoriaItem[];
  isLoading: boolean;
  onEdit: (subcat: SubCategoriaItem) => void;
  onToggleStatus: (subcat: SubCategoriaItem) => void;
};

export function SubCategoriasTable({
  subcategorias,
  isLoading,
  onEdit,
  onToggleStatus,
}: SubCategoriasTableProps) {
  const safeSubCategorias = Array.isArray(subcategorias) ? subcategorias : [];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Código / Nombre</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Categoría Padre</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Orden</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Estado</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">Cargando subcategorías...</TableCell>
                </TableRow>
              ) : safeSubCategorias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">No se encontraron subcategorías.</TableCell>
                </TableRow>
              ) : (
                safeSubCategorias.map((subcat) => {
                  const isActivo = subcat.estado === 1;

                  return (
                    <TableRow key={subcat.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-xs font-bold text-brand-600 dark:text-brand-400">{subcat.codigo}</span>
                        <span className="block text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{subcat.nombre}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{subcat.nombre_categoria || "Sin categoría"}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{subcat.orden}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={isActivo ? "success" : "error"}>{isActivo ? "Activo" : "Inactivo"}</Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          {isActivo && (
                            <button
                              type="button"
                              onClick={() => onEdit(subcat)}
                              className="text-gray-500 hover:text-brand-600 transition-colors"
                              title="Editar subcategoría"
                            >
                              <Icon name="mdi:pencil-outline" size={19} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleStatus(subcat)}
                            className={isActivo ? "text-gray-500 hover:text-error-600" : "text-success-600 hover:text-success-700"}
                            title={isActivo ? "Desactivar" : "Activar"}
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