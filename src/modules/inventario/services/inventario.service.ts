import { apiGet, apiPost } from "@/shared/api/api-client";
import type {
  StockItem,
  ListStockParams,
  RegistrarMovimientoValues,
} from "../types/inventario.types";

export async function listStock(params: ListStockParams, signal?: AbortSignal) {
 return apiGet<{registros: StockItem[]; total:number; resumen: {total:number;alertas:number;normales:number}}>("/inventario/stock",{
  signal,params:{id_almacen:params.id_almacen,limite:params.limite,offset:(params.pagina-1)*params.limite,buscar:params.buscar,estado:params.estado}
 });
}

export async function registrarAjusteStock(values: RegistrarMovimientoValues) {
  return apiPost("/inventario/movimientos", {
    codigo: values.codigo.trim().toUpperCase(),
    id_tipo_movimiento: values.id_tipo_movimiento,
    id_motivo_movimiento: values.id_motivo_movimiento,
    observacion: values.observacion?.trim() || undefined,
    confirmar: values.confirmar ?? true,
    detalles: [
      {
        id_producto: values.id_producto,
        id_almacen: values.id_almacen,
        id_unidad_medida: values.id_unidad_medida,
        cantidad: values.cantidad,
        signo: values.signo,
        costo_unitario: values.costo_unitario ?? undefined,
        observacion: values.observacion?.trim() || undefined,
      },
    ],
  });
}