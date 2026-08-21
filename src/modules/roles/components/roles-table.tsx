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
import type { RoleItem } from "../types/roles.types";

type RolesTableProps = {
  roles: RoleItem[];
  currentUser?: any | null; 
  totalPermisosSistema: number;
  isLoading: boolean;
  onEdit: (role: RoleItem) => void;
  onPermissions: (role: RoleItem) => void;
  onToggleStatus: (role: RoleItem) => void;
};

export function RolesTable({
  roles,
  currentUser,
  totalPermisosSistema,
  isLoading,
  onEdit,
  onPermissions,
  onToggleStatus,
}: RolesTableProps) {
  const safeRoles = Array.isArray(roles) ? roles : [];

  const isSuperAdmin = Boolean(
    currentUser?.es_super_admin || 
    currentUser?.esSuperAdmin || 
    currentUser?.sesion?.es_super_admin
  );
  
  const userPermisos = currentUser?.permisos ?? [];

  const canEdit = isSuperAdmin || userPermisos.includes("roles.editar");
  const canDelete = isSuperAdmin || userPermisos.includes("roles.eliminar");
  const canActivate = isSuperAdmin || userPermisos.includes("roles.activar");

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[850px]">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                  Código
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                  Nombre y Descripción
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                  Usuarios
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                  Permisos
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
                  <TableCell colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">
                    Cargando roles...
                  </TableCell>
                </TableRow>
              ) : safeRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">
                    No hay roles registrados.
                  </TableCell>
                </TableRow>
              ) : (
                safeRoles.map((role) => {
                  const isActivo = role.estado === 1;
                  const totalPermisos = role.total_permisos ?? 0;
                  const totalUsuarios = role.total_usuarios ?? 0;

                  return (
                    <TableRow key={role.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <TableCell className="px-5 py-4 text-start">
                        <Badge size="sm" color="primary" variant="light">
                          {role.codigo}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">
                          {role.nombre}
                        </span>
                        {role.descripcion ? (
                          <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                            {role.descripcion}
                          </span>
                        ) : null}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <Icon name="mdi:account-outline" size={15} className="text-gray-400" />
                          {totalUsuarios === 1 ? "1 usuario" : `${totalUsuarios}`}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                          {totalPermisos} / {totalPermisosSistema}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={isActivo ? "success" : "error"}>
                          {isActivo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {isActivo ? (
                            <>
                              {canEdit && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onPermissions(role)}
                                    className="text-gray-500 hover:text-brand-600 transition-colors"
                                    title="Gestionar permisos"
                                  >
                                    <Icon name="mdi:shield-lock-outline" size={19} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onEdit(role)}
                                    className="text-gray-500 hover:text-brand-600 transition-colors"
                                    title="Editar rol"
                                  >
                                    <Icon name="mdi:pencil-outline" size={19} />
                                  </button>
                                </>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => onToggleStatus(role)}
                                  className="text-gray-500 hover:text-error-600 transition-colors"
                                  title="Desactivar rol"
                                >
                                  <Icon name="mdi:trash-can-outline" size={19} />
                                </button>
                              )}
                            </>
                          ) : (
                            canActivate && (
                              <button
                                type="button"
                                onClick={() => onToggleStatus(role)}
                                className="text-success-600 hover:text-success-700 transition-colors"
                                title="Reactivar rol"
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