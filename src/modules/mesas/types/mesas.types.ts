/**
 * Tipos del módulo de mesas y pedidos (M05).
 *
 * El flujo es: se selecciona una mesa libre, se abre un pedido,
 * se agregan ítems, se comanda, y finalmente se cobra o anula.
 */

export type EstadoMesa = 1 | 2 | 3 | 4;
export type EstadoPedido = 1 | 2 | 3 | 4 | 5;
export type TipoPedido = 1 | 2 | 3;

export type Mesa = {
  id: number;
  id_salon: number;
  codigo: string;
  capacidad_personas: number;
  estado_mesa: EstadoMesa;
  estado: number;
};

export type Salon = {
  id: number;
  id_sucursal: number;
  codigo: string;
  nombre: string;
  estado: number;
};

export type SucursalOption = {
  id: number;
  codigo: string;
  nombre: string;
};

export type PedidoItem = {
  id: number;
  id_pedido: number;
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  monto_subtotal: number;
  observacion: string | null;
  estado: number;
  tipo_linea: number;
  adicionales: PedidoAdicional[];
};

export type PedidoAdicional = {
  id: number;
  id_adicional: number;
  nombre_adicional: string;
  precio: number;
  cantidad: number;
};

export type Pedido = {
  id: number;
  codigo: string;
  tipo_pedido: TipoPedido;
  id_mesa: number | null;
  codigo_mesa: string | null;
  id_mozo: number;
  nombre_mozo: string;
  id_turno: number;
  num_comensales: number;
  observacion: string | null;
  estado_pedido: EstadoPedido;
  estado_pedido_nombre: string;
  monto_subtotal: number;
  monto_igv: number;
  monto_total: number;
  monto_pagado: number;
  fecha_apertura: string;
  fecha_cierre: string | null;
  items: PedidoItem[];
};

export type ProductoOption = {
  id: number;
  nombre: string;
  precio_venta: number;
  afecto_igv: boolean;
  id_categoria: number;
  nombre_categoria: string;
  disponible: boolean;
};

export type AbrirPedidoValues = {
  tipo_pedido: TipoPedido;
  id_mesa?: number;
  id_sucursal?: number;
  id_mozo: number;
  id_turno: number;
  num_comensales?: number;
  observacion?: string;
};

export type AgregarItemValues = {
  id_producto: number;
  cantidad: number;
  precio_unitario?: number;
  observacion?: string;
};

export type AnularValues = {
  id_usuario_autoriza: number;
  motivo: string;
};

export type Feedback = {
  variant: "success" | "error" | "info";
  title: string;
  message: string;
};

export const ESTADOS_MESA: Record<
  EstadoMesa,
  { label: string; className: string; icon: string }
> = {
  1: {
    label: "Libre",
    className:
      "border-success-300 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-500/10 dark:text-success-400",
    icon: "mdi:check-circle-outline",
  },
  2: {
    label: "Ocupada",
    className:
      "border-error-300 bg-error-50 text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400",
    icon: "mdi:account-group-outline",
  },
  3: {
    label: "Por cobrar",
    className:
      "border-warning-300 bg-warning-50 text-warning-700 dark:border-warning-800 dark:bg-warning-500/10 dark:text-warning-400",
    icon: "mdi:cash-clock",
  },
  4: {
    label: "Inhabilitada",
    className:
      "border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
    icon: "mdi:cancel",
  },
};

export const ESTADOS_PEDIDO: Record<
  EstadoPedido,
  { label: string; className: string }
> = {
  1: {
    label: "Abierto",
    className:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-500/10 dark:text-blue-400",
  },
  2: {
    label: "Comandado",
    className:
      "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-400",
  },
  3: {
    label: "Por cobrar",
    className:
      "border-warning-300 bg-warning-50 text-warning-700 dark:border-warning-800 dark:bg-warning-500/10 dark:text-warning-400",
  },
  4: {
    label: "Pagado",
    className:
      "border-success-300 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-500/10 dark:text-success-400",
  },
  5: {
    label: "Anulado",
    className:
      "border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
};

export const TIPOS_PEDIDO: Record<
  TipoPedido,
  { label: string; icon: string }
> = {
  1: { label: "Mesa", icon: "mdi:table-chair" },
  2: { label: "Llevar", icon: "mdi:shopping-outline" },
  3: { label: "Delivery", icon: "mdi:motorbike" },
};
