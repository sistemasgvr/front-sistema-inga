import type { ProductoOption } from "../types/mesas.types";

/**
 * Unidades del plato ya terminadas y sin reservar: al comandar se entregan de
 * inmediato y el resto pasa a preparación. Si el backend todavía no envía
 * stock_disponible se usa stock_actual, que no descuenta lo reservado.
 */
export function unidadesListas(producto: ProductoOption): number {
  if (!producto.controla_stock) return 0;
  const stock = producto.stock_disponible ?? producto.stock_actual;
  return Math.max(Number(stock) || 0, 0);
}
