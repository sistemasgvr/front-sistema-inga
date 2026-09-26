"use client";
import { useState } from "react";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import Alert from "@/components/ui/alert/Alert";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import Label from "@/components/form/Label";
import InputField from "@/components/form/input/InputField";
import type { Pedido, PedidoItem, Feedback } from "../types/mesas.types";
import type { ListaSelectOption } from "@/modules/listas/types/listas.types";

interface PedidoPanelProps {
  pedido: Pedido | null;
  loading: boolean;
  saving: boolean;
  feedback: Feedback | null;
  onComandar: () => void;
  onCambiarEstado: (estado: number) => void;
  onAnular: () => void;
  onCerrar: () => void;
  onAgregarItem: () => void;
  onGenerarComprobante: (tipo: string, documento: string) => void;
  comprobanteOptions: ListaSelectOption[];
}

const ESTADO_STYLES: Record<number, { className: string; label: string }> = {
  1: {
    className:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-500/10 dark:text-blue-400",
    label: "Abierto",
  },
  2: {
    className:
      "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-400",
    label: "Comandado",
  },
  3: {
    className:
      "border-warning-300 bg-warning-50 text-warning-700 dark:border-warning-800 dark:bg-warning-500/10 dark:text-warning-400",
    label: "Por cobrar",
  },
  4: {
    className:
      "border-success-300 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-500/10 dark:text-success-400",
    label: "Pagado",
  },
  5: {
    className:
      "border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
    label: "Anulado",
  },
};

const TIPO_DOCUMENTO: Record<string, { label: string; placeholder: string; maxLength: number }> = {
  BOLETA: { label: "DNI", placeholder: "Ingrese el DNI", maxLength: 8 },
  FACTURA: { label: "RUC", placeholder: "Ingrese el RUC", maxLength: 11 },
  NOTA_VENTA: { label: "DNI", placeholder: "Ingrese el DNI", maxLength: 8 },
};

