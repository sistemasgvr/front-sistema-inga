import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from "@/shared/api/api-client";
import type {
  GeometriaSalon,
  Mesa,
  MesaForm,
  Salon,
  SalonForm,
  SucursalAmbiente,
} from "../types/ambientes.types";

// El plano necesita todas las zonas: recorrer páginas evita truncar silenciosamente.
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
export const listSucursalesAmbientes = () =>
  apiGet<SucursalAmbiente[]>("/salon/salones/sucursales");
export const listSalones = (id: number) => listAll<Salon>("/salon/salones", id);
export const listMesas = (id: number) => listAll<Mesa>("/salon/mesas", id);
export const saveSalon = (values: SalonForm, id?: number) =>
  id
    ? apiPatch<Salon>(`/salon/salones/${id}`, values)
    : apiPost<Salon>("/salon/salones", values);
export const saveMesa = (values: MesaForm, id?: number) =>
  id
    ? apiPatch<Mesa>(`/salon/mesas/${id}`, values)
    : apiPost<Mesa>("/salon/mesas", values);
export const saveGeometria = (id: number, values: GeometriaSalon) =>
  apiPatch<Salon>(`/salon/salones/${id}`, values);
export function toggleEstado(
  tipo: "salones" | "mesas",
  id: number,
  estado: number,
) {
  return estado === 1
    ? apiDelete(`/salon/${tipo}/${id}`)
    : apiPatch(`/salon/${tipo}/${id}/activar`);
}
