import { LISTA_IDS } from "@/modules/listas/constants/lista-ids";
import { obtenerOpcionesLista } from "@/modules/listas/services/listas.service";

export type OpcionCatalogo = {
  id: number;
  codigo: string;
  nombre: string;
  valor_entero: number;
  orden: number;
};

export async function getOpcionesCatalogo(
  codigoLista: string,
): Promise<OpcionCatalogo[]> {
  const id = LISTA_IDS[codigoLista as keyof typeof LISTA_IDS];
  if (!id)
    throw new Error(
      `Configura el ID de la lista ${codigoLista} en lista-ids.ts.`,
    );
  const opciones = await obtenerOpcionesLista(id);
  return opciones.flatMap((opcion) =>
    opcion.valor_entero === null
      ? []
      : [{ ...opcion, valor_entero: opcion.valor_entero }],
  );
}
