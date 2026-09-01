"use client";

import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import type { Sucursal } from "../types/sucursal.types";
import type { User } from "@/modules/users/types/user.types";

type SucursalesTableProps = {
  sucursales: Sucursal[];
  currentUser?: User | null;
  isLoading: boolean;
  onEdit: (sucursal: Sucursal) => void;
  onToggleStatus: (sucursal: Sucursal) => void;
};

export function SucursalesTable({
  sucursales,
  currentUser,
  isLoading,
  onEdit,
  onToggleStatus,
}: SucursalesTableProps) {
  const safeSucursales = Array.isArray(sucursales) ? sucursales : [];

  const isSuperAdmin = Boolean(currentUser?.es_super_admin);
  const userPermisos = currentUser?.permisos ?? [];

  const canEditPermission = isSuperAdmin || userPermisos.includes("SUCURSALES_EDITAR");
  const canTogglePermission =
    isSuperAdmin ||
    userPermisos.includes("SUCURSALES_ACTIVAR") ||
    userPermisos.includes("SUCURSALES_ELIMINAR");

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                  Código / Sede
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                  Dirección
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                  Teléfono
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                    Cargando sucursales...
                  </TableCell>
                </TableRow>
              ) : safeSucursales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                    No hay sucursales registradas.
                  </TableCell>
                </TableRow>
              ) : (
                safeSucursales.map((sucursal) => {
                  const isActivo = sucursal.estado === 1;

                  return (
                    <TableRow key={sucursal.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {sucursal.nombre}
                          </span>
                          {sucursal.esPrincipal && (
                            <Badge size="sm" color="warning">
                              Principal
                            </Badge>
                          )}
                        </div>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {sucursal.codigo}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-gray-200">
                        {sucursal.direccion || "—"}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center text-sm text-gray-800 dark:text-gray-200">
                        {sucursal.telefono || "—"}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={isActivo ? "success" : "error"}>
                          {isActivo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {canEditPermission && isActivo && (
                            <button
                              type="button"
                              onClick={() => onEdit(sucursal)}
                              className="text-gray-500 hover:text-brand-600 transition-colors"
                              title="Editar sucursal"
                            >
                              <Icon name="mdi:pencil-outline" size={19} />
                            </button>
                          )}

                          {canTogglePermission && (
                            isActivo ? (
                              <button
                                type="button"
                                onClick={() => onToggleStatus(sucursal)}
                                className="text-gray-500 hover:text-error-600 transition-colors"
                                title="Desactivar sucursal"
                              >
                                <Icon name="mdi:trash-can-outline" size={19} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onToggleStatus(sucursal)}
                                className="text-success-600 hover:text-success-700 transition-colors"
                                title="Reactivar sucursal"
                              >
                                <Icon name="mdi:refresh" size={19} />
                              </button>
                            )
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
      </div>
    </div>
  );
}