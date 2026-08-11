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

const ROLE_LABEL: Record<User["rol"], string> = {
  admin: "Administrador",
  operador: "Operador",
  consulta: "Consulta",
};

export function UsersTable({
  users,
  isLoading,
  onEdit,
  onToggleStatus,
}: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Usuario
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Rol
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Permisos
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Estado
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-theme-sm px-5 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-theme-sm px-5 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No hay usuarios para mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-5 py-4 text-start sm:px-6">
                      <div className="flex items-center gap-3">
                        <AvatarText name={user.nombre_usuario} />
                        <div>
                          <span className="text-theme-sm block font-medium text-gray-800 dark:text-white/90">
                            {user.nombre_usuario}
                          </span>
                          <span className="text-theme-xs block text-gray-500 dark:text-gray-400">
                            {user.correo}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                      <Badge size="sm" color="primary" variant="light">
                        {ROLE_LABEL[user.rol]}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex flex-wrap gap-1.5">
                        {user.permisos.slice(0, 2).map((permiso) => (
                          <Badge key={permiso} size="sm" color="info" variant="light">
                            {permiso}
                          </Badge>
                        ))}
                        {user.permisos.length > 2 ? (
                          <Badge size="sm" color="light" variant="light">
                            +{user.permisos.length - 2}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-start">
                      <Badge
                        size="sm"
                        color={user.estado === "activo" ? "success" : "error"}
                      >
                        {user.estado === "activo" ? "Activo" : "Inactivo"}
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
