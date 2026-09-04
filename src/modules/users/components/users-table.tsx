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
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
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

  const isSuperAdmin = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
  const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];

  const canEditPermission = isSuperAdmin || userPermisos.includes(PermisoBanderas.USUARIOS_EDITAR);
  const canActivatePermission = isSuperAdmin || userPermisos.includes(PermisoBanderas.USUARIOS_ACTIVAR);
  const canDeletePermission = isSuperAdmin || userPermisos.includes(PermisoBanderas.USUARIOS_ELIMINAR);

  function formatDate(rawDate?: string | null) {
    if (!rawDate) return "N/A";
    try {
      const date = new Date(rawDate);
      return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return rawDate;
    }
  }

  return (
    <div>
      {/* VISTA MÓVIL */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03]">
            Cargando usuarios...
          </div>
        ) : safeUsers.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03]">
            No hay usuarios registrados.
          </div>
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
              const hasTogglePerm = isActivo ? canDeletePermission : canActivatePermission;
              canToggle = hasTogglePerm && !isSelf && !isTargetOwner;
            }

            return (
              <div
                key={targetUser.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-white/[0.05] dark:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/[0.05]">
                  <div className="flex items-center gap-2.5">
                    <AvatarText name={`${targetUser.nombres} ${targetUser.apellidos}`} />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {targetUser.nombres} {targetUser.apellidos} {isSelf && "(Tú)"}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">
                        @{targetUser.username}
                      </span>
                    </div>
                  </div>
                  <Badge size="sm" color={isActivo ? "success" : "error"}>
                    {isActivo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 text-xs border-b border-gray-100 dark:border-white/[0.05]">
                  <div>
                    <span className="block font-bold tracking-wider text-gray-400 uppercase text-[10px]">
                      CORREO
                    </span>
                    <span className="block font-medium text-gray-800 dark:text-gray-200 truncate mt-0.5">
                      {targetUser.email}
                    </span>
                  </div>

                  <div>
                    <span className="block font-bold tracking-wider text-gray-400 uppercase text-[10px]">
                      TELÉFONO
                    </span>
                    <span className="block font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                      {targetUser.telefono || "Sin teléfono"}
                    </span>
                  </div>

                  <div>
                    <span className="block font-bold tracking-wider text-gray-400 uppercase text-[10px]">
                      ROLES
                    </span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
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
                        <span className="text-gray-400">Sin rol</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="block font-bold tracking-wider text-gray-400 uppercase text-[10px]">
                      CREADO
                    </span>
                    <span className="block font-medium text-gray-700 dark:text-gray-300 mt-0.5">
                      {formatDate(targetUser.fecha_creacion)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-around pt-2.5">
                  {canEdit && isActivo && (
                    <button
                      type="button"
                      disabled={isItemLoading}
                      onClick={() => onEdit(targetUser)}
                      className="p-1.5 text-gray-500 hover:text-brand-600 disabled:opacity-30 cursor-pointer"
                      title="Editar usuario"
                    >
                      <Icon name="mdi:pencil-outline" size={20} />
                    </button>
                  )}

                  {canToggle && (
                    isActivo ? (
                      <button
                        type="button"
                        disabled={isItemLoading}
                        onClick={() => onToggleStatus(targetUser)}
                        className="p-1.5 text-gray-500 hover:text-error-600 disabled:opacity-30 cursor-pointer"
                        title="Desactivar usuario"
                      >
                        <Icon name="mdi:trash-can-outline" size={20} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isItemLoading}
                        onClick={() => onToggleStatus(targetUser)}
                        className="p-1.5 text-success-600 hover:text-success-700 disabled:opacity-30 cursor-pointer"
                        title="Reactivar usuario"
                      >
                        <Icon name="mdi:refresh" size={20} />
                      </button>
                    )
                  )}

                  {!canEdit && !canToggle && (
                    <span className="text-xs italic text-gray-400 py-1">Protegido</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* VISTA ESCRITORIO */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
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
                      const hasTogglePerm = isActivo ? canDeletePermission : canActivatePermission;
                      canToggle = hasTogglePerm && !isSelf && !isTargetOwner;
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
    </div>
  );
}