"use client";

import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import type { EstacionItem } from "../types/estaciones.types";

type EstacionesTableProps = {
  estaciones: EstacionItem[];
  isLoading: boolean;
  onEdit: (item: EstacionItem) => void;
  onToggleStatus: (item: EstacionItem) => void;
};

export function EstacionesTable({
  estaciones,
  isLoading,
  onEdit,
  onToggleStatus,
}: EstacionesTableProps) {
  const safeEstaciones = Array.isArray(estaciones) ? estaciones : [];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Código / Nombre</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Impresora / IP</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">KDS</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Estado</TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">Cargando estaciones...</TableCell>
                </TableRow>
              ) : safeEstaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">No se encontraron estaciones.</TableCell>
                </TableRow>
              ) : (
                safeEstaciones.map((item) => {
                  const isActivo = item.estado === 1;

                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-xs font-bold text-brand-600 dark:text-brand-400">{item.codigo}</span>
                        <span className="block text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{item.nombre}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-sm text-gray-800 dark:text-gray-200">{item.impresora_nombre || "Sin impresora"}</span>
                        <span className="block text-xs text-gray-500 font-mono mt-0.5">{item.impresora_ip || "IP no asignada"}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={item.usa_kds ? "success" : "light"}>
                          {item.usa_kds ? "Sí" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={isActivo ? "success" : "error"}>{isActivo ? "Activo" : "Inactivo"}</Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          {isActivo && (
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="text-gray-500 hover:text-brand-600 transition-colors"
                              title="Editar estación"
                            >
                              <Icon name="mdi:pencil-outline" size={19} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleStatus(item)}
                            className={isActivo ? "text-gray-500 hover:text-error-600" : "text-success-600 hover:text-success-700"}
                            title={isActivo ? "Desactivar" : "Activar"}
                          >
                            <Icon name={isActivo ? "mdi:trash-can-outline" : "mdi:refresh"} size={19} />
                          </button>
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