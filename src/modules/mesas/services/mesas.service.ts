import {
  apiGet,
  apiGetPaginated,
  apiPost,
  apiPut,
  apiDelete,
} from "@/shared/api/api-client";
import type {
  Mesa,
  Salon,
  SucursalOption,
  Pedido,
  PedidoResumen,
  ProductoOption,
  AbrirPedidoValues,
  AgregarItemValues,
  AnularValues,
} from "../types/mesas.types";
import { getTurnoAbierto } from "@/modules/caja/services/caja.service";

/* ------------------------------- Sucursales ------------------------------- */

export const listSucursales = () =>
  apiGet<SucursalOption[]>("/salon/salones/sucursales");

/* -------------------------------- Salones --------------------------------- */

async function listAll<T>(url: string, idSucursal: number): Promise<T[]> {
  const items: T[] = [];
  for (let pagina = 1; ; pagina++) {
    const { data, meta } = await apiGetPaginated<T>(url, {
      params: { id_sucursal: idSucursal, estado: "todos", limite: 100, pagina },
    });
    items.push(...data);
    if (items.length >= meta.total || data.length === 0) return items;
  }
}

export const listSalones = (idSucursal: number) =>
  listAll<Salon>("/salon/salones", idSucursal);

export const listMesas = (idSucursal: number) =>
  listAll<Mesa>("/salon/mesas", idSucursal);

export const listMesasPorSalon = async (
  idSalon: number,
  signal?: AbortSignal,
): Promise<Mesa[]> => {
  const mesas: Mesa[] = [];
  for (let pagina = 1; ; pagina++) {
    const { data, meta } = await apiGetPaginated<Mesa>("/salon/mesas", {
      params: { id_salon: idSalon, estado: "activos", limite: 100, pagina },
      signal,
    });
    mesas.push(...data);
    if (!data.length || mesas.length >= meta.total) return mesas;
  }
};

/* -------------------------------- Pedidos --------------------------------- */

export const listPedidosEnCurso = async (
  idSucursal: number,
  tiposPedido: readonly number[],
  signal?: AbortSignal,
): Promise<PedidoResumen[]> => {
  const pedidos: PedidoResumen[] = [];
  for (let pagina = 1; ; pagina++) {
    const { data, meta } = await apiGetPaginated<PedidoResumen>("/pedidos", {
      params: { id_sucursal: idSucursal, tipos_pedido: tiposPedido.join(","), en_curso: true, limite: 100, pagina },
      signal,
    });
    pedidos.push(...data);
    if (!data.length || pedidos.length >= meta.total) return pedidos;
  }
};

export const obtenerPedido = (id: number) => apiGet<Pedido>(`/pedidos/${id}`);

export const abrirPedido = (values: AbrirPedidoValues) =>
  apiPost<Pedido>("/pedidos", values);

export const agregarItem = (idPedido: number, values: AgregarItemValues) =>
  apiPost<Pedido>(`/pedidos/${idPedido}/items`, values);

export const editarItem = (
  idPedido: number,
  idItem: number,
  values: { cantidad?: number; observacion?: string },
) => apiPut<Pedido>(`/pedidos/${idPedido}/items/${idItem}`, values);

export const anularItem = (
  idPedido: number,
  idItem: number,
  values: AnularValues,
) =>
  apiDelete<Pedido>(`/pedidos/${idPedido}/items/${idItem}`, { data: values });

export const comandarPedido = (idPedido: number) =>
  apiPost<Pedido>(`/pedidos/${idPedido}/comandar`);

export const cambiarEstadoPedido = (
  idPedido: number,
  values: { estado_pedido: number } & Partial<AnularValues>,
) => apiPut<Pedido>(`/pedidos/${idPedido}/estado`, values);

/** Cancela un pedido abierto que nunca tuvo productos (solo quien lo abrió). */
export const descartarPedido = (idPedido: number) =>
  apiPost<Pedido>(`/pedidos/${idPedido}/descartar`);

export const anularPedido = (idPedido: number, values: AnularValues) =>
  apiPost<Pedido>(`/pedidos/${idPedido}/anular`, values);

/* ------------------------------- Productos -------------------------------- */

async function listCatalogo<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const result: T[] = [];
  for (let pagina = 1; ; pagina++) {
    const { data, meta } = await apiGetPaginated<T>(url, {
      params: { estado: "activos", limite: 100, pagina },
      signal,
    });
    result.push(...data);
    if (!data.length || result.length >= meta.total) return result;
  }
}

export const listProductosParaPedido = async (
  signal?: AbortSignal,
): Promise<ProductoOption[]> =>
  (await listCatalogo<ProductoOption>("/productos", signal)).filter(
    (p) => p.disponible_venta,
  );

/* ---------------------------------- Mozos ---------------------------------- */

export const listMozos = async (
  signal?: AbortSignal,
): Promise<{ id: number; nombre: string }[]> => {
  const data = await listCatalogo<{
    id: number;
    nombres: string;
    apellidos: string;
  }>("/auth/usuarios", signal);
  return (data ?? []).map((u) => ({
    id: u.id,
    nombre: `${u.nombres} ${u.apellidos}`,
  }));
};

/* --------------------------------- Turnos --------------------------------- */

export const getTurnoActivo = async (
  idUsuario: number,
): Promise<{ id: number } | null> => {
  return getTurnoAbierto(idUsuario);
};
