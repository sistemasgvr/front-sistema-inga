import type { StockItem } from "../types/inventario.types";

/** Motivos de salida válidos para dar de baja platos preparados libres. */
export const MOTIVOS_DESCARTE = ["MERMA", "VENCIMIENTO", "DETERIORO"] as const;

/** Platos preparados sin asignar a pedido: lo único que se puede descartar desde el control de stock. */
export const platosLibres = (item: StockItem) =>
  Math.max(Number(item.stock_actual) - Number(item.stock_reservado ?? 0), 0);
