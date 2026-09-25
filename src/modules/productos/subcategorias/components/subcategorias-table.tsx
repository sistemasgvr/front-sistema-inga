"use client";

import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import type { SubCategoriaItem } from "../types/subcategorias.types";
import type { User } from "@/modules/users/types/user.types";

type SubCategoriasTableProps = {
  subcategorias: SubCategoriaItem[];
  currentUser?: User | null;
  isLoading: boolean;
  loadingSubCategoriaId?: number | null;
  onEdit: (subcat: SubCategoriaItem) => void;
  onToggleStatus: (subcat: SubCategoriaItem) => void;
  onAddSubCategoriaToCat?: (idCategoria: number) => void;
};

export function SubCategoriasTable({
  subcategorias,
  currentUser,
  isLoading,
  loadingSubCategoriaId,
  onEdit,
  onToggleStatus,
  onAddSubCategoriaToCat,
}: SubCategoriasTableProps) {
  const safeSubCategorias = Array.isArray(subcategorias) ? subcategorias : [];

  const isSuperAdmin = Boolean(
    currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin
  );
  const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];

  const canEditPermission =
    isSuperAdmin ||
    userPermisos.includes(PermisoBanderas.CATEGORIAS_EDITAR) ||
    userPermisos.includes(PermisoBanderas.SUBCATEGORIAS_EDITAR);

  const canActivatePermission =
    isSuperAdmin ||
    userPermisos.includes(PermisoBanderas.CATEGORIAS_ACTIVAR) ||
    userPermisos.includes(PermisoBanderas.SUBCATEGORIAS_ACTIVAR);

  const canDeletePermission =
    isSuperAdmin ||
    userPermisos.includes(PermisoBanderas.CATEGORIAS_ELIMINAR) ||
    userPermisos.includes(PermisoBanderas.SUBCATEGORIAS_ELIMINAR);

  const canCreatePermission =
    isSuperAdmin ||
    userPermisos.includes(PermisoBanderas.CATEGORIAS_CREAR) ||
    userPermisos.includes(PermisoBanderas.SUBCATEGORIAS_CREAR);

  const subcategoriasAgrupadas = safeSubCategorias.reduce<
    Record<string, { idCategoria: number; items: SubCategoriaItem[] }>
  >((acc, subcat) => {
    const nombreCat = subcat.nombre_categoria || "Sin categoría";
    if (!acc[nombreCat]) {
      acc[nombreCat] = {
        idCategoria: subcat.id_categoria,
        items: [],
      };
    }
    acc[nombreCat].items.push(subcat);
    return acc;
  }, {});

  return (
    <div>
      {/* VISTA MÓVIL */}
      <div className="block md:hidden space-y-4">
        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03]">
            Cargando subcategorías...
          </div>
        ) : safeSubCategorias.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03]">
            No se encontraron subcategorías.
          </div>
        ) : (
          Object.entries(subcategoriasAgrupadas).map(([categoria, group]) => (
            <div key={categoria} className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Icon name="mdi:folder-open" className="text-brand-600 dark:text-brand-400" size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    {categoria}
                  </span>
                  <Badge size="sm" color="light">
                    {group.items.length}
                  </Badge>
                </div>

                {canCreatePermission && onAddSubCategoriaToCat && (
                  <button
                    type="button"
                    onClick={() => onAddSubCategoriaToCat(group.idCategoria)}
                    className="flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    <Icon name="mdi:plus" size={14} />
                    Añadir
                  </button>
                )}
              </div>

              <div className="pl-3 border-l-2 border-gray-200 dark:border-gray-800 space-y-2">
                {group.items.map((subcat) => {
                  const isActivo = subcat.estado === 1;
                  const isItemLoading = loadingSubCategoriaId === subcat.id;
                  const canEdit = canEditPermission;
                  const canToggle = isActivo ? canDeletePermission : canActivatePermission;
                  const prodsCount = subcat.total_productos ?? 0;

                  return (
                    <div
                      key={subcat.id}
                      className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs dark:border-white/[0.05] dark:bg-white/[0.03]"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/[0.05]">
                        <div className="flex items-center gap-2">
                          <Badge size="sm" variant="light" color="light">
                            {subcat.codigo}
                          </Badge>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            {subcat.nombre}
                          </h4>
                        </div>
                        <Badge size="sm" color={isActivo ? "success" : "error"}>
                          {isActivo ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-2 text-xs">
                        <span className="text-gray-400 text-[11px]">Posición: <strong>#{subcat.orden}</strong></span>
                        {prodsCount > 0 ? (
                          <Badge size="sm" variant="light" color="info">
                            {prodsCount} prods
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-gray-400">Sin prods</span>
                        )}

                        <div className="flex items-center gap-2">
                          {canEdit && isActivo && (
                            <button
                              type="button"
                              disabled={isItemLoading}
                              onClick={() => onEdit(subcat)}
                              className="text-gray-400 hover:text-brand-600 transition-colors"
                            >
                              <Icon name="mdi:pencil-outline" size={16} />
                            </button>
                          )}
                          {canToggle && (
                            <button
                              type="button"
                              disabled={isItemLoading}
                              onClick={() => onToggleStatus(subcat)}
                              className={isActivo ? "text-gray-400 hover:text-error-600" : "text-success-600"}
                            >
                              <Icon name={isActivo ? "mdi:trash-can-outline" : "mdi:refresh"} size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* VISTA ESCRITORIO */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[850px]">
            <Table>
              <TableHeader className="border-b border-gray-200 bg-gray-100/80 dark:border-gray-800 dark:bg-gray-900">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-200">
                    Código y Subcategoría
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-200">
                    Productos Asignados
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-200">
                    Orden / Prioridad
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-200">
                    Estado
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-200">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                      Cargando subcategorías...
                    </TableCell>
                  </TableRow>
                ) : safeSubCategorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                      No se encontraron subcategorías.
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(subcategoriasAgrupadas).flatMap(([categoria, group]) => [
                    <TableRow key={`cat-header-${categoria}`} className="bg-gray-50/80 dark:bg-gray-800/60 border-y border-gray-200 dark:border-white/[0.05]">
                      <TableCell colSpan={5} className="px-5 py-3 text-start">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-brand-600 dark:text-brand-400 shrink-0">
                              <Icon name="mdi:folder-open-outline" size={18} />
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                              {categoria}
                            </span>
                            <Badge size="sm" color="info" className="font-medium">
                              {group.items.length} {group.items.length === 1 ? "subcategoría" : "subcategorías"}
                            </Badge>
                          </div>

                          {canCreatePermission && onAddSubCategoriaToCat && (
                            <button
                              type="button"
                              onClick={() => onAddSubCategoriaToCat(group.idCategoria)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors cursor-pointer bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 rounded-lg"
                              title={`Agregar subcategoría a ${categoria}`}
                            >
                              <Icon name="mdi:plus-circle-outline" size={16} />
                              <span>Añadir subcategoría</span>
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>,

                    ...group.items.map((subcat) => {
                      const isActivo = subcat.estado === 1;
                      const isItemLoading = loadingSubCategoriaId === subcat.id;
                      const canEdit = canEditPermission;
                      const canToggle = isActivo ? canDeletePermission : canActivatePermission;
                      const prodsCount = subcat.total_productos ?? 0;

                      return (
                        <TableRow
                          key={`subcat-row-${subcat.id}`}
                          className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <TableCell className="px-5 py-3 text-start pl-10">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-300 dark:text-gray-600 font-mono text-xs">└─</span>
                              <Badge size="sm" variant="light" color="light">
                                {subcat.codigo}
                              </Badge>
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {subcat.nombre}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="px-5 py-3 text-center">
                            {prodsCount > 0 ? (
                              <Badge 
                                size="sm" 
                                variant="light" 
                                color="info"
                                startIcon={<Icon name="mdi:package-variant-closed" size={14} />}
                              >
                                {prodsCount} {prodsCount === 1 ? "producto" : "productos"}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Sin productos</span>
                            )}
                          </TableCell>

                          <TableCell className="px-5 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                              Posición #{subcat.orden}
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-3 text-center">
                            <Badge size="sm" color={isActivo ? "success" : "error"}>
                              {isActivo ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>

                          <TableCell className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-3">
                              {canEdit && isActivo && (
                                <button
                                  type="button"
                                  disabled={isItemLoading}
                                  onClick={() => onEdit(subcat)}
                                  className="text-gray-500 hover:text-brand-600 disabled:opacity-30 cursor-pointer transition-colors"
                                  title="Editar subcategoría"
                                >
                                  <Icon name="mdi:pencil-outline" size={18} />
                                </button>
                              )}

                              {canToggle && (
                                <button
                                  type="button"
                                  disabled={isItemLoading}
                                  onClick={() => onToggleStatus(subcat)}
                                  className={`disabled:opacity-30 cursor-pointer transition-colors ${
                                    isActivo ? "text-gray-500 hover:text-error-600" : "text-success-600 hover:text-success-700"
                                  }`}
                                  title={isActivo ? "Desactivar" : "Activar"}
                                >
                                  <Icon name={isActivo ? "mdi:trash-can-outline" : "mdi:refresh"} size={18} />
                                </button>
                              )}

                              {!canEdit && !canToggle && (
                                <span className="text-xs italic text-gray-400">Protegido</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }),
                  ])
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}