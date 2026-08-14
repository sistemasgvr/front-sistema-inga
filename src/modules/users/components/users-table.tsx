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
import type { User } from "../types/user.types";
import { UserActionsDropdown } from "./user-actions-dropdown";

type UsersTableProps = {
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
};

export function UsersTable({
  users,
  isLoading,
  onEdit,
  onToggleStatus,
}: UsersTableProps) {
  // Garantizamos que 'safeUsers' siempre sea un arreglo iterable
  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                  Usuario
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                  Nombres y Apellidos
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                  Roles
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : safeUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay usuarios para mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                safeUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex items-center gap-3">
                        <AvatarText name={`${user.nombres} ${user.apellidos}`} />
                        <div>
                          <span className="block font-medium text-gray-800 dark:text-white/90">
                            @{user.username}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-5 py-3 text-start text-gray-700 dark:text-gray-300">
                      {user.nombres} {user.apellidos}
                      {user.telefono ? (
                        <span className="block text-xs text-gray-400">{user.telefono}</span>
                      ) : null}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((rol) => (
                            <Badge key={rol.id} size="sm" color="primary" variant="light">
                              {rol.nombre}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Sin rol</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-start">
                      <Badge size="sm" color={user.estado === 1 ? "success" : "error"}>
                        {user.estado === 1 ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-start">
                      <UserActionsDropdown
                        user={user}
                        onEdit={onEdit}
                        onToggleStatus={onToggleStatus}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}