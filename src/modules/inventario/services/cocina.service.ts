import { apiGet, apiPost, apiPut } from "@/shared/api/api-client";
import type { AvisoCocina, CocinaItem, Disponibilidad, PreparacionValues, ProductoPreparacion } from "../types/cocina.types";

export const listarCocina = (params:{id_sucursal:number;id_estacion?:number;historial:boolean;limite:number;offset:number}, signal:AbortSignal) =>
  apiGet<{registros:CocinaItem[];total:number}>("/inventario/cocina",{params,signal});
export const listarPreparables = (id_sucursal:number,signal:AbortSignal)=>
  apiGet<ProductoPreparacion[]>("/inventario/productos-preparables",{params:{id_sucursal},signal});
export const disponibilidadPreparacion = (values:PreparacionValues, signal:AbortSignal)=>
  apiGet<Disponibilidad>("/inventario/disponibilidad",{signal,params:{id_receta:values.id_receta,id_almacen:values.id_almacen_destino,cantidad:values.cantidad,id_pedido_detalle:values.id_pedido_detalle}});
export const confirmarPreparacion = (values:PreparacionValues)=>apiPost("/inventario/preparaciones",values);
export const cambiarPreparacion = (item:CocinaItem,estado_preparacion:3|4)=>
  apiPut(`/pedidos/${item.id_pedido}/items/${item.id}/preparacion`,{estado_preparacion});
export const entregarItem = (item:CocinaItem,cantidad_entregada:number)=>
  apiPost(`/pedidos/${item.id_pedido}/items/${item.id}/entregar`,{cantidad_entregada});
export const listarAvisosCocina = (params:{id_sucursal:number;id_estacion?:number},signal:AbortSignal)=>
  apiGet<AvisoCocina[]>("/inventario/cocina/avisos",{params,signal});
export const atenderAvisoCocina = (id:number)=>apiPost(`/inventario/cocina/avisos/${id}/atender`,{});
