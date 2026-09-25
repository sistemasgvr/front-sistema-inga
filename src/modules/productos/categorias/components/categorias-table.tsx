"use client";

import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import type { CategoriaItem } from "../types/categorias.types";
import type { User } from "@/modules/users/types/user.types";

type CategoriasTableProps = {
  categorias: CategoriaItem[];
  currentUser?: User | null;
  isLoading: boolean;
  loadingCategoriaId?: number | null;
  onEdit: (cat: CategoriaItem) => void;
  onToggleStatus: (cat: CategoriaItem) => void;
  onViewSubCategorias?: (cat: CategoriaItem) => void;
};

export function CategoriasTable({
  categorias,
  currentUser,
  isLoading,
  loadingCategoriaId,
  onEdit,
  onToggleStatus,
  onViewSubCategorias,
}: CategoriasTableProps) {
  const safeCategorias = Array.isArray(categorias) ? categorias : [];

  const isSuperAdmin = Boolean(
    currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin
  );
  const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];

  const canViewSubCategories = 
    isSuperAdmin ||
    userPermisos.includes(PermisoBanderas.SUBCATEGORIAS_LISTAR) ||
    userPermisos.includes(PermisoBanderas.CATEGORIAS_LISTAR);

  const canEditPermission =
    isSuperAdmin ||
    userPermisos.includes(PermisoBanderas.CATEGORIAS_EDITAR);

  const canActivatePermission =
    isSuperAdmin ||
    userPermisos.includes(PermisoBanderas.CATEGORIAS_ACTIVAR);

  const canDeletePermission =
    isSuperAdmin ||
    userPermisos.includes(PermisoBanderas.CATEGORIAS_ELIMINAR);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
        Cargando categorías...
      </div>
    );
  }

  if (safeCategorias.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
        No se encontraron categorías.
      </div>
    );
  }

  return (
    <>
      {/* VISTA MÓVIL (Cards) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {safeCategorias.map((cat) => {
          const isActivo = cat.estado === 1;
          const isItemLoading = loadingCategoriaId === cat.id;
          const canEdit = canEditPermission || isSuperAdmin;
          const canToggle = (isActivo ? canDeletePermission : canActivatePermission) || isSuperAdmin;
          const subCount = cat.total_subcategorias ?? 0;

          return (
            <div
              key={cat.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-white/[0.05] dark:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge size="sm" variant="light" color="light" className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-400">
                    {cat.codigo}
                  </Badge>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {cat.nombre}
                  </span>
                </div>
                <Badge size="sm" color={isActivo ? "success" : "error"}>
                  {isActivo ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              {cat.descripcion && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                  {cat.descripcion}
                </p>
              )}

              <div className="flex items-center gap-2 my-2.5">
                {subCount > 0 ? (
                  <Badge size="sm" variant="light" color="info" className="font-medium">
                    <Icon name="mdi:folder-outline" size={14} className="mr-1" />
                    {subCount} {subCount === 1 ? "subcat" : "subcats"}
                  </Badge>
                ) : (
                  <span className="text-xs text-gray-400 italic">Sin subcats</span>
                )}

                <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                  Pos. #{cat.orden}
                </span>

                <Badge size="sm" color={cat.es_carta ? "success" : "light"}>
                  {cat.es_carta ? "Carta" : "No Carta"}
                </Badge>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2.5 border-t border-gray-100 dark:border-white/[0.05]">
                {onViewSubCategorias && canViewSubCategories && (
                  <button
                    type="button"
                    disabled={isItemLoading}
                    onClick={() => onViewSubCategorias(cat)}
                    className="text-gray-500 hover:text-brand-600 transition-colors cursor-pointer disabled:opacity-30"
                    title="Ver subcategorías de esta categoría"
                  >
                    <Icon name="mdi:eye-outline" size={18} />
                  </button>
                )}

                {canEdit && isActivo && (
                  <button
                    type="button"
                    disabled={isItemLoading}
                    onClick={() => onEdit(cat)}
                    className="text-gray-500 hover:text-brand-600 disabled:opacity-30 transition-colors cursor-pointer"
                    title="Editar categoría"
                  >
                    <Icon name="mdi:pencil-outline" size={18} />
                  </button>
                )}

                {canToggle && (
                  <button
                    type="button"
                    disabled={isItemLoading}
                    onClick={() => onToggleStatus(cat)}
                    className={`disabled:opacity-30 transition-colors cursor-pointer ${
                      isActivo ? "text-gray-500 hover:text-error-600" : "text-success-600 hover:text-success-700"
                    }`}
                    title={isActivo ? "Desactivar" : "Activar"}
                  >
                    <Icon name={isActivo ? "mdi:trash-can-outline" : "mdi:refresh"} size={18} />
                  </button>
                )}

                {!canEdit && !canToggle && !isSuperAdmin && (
                  <span className="text-xs italic text-gray-400">Protegido</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* VISTA ESCRITORIO (Tabla) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[950px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                    Código y Categoría
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                    Subcategorías
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                    Orden / Prioridad
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                    Carta
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                    Estado
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {safeCategorias.map((cat) => {
                  const isActivo = cat.estado === 1;
                  const isItemLoading = loadingCategoriaId === cat.id;
                  const canEdit = canEditPermission || isSuperAdmin;
                  const canToggle = (isActivo ? canDeletePermission : canActivatePermission) || isSuperAdmin;
                  const subCount = cat.total_subcategorias ?? 0;

                  return (
                    <TableRow key={cat.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-2.5">
                          <Badge size="sm" variant="light" color="light" className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-400">
                            {cat.codigo}
                          </Badge>
                          <div>
                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                              {cat.nombre}
                            </span>
                            {cat.descripcion && (
                              <span className="block text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-0.5">
                                {cat.descripcion}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        {subCount > 0 ? (
                          <Badge size="sm" variant="light" color="info" className="font-medium">
                            <Icon name="mdi:folder-outline" size={14} className="mr-1" />
                            {subCount} {subCount === 1 ? "subcat" : "subcats"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sin subcategorías</span>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">
                          Posición #{cat.orden}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={cat.es_carta ? "success" : "light"}>
                          {cat.es_carta ? "En Carta" : "No"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={isActivo ? "success" : "error"}>
                          {isActivo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {onViewSubCategorias && canViewSubCategories && (
                            <button
                              type="button"
                              disabled={isItemLoading}
                              onClick={() => onViewSubCategorias(cat)}
                              className="text-gray-500 hover:text-brand-600 transition-colors cursor-pointer disabled:opacity-30"
                              title="Ver subcategorías de esta categoría"
                            >
                              <Icon name="mdi:eye-outline" size={18} />
                            </button>
                          )}

                          {canEdit && isActivo && (
                            <button
                              type="button"
                              disabled={isItemLoading}
                              onClick={() => onEdit(cat)}
                              className="text-gray-500 hover:text-brand-600 disabled:opacity-30 transition-colors cursor-pointer"
                              title="Editar categoría"
                            >
                              <Icon name="mdi:pencil-outline" size={18} />
                            </button>
                          )}

                          {canToggle && (
                            <button
                              type="button"
                              disabled={isItemLoading}
                              onClick={() => onToggleStatus(cat)}
                              className={`disabled:opacity-30 transition-colors cursor-pointer ${
                                isActivo ? "text-gray-500 hover:text-error-600" : "text-success-600 hover:text-success-700"
                              }`}
                              title={isActivo ? "Desactivar" : "Activar"}
                            >
                              <Icon name={isActivo ? "mdi:trash-can-outline" : "mdi:refresh"} size={18} />
                            </button>
                          )}

                          {!canEdit && !canToggle && !isSuperAdmin && (
                            <span className="text-xs italic text-gray-400">Protegido</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}