import type { PedidoItem } from "../types/mesas.types";

type ItemCancelable = Pick<PedidoItem, "cantidad" | "cantidad_cancelada" | "cantidad_entregada" | "cantidad_reservada" | "estado_preparacion">;

// Unidades comandadas que aún no tienen plato preparado (sus ingredientes están apartados).
export const unidadesSinPreparar = (item: ItemCancelable) =>
  Math.max(0, Number(item.cantidad) - Number(item.cantidad_cancelada) - Number(item.cantidad_entregada) - Number(item.cantidad_reservada));

// Igual que el backend: primero se cancelan las unidades sin preparar y después las preparadas.
export function repartoCancelacion(item: ItemCancelable, cantidad: number) {
  const sinPreparar = Math.min(cantidad, unidadesSinPreparar(item));
  const preparados = Math.max(0, cantidad - sinPreparar);
  return {
    sinPreparar,
    preparados,
    // Solo se pregunta qué hacer con los ingredientes si la preparación ya inició.
    pideDestinoInsumos: sinPreparar > 0 && item.estado_preparacion === 3,
    pideDestinoPreparado: preparados > 0,
  };
}
