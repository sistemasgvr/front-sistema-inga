"use client";

import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import type { EstacionItem } from "../types/estaciones.types";
import type { User } from "@/modules/users/types/user.types";
import { ImprimirAquiSwitch } from "@/modules/impresion";
import { EstacionAcciones, type EstacionPermisos } from "./estacion-acciones";

type EstacionesTableProps = {
  estaciones: EstacionItem[];
  currentUser?: User | null;
  isLoading: boolean;
  loadingEstacionId?: number | null;
  onEdit: (item: EstacionItem) => void;
  onToggleStatus: (item: EstacionItem) => void;
  onMarcarPrincipal: (id: number) => void;
};

const headerCell = "px-5 py-3.5 text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300";

function EstacionNombre({ item }: { item: EstacionItem }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.nombre}</span>
      {item.es_caja_principal && (
        <Badge size="sm" color="info" startIcon={<Icon name="mdi:cash-register" size={13} />}>
          Caja principal
        </Badge>
      )}
    </div>
  );
}

function EstacionImpresora({ item }: { item: EstacionItem }) {
  if (!item.impresora_ip && !item.impresora_nombre) {
    return <span className="text-sm italic text-gray-400">Sin impresora</span>;
  }
  return (
    <div>
      <span className="block text-sm text-gray-800 dark:text-gray-200">{item.impresora_nombre || "Impresora"}</span>
      <span className="mt-0.5 block font-mono text-xs text-gray-500">
        {item.impresora_ip || "IP no asignada"} · {item.ancho_papel ?? 80} mm
      </span>
    </div>
  );
}

export function EstacionesTable({
  estaciones,
  currentUser,
  isLoading,
  loadingEstacionId,
  onEdit,
  onToggleStatus,
  onMarcarPrincipal,
}: EstacionesTableProps) {
  const safeEstaciones = Array.isArray(estaciones) ? estaciones : [];

  const isSuperAdmin = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
  const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];
  const tiene = (permiso: string) => isSuperAdmin || userPermisos.includes(permiso);

  const puedeImprimir = tiene("pedidos.comandar");
  const permisosDe = (item: EstacionItem): EstacionPermisos => ({
    editar: tiene(PermisoBanderas.ESTACIONES_EDITAR),
    cambiarEstado: tiene(item.estado === 1 ? PermisoBanderas.ESTACIONES_ELIMINAR : PermisoBanderas.ESTACIONES_ACTIVAR),
    imprimir: puedeImprimir,
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
        Cargando estaciones...
      </div>
    );
  }

  if (safeEstaciones.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
        No se encontraron estaciones.
      </div>
    );
  }

  return (
    <>
      {/* VISTA MÓVIL (Cards) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {safeEstaciones.map((item) => {
          const isActivo = item.estado === 1;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-white/[0.05] dark:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-2">
                <EstacionNombre item={item} />
                <EstacionAcciones
                  estacion={item}
                  permisos={permisosDe(item)}
                  isLoading={loadingEstacionId === item.id}
                  onEdit={onEdit}
                  onToggleStatus={onToggleStatus}
                  onMarcarPrincipal={onMarcarPrincipal}
                />
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <EstacionImpresora item={item} />
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  {item.usa_kds && <Badge size="sm" color="light">KDS</Badge>}
                  <Badge size="sm" color={isActivo ? "success" : "error"}>{isActivo ? "Activo" : "Inactivo"}</Badge>
                </div>
              </div>

              {puedeImprimir && (
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/[0.05]">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Imprimir aquí</span>
                  <ImprimirAquiSwitch estacion={item} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* VISTA ESCRITORIO (Tabla) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[860px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className={`${headerCell} text-start`}>Estación</TableCell>
                  <TableCell isHeader className={`${headerCell} text-start`}>Impresora</TableCell>
                  {puedeImprimir && (
                    <TableCell isHeader className={`${headerCell} text-center`}>Imprimir aquí</TableCell>
                  )}
                  <TableCell isHeader className={`${headerCell} text-center`}>KDS</TableCell>
                  <TableCell isHeader className={`${headerCell} text-center`}>Estado</TableCell>
                  <TableCell isHeader className={`${headerCell} text-end`}>Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {safeEstaciones.map((item) => {
                  const isActivo = item.estado === 1;
                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <TableCell className="px-5 py-4 text-start">
                        <EstacionNombre item={item} />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <EstacionImpresora item={item} />
                      </TableCell>
                      {puedeImprimir && (
                        <TableCell className="px-5 py-4 text-center">
                          <ImprimirAquiSwitch estacion={item} />
                        </TableCell>
                      )}
                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={item.usa_kds ? "success" : "light"}>{item.usa_kds ? "Sí" : "No"}</Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <Badge size="sm" color={isActivo ? "success" : "error"}>{isActivo ? "Activo" : "Inactivo"}</Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <EstacionAcciones
                          estacion={item}
                          permisos={permisosDe(item)}
                          isLoading={loadingEstacionId === item.id}
                          onEdit={onEdit}
                          onToggleStatus={onToggleStatus}
                          onMarcarPrincipal={onMarcarPrincipal}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
