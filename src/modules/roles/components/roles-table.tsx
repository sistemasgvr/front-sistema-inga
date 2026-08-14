"use client";

import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LockIcon, PencilIcon, TrashBinIcon } from "@/icons";
import type { RoleItem } from "../types/roles.types";

type RolesTableProps = {
  roles: RoleItem[];
  isLoading: boolean;
  onEdit: (role: RoleItem) => void;
  onPermissions: (role: RoleItem) => void;
  onToggleStatus: (role: RoleItem) => void;
};

export function RolesTable({
  roles,
  isLoading,
  onEdit,
  onPermissions,
  onToggleStatus,
}: RolesTableProps) {
  const safeRoles = Array.isArray(roles) ? roles : [];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">
                  Código
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">
                  Nombre y Descripción
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-center text-xs font-medium text-gray-500">
                  Permisos
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-center text-xs font-medium text-gray-500">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500">
                    Cargando roles...
                  </TableCell>
                </TableRow>
              ) : safeRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500">
                    No hay roles registrados.
                  </TableCell>
                </TableRow>
              ) : (
                safeRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="px-5 py-3 text-start">
                      <Badge size="sm" color="primary" variant="light">
                        {role.codigo}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-5 py-3 text-start">
                      <span className="block font-medium text-gray-800 dark:text-white">
                        {role.nombre}
                      </span>
                      {role.descripcion ? (
                        <span className="block text-xs text-gray-400">
                          {role.descripcion}
                        </span>
                      ) : null}
                    </TableCell>

                    <TableCell className="px-5 py-3 text-start">
                      <Badge size="sm" color={role.estado === 1 ? "success" : "error"}>
                        {role.estado === 1 ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onPermissions(role)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        title="Gestionar permisos"
                      >
                        <LockIcon className="h-3.5 w-3.5 text-brand-500" />
                        <span>Permisos</span>
                      </button>
                    </TableCell>

                    <TableCell className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => onEdit(role)}
                          className="text-gray-500 hover:text-brand-600 transition-colors"
                          title="Editar rol"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(role)}
                          className="text-gray-500 hover:text-error-600 transition-colors"
                          title={role.estado === 1 ? "Desactivar" : "Activar"}
                        >
                          <TrashBinIcon className="h-4 w-4" />
                        </button>
                      </div>
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