export function PedidoPanel({
  pedido,
  loading,
  saving,
  feedback,
  onComandar,
  onCambiarEstado,
  onAnular,
  onCerrar,
  onAgregarItem,
  onGenerarComprobante,
  comprobanteOptions,
}: PedidoPanelProps) {
  const [showAnularConfirm, setShowAnularConfirm] = useState(false);
  const [tipoComprobante, setTipoComprobante] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");

  const estado = pedido ? ESTADO_STYLES[pedido.estado_pedido] ?? ESTADO_STYLES[1] : null;
  const itemsPendientes = pedido
    ? pedido.items.filter((i) => i.estado === 1 && i.tipo_linea !== 3)
    : [];

  const puedeComandar = itemsPendientes.length > 0;
  const puedePorCobrar = pedido?.estado_pedido === 2 && itemsPendientes.length === 0;
  const puedePagar = pedido?.estado_pedido === 3;
  const puedeAnular = pedido?.estado_pedido === 1 || pedido?.estado_pedido === 2;
  const puedeAgregarItems = pedido?.estado_pedido === 1 || pedido?.estado_pedido === 2;

  const tipoSeleccionado = comprobanteOptions.find(
    (c) => c.value === tipoComprobante,
  );
  const documentoInfo = tipoSeleccionado
    ? TIPO_DOCUMENTO[tipoSeleccionado.label.toUpperCase().replace(/\s+/g, "_")]
    : null;

  const subtotal = pedido?.monto_subtotal ?? 0;
  const igv = pedido?.monto_igv ?? 0;
  const total = pedido?.monto_total ?? 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {pedido ? `Pedido ${pedido.codigo}` : "Resumen del pedido"}
          </h3>
          <p className="text-sm text-gray-500">
            {pedido
              ? `Mesa ${pedido.codigo_mesa} · ${pedido.nombre_mozo}`
              : "Selecciona una mesa para comenzar"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {estado && (
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${estado.className}`}
            >
              {estado.label}
            </span>
          )}
          {pedido && (
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <Icon name="mdi:close" size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
          <Alert {...feedback} />
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {!pedido ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
              <Icon name="mdi:table-chair" size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              No hay nada por el momento
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Haz clic en una mesa libre para abrir un pedido
            </p>
          </div>
        ) : pedido.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No hay productos agregados
          </p>
        ) : (
          <div className="space-y-3">
            {pedido.items.map((item) => (
              <PedidoItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-900 dark:text-white">
              S/ {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">IGV</span>
            <span className="font-medium text-gray-900 dark:text-white">
              S/ {igv.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
            <span className="font-semibold text-gray-900 dark:text-white">
              Total a pagar
            </span>
            <span className="text-lg font-bold text-brand-600">
              S/ {total.toFixed(2)}
            </span>
          </div>
          {pedido && pedido.monto_pagado > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pagado</span>
              <span className="font-medium text-success-600">
                S/ {pedido.monto_pagado.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Comprobante */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="space-y-3">
          <Label>Tipo de comprobante</Label>
          <div className="flex gap-2">
            {comprobanteOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTipoComprobante(option.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  tipoComprobante === option.value
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {documentoInfo && (
            <div>
              <Label>{documentoInfo.label}</Label>
              <InputField
                type="text"
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                placeholder={documentoInfo.placeholder}
                maxLength={documentoInfo.maxLength}
              />
            </div>
          )}

          {tipoComprobante && documentoInfo && (
            <Button
              onClick={() =>
                onGenerarComprobante(tipoComprobante, numeroDocumento)
              }
              disabled={!numeroDocumento.trim() || saving}
              className="w-full"
              startIcon={<Icon name="mdi:receipt-text-outline" size={18} />}
            >
              Emitir {tipoSeleccionado?.label}
            </Button>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="space-y-2">
          {puedeAgregarItems && (
            <Button
              onClick={onAgregarItem}
              disabled={saving}
              variant="outline"
              className="w-full"
              startIcon={<Icon name="mdi:plus" size={18} />}
            >
              Agregar producto
            </Button>
          )}

          {puedeComandar && (
            <Button
              onClick={onComandar}
              disabled={saving}
              className="w-full"
              startIcon={<Icon name="mdi:chef-hat" size={18} />}
            >
              Enviar comanda ({itemsPendientes.length} pendientes)
            </Button>
          )}

          {puedePorCobrar && (
            <Button
              onClick={() => onCambiarEstado(3)}
              disabled={saving}
              className="w-full"
              startIcon={<Icon name="mdi:cash-clock" size={18} />}
            >
              Por cobrar
            </Button>
          )}

          {puedePagar && (
            <Button
              onClick={() => onCambiarEstado(4)}
              disabled={saving}
              className="w-full"
              startIcon={<Icon name="mdi:cash-check" size={18} />}
            >
              Cobrar
            </Button>
          )}

          {puedeAnular && (
            <Button
              onClick={() => setShowAnularConfirm(true)}
              disabled={saving}
              variant="outline"
              className="w-full text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
              startIcon={<Icon name="mdi:cancel" size={18} />}
            >
              Cancelar pedido
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showAnularConfirm}
        onClose={() => setShowAnularConfirm(false)}
        onConfirm={onAnular}
        title="Cancelar pedido"
        description="¿Estás seguro de cancelar este pedido? Esta acción devolverá el inventario y liberará la mesa."
        confirmText="Cancelar"
        variant="danger"
        isLoading={saving}
      />
    </div>
  );
}

function PedidoItemRow({ item }: { item: PedidoItem }) {
  const esAnulado = item.tipo_linea === 3;

  return (
    <div
      className={`rounded-xl border p-3 ${
        esAnulado
          ? "border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className={`text-sm font-medium ${
              esAnulado
                ? "text-gray-400 line-through"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {item.nombre_producto}
          </p>
          {item.observacion && (
            <p className="mt-0.5 text-xs text-gray-500">
              {item.observacion}
            </p>
          )}
          {item.adicionales.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.adicionales.map((adj) => (
                <span
                  key={adj.id}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  + {adj.nombre_adicional}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-semibold ${
              esAnulado
                ? "text-gray-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            S/ {item.monto_subtotal.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            {item.cantidad} x S/ {item.precio_unitario.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
