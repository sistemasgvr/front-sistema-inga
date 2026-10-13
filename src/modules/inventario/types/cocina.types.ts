import type { PedidoItem } from "@/modules/mesas/types/mesas.types";

export type CocinaItem = PedidoItem & {
  codigo_pedido: string;
  codigo_mesa: string | null;
  id_sucursal: number;
  id_almacen_stock: number;
  estacion: string;
  numero_comanda: number;
  cantidad_pendiente: number;
};
export type ProductoPreparacion = {
  id: number; nombre: string; id_almacen_stock: number; id_receta: number; version: number; almacen: string;
  /** Preparados sin asignar a un pedido: cualquier pedido o plato compuesto puede tomarlos. */
  stock_libre: number;
};
export type IngredienteDisponibilidad = {
  id_producto:number; nombre:string; simbolo:string; disponible:number; requerido:number; faltante:number;
  /** Sub-plato del que sale el ingrediente; null = componente directo del plato. */
  id_producto_origen:number|null; origen:string|null; ruta:string;
  /** true = se usa un sub-plato ya preparado (del stock) en lugar de sus ingredientes. */
  preparado:boolean;
};
export type Disponibilidad = {
  preparados: number; reservados: number; libres: number; posibles_preparar: number;
  ingredientes: IngredienteDisponibilidad[];
};
export type PreparacionValues = {
  codigo:string; id_receta:number; id_almacen_destino:number; cantidad:number; id_pedido_detalle?:number;
};
export type CocinaAccion = "entregar" | "cancelar";
export type FaltanteCocina = {
  id_producto: number; producto: string; unidad: string; requerido: number; disponible: number; faltante: number; platos: string[];
  /** Ruta del sub-plato, p. ej. "Barco › Ceviche"; null si es un componente directo. */
  ruta?: string | null;
};
export type AvisoCocina = {
  id: number; id_pedido: number; codigo_pedido: string; codigo_mesa: string | null; mensaje: string;
  faltantes: FaltanteCocina[]; fecha_modificacion: string; usuario: string | null;
};
