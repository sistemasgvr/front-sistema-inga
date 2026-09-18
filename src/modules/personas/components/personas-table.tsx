"use client";

import Badge from "@/components/ui/badge/Badge";
import { Icon } from "@/components/ui/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TIPO_PERSONA, type PersonaItem } from "../types/personas.types";

type PersonasTableProps = {
  personas: PersonaItem[];
  isLoading: boolean;
  onEdit: (item: PersonaItem) => void;
  onToggleStatus: (item: PersonaItem) => void;
};

export function PersonasTable({
  personas,
  isLoading,
  onEdit,
  onToggleStatus,
}: PersonasTableProps) {
  const safePersonas = Array.isArray(personas) ? personas : [];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[940px]">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                  Nombre
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                  Documento
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                  Roles
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                  Convenio
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                  Contacto
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">
                    Cargando personas...
                  </TableCell>
                </TableRow>
              ) : safePersonas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-12 text-center">
                    <Icon
                      name="mdi:account-search-outline"
                      size={40}
                      className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                    />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      No hay personas que coincidan
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Ajusta los filtros o registra un cliente o proveedor nuevo.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                safePersonas.map((item) => {
                  const isActivo = item.estado === 1;
                  const esEmpresa = item.tipo_persona === TIPO_PERSONA.JURIDICA;

                  return (
                    <TableRow
                      key={item.id}
                      className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                    >
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-2.5">
                          {/* El icono distingue de un vistazo empresa de
                              persona, sin gastar una columna entera. */}
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              esEmpresa
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                            title={esEmpresa ? "Empresa" : "Persona natural"}
                          >
                            <Icon
                              name={esEmpresa ? "mdi:domain" : "mdi:account-outline"}
                              size={17}
                            />
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.nombre_completo || "Sin nombre"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                          {item.tipo_documento_nombre}
                        </span>
                        <span className="mt-0.5 block font-mono text-sm text-gray-800 dark:text-gray-200">
                          {item.num_documento}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {item.es_cliente && (
                            <Badge size="sm" color="success">
                              Cliente
                            </Badge>
                          )}
                          {item.es_proveedor && (
                            <Badge size="sm" color="info">
                              Proveedor
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        {item.nombre_convenio ? (
                          <Badge size="sm" color="warning">
                            {item.nombre_convenio}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        {item.telefono || item.email ? (
                          <>
                            {item.telefono && (
                              <span className="block text-sm text-gray-700 dark:text-gray-300">
                                {item.telefono}
                              </span>
                            )}
                            {item.email && (
                              <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
                                {item.email}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">Sin contacto</span>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={isActivo ? "success" : "error"}>
                          {isActivo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          {isActivo && (
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="text-gray-500 transition-colors hover:text-brand-600"
                              title="Editar persona"
                            >
                              <Icon name="mdi:pencil-outline" size={19} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleStatus(item)}
                            className={
                              isActivo
                                ? "text-gray-500 transition-colors hover:text-error-600"
                                : "text-success-600 transition-colors hover:text-success-700"
                            }
                            title={isActivo ? "Dar de baja" : "Reactivar"}
                          >
                            <Icon
                              name={isActivo ? "mdi:trash-can-outline" : "mdi:refresh"}
                              size={19}
                            />
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
