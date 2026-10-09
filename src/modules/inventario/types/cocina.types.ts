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
};
export type Disponibilidad = {
  preparados: number; reservados: number; posibles_preparar: number;
  ingredientes: {id_producto:number; nombre:string; simbolo:string; disponible:number; requerido:number; faltante:number}[];
};
export type PreparacionValues = {
  codigo:string; id_receta:number; id_almacen_destino:number; cantidad:number; id_pedido_detalle?:number;
};
export type CocinaAccion = "entregar" | "cancelar";
export type FaltanteCocina = {
  id_producto: number; producto: string; unidad: string; requerido: number; disponible: number; faltante: number; platos: string[];
};
export type AvisoCocina = {
  id: number; id_pedido: number; codigo_pedido: string; codigo_mesa: string | null; mensaje: string;
  faltantes: FaltanteCocina[]; fecha_modificacion: string; usuario: string | null;
};
