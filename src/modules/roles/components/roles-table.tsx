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
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import type { RoleItem } from "../types/roles.types";

type RolesTableProps = {
  roles: RoleItem[];
  currentUser?: any | null; 
  totalPermisosSistema: number;
  isLoading: boolean;
  loadingRoleId?: number | null;
  onEdit: (role: RoleItem) => void;
  onPermissions: (role: RoleItem) => void;
  onToggleStatus: (role: RoleItem) => void;
};

export function RolesTable({
  roles,
  currentUser,
  totalPermisosSistema,
  isLoading,
  loadingRoleId,
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
  
  const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];

  const canEdit = isSuperAdmin || userPermisos.includes(PermisoBanderas.ROLES_EDITAR);
  const canDelete = isSuperAdmin || userPermisos.includes(PermisoBanderas.ROLES_ELIMINAR);
  const canActivate = isSuperAdmin || userPermisos.includes(PermisoBanderas.ROLES_ACTIVAR);

  return (
    <div>
      {/* VISTA MÓVIL (TARJETAS) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03]">
            Cargando roles...
          </div>
        ) : safeRoles.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03]">
            No hay roles registrados.
          </div>
        ) : (
          safeRoles.map((role) => {
            const isActivo = role.estado === 1;
            const totalPermisos = role.total_permisos ?? 0;
            const totalUsuarios = role.total_usuarios ?? 0;
            const isItemLoading = loadingRoleId === role.id;

            return (
              <div
                key={role.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-white/[0.05] dark:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <Badge size="sm" color="primary" variant="light">
                      {role.codigo}
                    </Badge>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {role.nombre}
                    </h4>
                  </div>
                  <Badge size="sm" color={isActivo ? "success" : "error"}>
                    {isActivo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>

                <div className="space-y-3 py-3 text-xs border-b border-gray-100 dark:border-white/[0.05]">
                  {role.descripcion && (
                    <div>
                      <span className="block font-bold tracking-wider text-gray-400 uppercase text-[10px]">
                        DESCRIPCIÓN
                      </span>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mt-0.5">
                        {role.descripcion}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block font-bold tracking-wider text-gray-400 uppercase text-[10px]">
                        USUARIOS
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                        <Icon name="mdi:account-outline" size={15} className="text-gray-400" />
                        {totalUsuarios === 1 ? "1 usuario" : `${totalUsuarios}`}
                      </span>
                    </div>

                    <div>
                      <span className="block font-bold tracking-wider text-gray-400 uppercase text-[10px]">
                        PERMISOS
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 mt-0.5">
                        {totalPermisos} / {totalPermisosSistema}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-around pt-2.5">
                  {isActivo ? (
                    <>
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            disabled={isItemLoading}
                            onClick={() => onPermissions(role)}
                            className="p-1.5 text-gray-500 hover:text-brand-600 disabled:opacity-30 cursor-pointer"
                            title="Gestionar permisos"
                          >
                            <Icon name="mdi:shield-lock-outline" size={20} />
                          </button>

                          <button
                            type="button"
                            disabled={isItemLoading}
                            onClick={() => onEdit(role)}
                            className="p-1.5 text-gray-500 hover:text-brand-600 disabled:opacity-30 cursor-pointer"
                            title="Editar rol"
                          >
                            <Icon name="mdi:pencil-outline" size={20} />
                          </button>
                        </>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          disabled={isItemLoading}
                          onClick={() => onToggleStatus(role)}
                          className="p-1.5 text-gray-500 hover:text-error-600 disabled:opacity-30 cursor-pointer"
                          title="Desactivar rol"
                        >
                          <Icon name="mdi:trash-can-outline" size={20} />
                        </button>
                      )}
                    </>
                  ) : (
                    canActivate && (
                      <button
                        type="button"
                        disabled={isItemLoading}
                        onClick={() => onToggleStatus(role)}
                        className="p-1.5 text-success-600 hover:text-success-700 disabled:opacity-30 cursor-pointer"
                        title="Reactivar rol"
                      >
                        <Icon name="mdi:refresh" size={20} />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* VISTA ESCRITORIO (TABLA TRADICIONAL) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
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
                    const isItemLoading = loadingRoleId === role.id;

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
                                      disabled={isItemLoading}
                                      onClick={() => onPermissions(role)}
                                      className="text-gray-500 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                      title="Gestionar permisos"
                                    >
                                      <Icon name="mdi:shield-lock-outline" size={19} />
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isItemLoading}
                                      onClick={() => onEdit(role)}
                                      className="text-gray-500 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                      title="Editar rol"
                                    >
                                      <Icon name="mdi:pencil-outline" size={19} />
                                    </button>
                                  </>
                                )}

                                {canDelete && (
                                  <button
                                    type="button"
                                    disabled={isItemLoading}
                                    onClick={() => onToggleStatus(role)}
                                    className="text-gray-500 hover:text-error-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                                  disabled={isItemLoading}
                                  onClick={() => onToggleStatus(role)}
                                  className="text-success-600 hover:text-success-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
    </div>
  );
}