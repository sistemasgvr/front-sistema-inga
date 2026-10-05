import { apiGet, apiPost } from "@/shared/api/api-client";
import type {
  StockItem,
  ListStockParams,
  RegistrarMovimientoValues,
} from "../types/inventario.types";

export async function listStock(params: ListStockParams) {
  const query = new URLSearchParams();
  if (params.id_almacen) query.append("id_almacen", String(params.id_almacen));
  if (params.limite) query.append("limite", String(params.limite));
  if (params.pagina) query.append("offset", String((params.pagina - 1) * params.limite));

  const url = `/inventario/stock${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await apiGet<{ registros: StockItem[] }>(url);
  const safeRegistros = response?.registros || [];

  let filtrados = safeRegistros;
  if (params.buscar?.trim()) {
    const term = params.buscar.trim().toLowerCase();
    filtrados = filtrados.filter(
      (item) =>
        item.producto_nombre?.toLowerCase().includes(term) ||
        item.producto_codigo?.toLowerCase().includes(term) ||
        item.almacen_nombre?.toLowerCase().includes(term)
    );
  }

  if (params.estado === "alertas") {
    filtrados = filtrados.filter((item) => item.alerta_activa || item.stock_actual <= item.stock_minimo);
  } else if (params.estado === "normales") {
    filtrados = filtrados.filter((item) => !item.alerta_activa && item.stock_actual > item.stock_minimo);
  }

  const alertasCount = safeRegistros.filter((i) => i.alerta_activa || i.stock_actual <= i.stock_minimo).length;

  return {
    registros: filtrados,
    total: filtrados.length,
    resumen: {
      total: safeRegistros.length,
      alertas: alertasCount,
      normales: safeRegistros.length - alertasCount,
    },
  };
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
        costo_unitario: values.costo_unitario || undefined,
        observacion: values.observacion?.trim() || undefined,
      },
    ],
  });
}