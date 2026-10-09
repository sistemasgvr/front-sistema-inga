"use client";

import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import type { StockItem } from "../types/inventario.types";
import type { User } from "@/modules/users/types/user.types";

type StockTableProps = {
  items: StockItem[];
  currentUser?: User | null;
  isLoading: boolean;
  onAdjust: (item: StockItem) => void;
};

export function StockTable({
  items,
  currentUser,
  isLoading,
  onAdjust,
}: StockTableProps) {
  const safeItems = Array.isArray(items) ? items : [];

  const isSuperAdmin = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
  const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];
  const canManageStock = isSuperAdmin || userPermisos.includes(PermisoBanderas.INVENTARIO_GESTIONAR);

  function formatMoney(amount: number) {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  }

  return (
    <div>
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03]">
            Cargando existencias de inventario...
          </div>
        ) : safeItems.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03]">
            No se encontraron registros de stock.
          </div>
        ) : (
          safeItems.map((item) => {
            const isBajoStock = item.alerta_activa || item.stock_actual <= item.stock_minimo;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-white/[0.05] dark:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/[0.05]">
                  <div>
                    <span className="block text-[11px] font-bold text-gray-400 uppercase">
                      {item.almacen_nombre || "Almacén General"}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                      {item.producto_nombre || "Producto"}
                    </h4>
                    <span className="block text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {item.producto_codigo || `PROD-${item.id_producto}`}
                    </span>
                  </div>
                  <Badge size="sm" color={isBajoStock ? "error" : "success"}>
                    {isBajoStock ? "Bajo mínimo" : "Stock OK"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 text-xs border-b border-gray-100 dark:border-white/[0.05]">
                  <div>
                    <span className="block font-bold tracking-wider text-gray-400 uppercase text-[10px]">
                      U.M.
                    </span>
                    <span className="block font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
                      {item.simbolo_unidad || "UND"}
                    </span>
                  </div>

                  <div>
                    <span className="block font-bold tracking-wider text-gray-400 uppercase text-[10px]">
                      SALDO
                    </span>
                    <span className={`block font-extrabold mt-0.5 ${isBajoStock ? "text-rose-600 dark:text-rose-400" : "text-gray-900 dark:text-white"}`}>
                      {item.stock_actual}
                    </span>
                  </div>

                  <div>
                    <span className="block font-bold tracking-wider text-gray-400 uppercase text-[10px]">
                      MÍNIMO
                    </span>
                    <span className="block font-medium text-gray-600 dark:text-gray-400 mt-0.5">
                      {item.stock_minimo}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Costo prom: {formatMoney(item.costo_promedio)}
                  </span>

                  {canManageStock && !item.tiene_receta ? (
                    <button
                      type="button"
                      onClick={() => onAdjust(item)}
                      className="p-1.5 text-gray-500 hover:text-brand-600 transition-colors cursor-pointer"
                      title="Ajuste manual de stock"
                    >
                      <Icon name="mdi:tune-vertical" size={20} />
                    </button>
                  ) : (
                    <span className="text-xs italic text-gray-400">{item.tiene_receta ? "Gestionado por cocina" : "Protegido"}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[950px]">
            <Table>
              <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-gray-900/20">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Almacén
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-start text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Producto
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    U.M.
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Saldo
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Mínimo
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase dark:text-gray-300">
                    Costo Prom.
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
                    <TableCell colSpan={8} className="px-5 py-8 text-center text-sm text-gray-500">
                      Cargando existencias de inventario...
                    </TableCell>
                  </TableRow>
                ) : safeItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="px-5 py-8 text-center text-sm text-gray-500">
                      No se encontraron registros de stock.
                    </TableCell>
                  </TableRow>
                ) : (
                  safeItems.map((item) => {
                    const isBajoStock = item.alerta_activa || item.stock_actual <= item.stock_minimo;

                    return (
                      <TableRow key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                            {item.almacen_nombre || "Almacén General"}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          <span className="block text-sm font-bold text-gray-900 dark:text-white">
                            {item.producto_nombre || "Producto"}
                          </span>
                          <span className="block text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
                            {item.producto_codigo || `PROD-${item.id_producto}`}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                            {item.simbolo_unidad || "UND"}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <span className={`text-sm font-bold ${isBajoStock ? "text-rose-600 dark:text-rose-400" : "text-gray-900 dark:text-white"}`}>
                            {item.stock_actual}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {item.stock_minimo}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(item.costo_promedio)}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <Badge size="sm" color={isBajoStock ? "error" : "success"}>
                            {isBajoStock ? "Bajo mínimo" : "Stock OK"}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canManageStock && !item.tiene_receta ? (
                              <button
                                type="button"
                                onClick={() => onAdjust(item)}
                                className="text-gray-500 hover:text-brand-600 transition-colors cursor-pointer"
                                title="Ajuste manual de stock"
                              >
                                <Icon name="mdi:tune-vertical" size={19} />
                              </button>
                            ) : (
                              <span className="text-xs italic text-gray-400">{item.tiene_receta ? "Gestionado por cocina" : "Protegido"}</span>
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