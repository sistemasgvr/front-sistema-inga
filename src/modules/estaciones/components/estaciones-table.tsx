"use client";

import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import type { EstacionItem } from "../types/estaciones.types";
import type { User } from "@/modules/users/types/user.types";

type EstacionesTableProps = {
  estaciones: EstacionItem[];
  currentUser?: User | null;
  isLoading: boolean;
  loadingEstacionId?: number | null;
  onEdit: (item: EstacionItem) => void;
  onToggleStatus: (item: EstacionItem) => void;
};

export function EstacionesTable({
  estaciones,
  currentUser,
  isLoading,
  loadingEstacionId,
  onEdit,
  onToggleStatus,
}: EstacionesTableProps) {
  const safeEstaciones = Array.isArray(estaciones) ? estaciones : [];

  const isSuperAdmin = Boolean(
    currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin
  );
  const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];

  const canEditPermission =
    isSuperAdmin || userPermisos.includes(PermisoBanderas.ESTACIONES_EDITAR);

  const canActivatePermission =
    isSuperAdmin || userPermisos.includes(PermisoBanderas.ESTACIONES_ACTIVAR);

  const canDeletePermission =
    isSuperAdmin || userPermisos.includes(PermisoBanderas.ESTACIONES_ELIMINAR);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
        Cargando estaciones...
      </div>
    );
  }

  if (safeEstaciones.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
        No se encontraron estaciones.
      </div>
    );
  }

  return (
    <>
      {/* VISTA MÓVIL (Cards) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {safeEstaciones.map((item) => {
          const isActivo = item.estado === 1;
          const isItemLoading = loadingEstacionId === item.id;
          const canEdit = canEditPermission || isSuperAdmin;
          const canToggle = (isActivo ? canDeletePermission : canActivatePermission) || isSuperAdmin;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-white/[0.05] dark:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge size="sm" variant="light" color="light" className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-400">
                    {item.codigo}
                  </Badge>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.nombre}
                  </span>
                </div>
                <Badge size="sm" color={isActivo ? "success" : "error"}>
                  {isActivo ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className="space-y-1 my-2.5">
                <p className="text-xs text-gray-800 dark:text-gray-200">
                  <span className="font-semibold">Impresora:</span> {item.impresora_nombre || "Sin impresora"}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  <span className="font-semibold font-sans">IP:</span> {item.impresora_ip || "IP no asignada"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 my-2.5">
                <Badge size="sm" color={item.usa_kds ? "success" : "light"}>
                  KDS: {item.usa_kds ? "Sí" : "No"}
                </Badge>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2.5 border-t border-gray-100 dark:border-white/[0.05]">
                {canEdit && isActivo && (
                  <button
                    type="button"
                    disabled={isItemLoading}
                    onClick={() => onEdit(item)}
                    className="text-gray-500 hover:text-brand-600 disabled:opacity-30 transition-colors cursor-pointer"
                    title="Editar estación"
                  >
                    <Icon name="mdi:pencil-outline" size={18} />
                  </button>
                )}

                {canToggle && (
                  <button
                    type="button"
                    disabled={isItemLoading}
                    onClick={() => onToggleStatus(item)}
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
                    Código y Nombre
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                    Impresora / IP
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                    KDS
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
                {safeEstaciones.map((item) => {
                  const isActivo = item.estado === 1;
                  const isItemLoading = loadingEstacionId === item.id;
                  const canEdit = canEditPermission || isSuperAdmin;
                  const canToggle = (isActivo ? canDeletePermission : canActivatePermission) || isSuperAdmin;

                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-2.5">
                          <Badge size="sm" variant="light" color="light" className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-400">
                            {item.codigo}
                          </Badge>
                          <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                            {item.nombre}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-sm text-gray-800 dark:text-gray-200">
                          {item.impresora_nombre || "Sin impresora"}
                        </span>
                        <span className="block text-xs text-gray-500 font-mono mt-0.5">
                          {item.impresora_ip || "IP no asignada"}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={item.usa_kds ? "success" : "light"}>
                          {item.usa_kds ? "Sí" : "No"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={isActivo ? "success" : "error"}>
                          {isActivo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {canEdit && isActivo && (
                            <button
                              type="button"
                              disabled={isItemLoading}
                              onClick={() => onEdit(item)}
                              className="text-gray-500 hover:text-brand-600 disabled:opacity-30 transition-colors cursor-pointer"
                              title="Editar estación"
                            >
                              <Icon name="mdi:pencil-outline" size={18} />
                            </button>
                          )}

                          {canToggle && (
                            <button
                              type="button"
                              disabled={isItemLoading}
                              onClick={() => onToggleStatus(item)}
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