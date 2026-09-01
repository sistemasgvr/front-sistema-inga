"use client";

import Badge from "@/components/ui/badge/Badge";
import AvatarText from "@/components/ui/avatar/AvatarText";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import type { User } from "../types/user.types";

type UsersTableProps = {
  users: User[];
  currentUser?: User | null;
  isLoading: boolean;
  loadingUserId?: number | null;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
};

export function UsersTable({
  users,
  currentUser,
  isLoading,
  loadingUserId,
  onEdit,
  onToggleStatus,
}: UsersTableProps) {
  const safeUsers = Array.isArray(users) ? users : [];

  const isSuperAdmin = Boolean(currentUser?.es_super_admin);
  const userPermisos = currentUser?.permisos ?? [];

  const canEditPermission = isSuperAdmin || userPermisos.includes("usuarios.editar");
  const canActivatePermission = isSuperAdmin || userPermisos.includes("usuarios.activar");
  const canDeletePermission = isSuperAdmin || userPermisos.includes("usuarios.eliminar");

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                  Usuario
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                  Correo / Teléfono
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300">
                  Roles
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
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : safeUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              ) : (
                safeUsers.map((targetUser) => {
                  const isActivo = targetUser.estado === 1;
                  const isTargetOwner = Boolean(targetUser.es_super_admin);
                  const isSelf = Number(currentUser?.id) === Number(targetUser.id);
                  const isItemLoading = loadingUserId === targetUser.id;

                  let canEdit = false;
                  let canToggle = false;

                  if (isSuperAdmin) {
                    canEdit = true;
                    canToggle = !isSelf && !isTargetOwner;
                  } else {
                    canEdit = canEditPermission && (isSelf || !isTargetOwner);
                    canToggle = (canActivatePermission || canDeletePermission) && !isSelf && !isTargetOwner;
                  }

                  return (
                    <TableRow key={targetUser.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-3">
                          <AvatarText name={`${targetUser.nombres} ${targetUser.apellidos}`} />
                          <div>
                            <span className="block text-sm font-bold text-gray-900 dark:text-white">
                              {targetUser.nombres} {targetUser.apellidos} {isSelf && "(Tú)"}
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              @{targetUser.username}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-sm text-gray-800 dark:text-gray-200">
                          {targetUser.email}
                        </span>
                        {targetUser.telefono && (
                          <span className="block text-xs text-gray-500">{targetUser.telefono}</span>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex flex-wrap gap-1">
                          {isTargetOwner ? (
                            <Badge size="sm" color="warning">
                              Super Admin
                            </Badge>
                          ) : targetUser.roles && targetUser.roles.length > 0 ? (
                            targetUser.roles.map((rol) => (
                              <Badge key={rol.id} size="sm" color="primary" variant="light">
                                {rol.nombre}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">Sin rol</span>
                          )}
                        </div>
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
                              onClick={() => onEdit(targetUser)}
                              className="text-gray-500 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Editar usuario"
                            >
                              <Icon name="mdi:pencil-outline" size={19} />
                            </button>
                          )}

                          {canToggle && (
                            isActivo ? (
                              <button
                                type="button"
                                disabled={isItemLoading}
                                onClick={() => onToggleStatus(targetUser)}
                                className="text-gray-500 hover:text-error-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                title="Desactivar usuario"
                              >
                                <Icon name="mdi:trash-can-outline" size={19} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isItemLoading}
                                onClick={() => onToggleStatus(targetUser)}
                                className="text-success-600 hover:text-success-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                title="Reactivar usuario"
                              >
                                <Icon name="mdi:refresh" size={19} />
                              </button>
                            )
                          )}

                          {!canEdit && !canToggle && (
                            <span className="text-xs italic text-gray-400">Protegido</span>
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