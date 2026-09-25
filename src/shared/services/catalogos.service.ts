import { apiGet } from "@/shared/api/api-client";

export type OpcionCatalogo = {
  id: number;
  codigo: string;
  nombre: string;
  valor_entero: number;
  orden: number;
};

export async function getOpcionesCatalogo(codigoLista: string): Promise<OpcionCatalogo[]> {
  const response = await apiGet<OpcionCatalogo[]>(`/general/listas/${codigoLista}/opciones`);
  return response || [];
}