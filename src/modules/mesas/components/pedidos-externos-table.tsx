"use client";
import { ESTADO_PEDIDO_STYLES } from "./pedido-panel";
import type { PedidoResumen } from "../types/mesas.types";

const TIPO_LABEL: Record<number, string> = { 2: "Para llevar", 3: "Delivery" };
const money = (value: number) => `S/ ${Number(value).toFixed(2)}`;
const hora = (fecha: string) =>
  new Date(fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

interface PedidosExternosTableProps {
  pedidos: PedidoResumen[];
  loading: boolean;
  selectedId: number | null;
  disabled: boolean;
  onSelect: (pedido: PedidoResumen) => void;
}

export function PedidosExternosTable({ pedidos, loading, selectedId, disabled, onSelect }: PedidosExternosTableProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Delivery y para llevar en curso</h3>
        <span className="text-sm text-gray-500">{loading ? "Actualizando..." : `${pedidos.length} pedidos`}</span>
      </div>

      {loading ? (
        <p role="status" className="py-10 text-center text-sm text-gray-500">Cargando pedidos...</p>
      ) : !pedidos.length ? (
        <p className="py-10 text-center text-sm text-gray-500">No hay pedidos de delivery o para llevar en curso.</p>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 dark:border-gray-800">
                <th className="px-3 py-2 font-medium">Pedido</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Entrega / notas</th>
                <th className="px-3 py-2 font-medium">Atendido por</th>
                <th className="px-3 py-2 font-medium">Hora</th>
                <th className="px-3 py-2 text-right font-medium">Ítems</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => {
                const estado = ESTADO_PEDIDO_STYLES[p.estado_pedido] ?? ESTADO_PEDIDO_STYLES[1];
                const selected = p.id === selectedId;
                return (
                  <tr key={p.id} tabIndex={disabled ? -1 : 0} aria-selected={selected}
                    onClick={() => { if (!disabled) onSelect(p); }}
                    onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(p); } }}
                    className={`cursor-pointer border-b border-gray-100 last:border-0 dark:border-gray-800 ${
                      selected ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    }`}>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-gray-900 dark:text-white">{p.codigo}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-700 dark:text-gray-300">{TIPO_LABEL[p.tipo_pedido] ?? "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="block font-medium text-gray-900 dark:text-white">{p.nombre_cliente || "—"}</span>
                      {p.telefono_cliente && <span className="block text-xs text-gray-500">{p.telefono_cliente}</span>}
                    </td>
                    <td className="max-w-xs truncate px-3 py-3 text-gray-600 dark:text-gray-400" title={p.observacion ?? undefined}>{p.observacion || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600 dark:text-gray-400">{p.nombre_mozo || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600 dark:text-gray-400">{hora(p.fecha_apertura)}</td>
                    <td className="px-3 py-3 text-right text-gray-600 dark:text-gray-400">{p.cantidad_items}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-brand-600">{money(p.monto_total)}</td>
                    <td className="px-3 py-3">
                      <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${estado.className}`}>{estado.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
