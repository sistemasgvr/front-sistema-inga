import type {
  CampoValorLista,
  ListaOpcion,
  ListaSelectOption,
} from "../types/listas.types";

export function opcionesParaSelect(
  opciones: readonly ListaOpcion[],
  campo: CampoValorLista = "valor_entero",
): ListaSelectOption[] {
  return opciones.flatMap((opcion) => {
    const value = opcion[campo];
    return value === null || value === undefined
      ? []
      : [{ value: String(value), label: opcion.nombre }];
  });
}
