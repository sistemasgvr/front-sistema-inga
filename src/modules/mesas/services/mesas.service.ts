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
  ProductoOption,
  AbrirPedidoValues,
  AgregarItemValues,
  AnularValues,
} from "../types/mesas.types";

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
): Promise<Mesa[]> => {
  const { data, meta } = await apiGetPaginated<Mesa>("/salon/mesas", {
    params: { id_salon: idSalon, estado: "todos", limite: 100, pagina: 1 },
  });
  return data ?? [];
};

/* -------------------------------- Pedidos --------------------------------- */

export const obtenerPedido = (id: number) =>
  apiGet<Pedido>(`/pedidos/${id}`);

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
) => apiDelete<Pedido>(`/pedidos/${idPedido}/items/${idItem}`, { data: values });

export const comandarPedido = (idPedido: number) =>
  apiPost<Pedido>(`/pedidos/${idPedido}/comandar`);

export const cambiarEstadoPedido = (
  idPedido: number,
  values: { estado_pedido: number } & Partial<AnularValues>,
) => apiPut<Pedido>(`/pedidos/${idPedido}/estado`, values);

export const anularPedido = (idPedido: number, values: AnularValues) =>
  apiPost<Pedido>(`/pedidos/${idPedido}/anular`, values);

/* ------------------------------- Productos -------------------------------- */

export const listProductosParaPedido = async (): Promise<ProductoOption[]> => {
  const { data } = await apiGetPaginated<ProductoOption>("/productos", {
    params: {
      estado: "activos",
      limite: 500,
      pagina: 1,
    },
  });
  return data ?? [];
};

/* ---------------------------------- Mozos ---------------------------------- */

export const listMozos = async (): Promise<
  { id: number; nombre: string }[]
> => {
  const { data } = await apiGetPaginated<{
    id: number;
    nombres: string;
    apellidos: string;
  }>("/auth/usuarios", {
    params: {
      limite: 100,
      pagina: 1,
      estado: "activos",
    },
  });
  return (data ?? []).map((u) => ({
    id: u.id,
    nombre: `${u.nombres} ${u.apellidos}`,
  }));
};

/* --------------------------------- Turnos --------------------------------- */

export const getTurnoActivo = async (
  idUsuario: number,
): Promise<{ id: number } | null> => {
  try {
    const response = await apiGet<{ registro: { id: number } | null }>(
      `/caja/turnos/abierto/${idUsuario}`,
    );
    return response?.registro ?? null;
  } catch {
    return null;
  }
};
