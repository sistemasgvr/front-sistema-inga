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
  const opciones = await obtenerOpcionesLista(codigoLista);
  return opciones.flatMap((opcion) =>
    opcion.valor_entero === null
      ? []
      : [{ ...opcion, valor_entero: opcion.valor_entero }],
  );
}
