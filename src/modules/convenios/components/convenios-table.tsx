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
import type { ConvenioItem } from "../types/convenios.types";

type ConveniosTableProps = {
  convenios: ConvenioItem[];
  isLoading: boolean;
  onEdit: (item: ConvenioItem) => void;
  onToggleStatus: (item: ConvenioItem) => void;
};

/** Formateo montos en soles con separador de miles, como se leen en caja. */
function formatearSoles(monto: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(monto) || 0);
}

export function ConveniosTable({
  convenios,
  isLoading,
  onEdit,
  onToggleStatus,
}: ConveniosTableProps) {
  const safeConvenios = Array.isArray(convenios) ? convenios : [];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[860px]">
          <Table>
            <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                  Código / Nombre
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                  Condición de pago
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-end text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                  Límite de crédito
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                  Corte
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                  Clientes
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
                    Cargando convenios...
                  </TableCell>
                </TableRow>
              ) : safeConvenios.length === 0 ? (
                // Estado vacío con una pista de qué hacer, en vez de solo
                // "no hay resultados", que deja al usuario sin salida.
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-12 text-center">
                    <Icon
                      name="mdi:handshake-outline"
                      size={40}
                      className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                    />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      No hay convenios que coincidan
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Prueba con otro texto de búsqueda o crea un convenio nuevo.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                safeConvenios.map((item) => {
                  const isActivo = item.estado === 1;
                  const tieneClientes = item.personas_asignadas > 0;

                  return (
                    <TableRow
                      key={item.id}
                      className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                    >
                      <TableCell className="px-5 py-4 text-start">
                        <span className="block text-xs font-bold text-brand-600 dark:text-brand-400">
                          {item.codigo}
                        </span>
                        <span className="mt-0.5 block text-sm font-semibold text-gray-900 dark:text-white">
                          {item.nombre}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {item.nombre_condicion_pago}
                        </span>
                        {item.dias_credito > 0 && (
                          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                            {item.dias_credito} días de crédito
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-end">
                        {Number(item.limite_credito) > 0 ? (
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatearSoles(item.limite_credito)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Sin tope</span>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={item.corte_quincenal ? "info" : "light"}>
                          {item.corte_quincenal ? "Quincenal" : "Otro"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center">
                        <span
                          className={`text-sm font-semibold ${
                            tieneClientes
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-400"
                          }`}
                        >
                          {item.personas_asignadas}
                        </span>
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
                              title="Editar convenio"
                            >
                              <Icon name="mdi:pencil-outline" size={19} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleStatus(item)}
                            className={
                              isActivo
                                ? "text-gray-500 transition-colors hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-gray-500"
                                : "text-success-600 transition-colors hover:text-success-700"
                            }
                            // Deshabilito la baja cuando tiene clientes: el
                            // backend la va a rechazar igual, así que prefiero
                            // no dejar que lo intente y explicar por qué.
                            disabled={isActivo && tieneClientes}
                            title={
                              isActivo && tieneClientes
                                ? `No se puede dar de baja: tiene ${item.personas_asignadas} cliente(s) asignado(s)`
                                : isActivo
                                  ? "Dar de baja"
                                  : "Reactivar"
                            }
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
