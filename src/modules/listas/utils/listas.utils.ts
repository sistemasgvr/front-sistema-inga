import type {
  CampoValorLista,
  ListaOpcion,
  ListaSelectOption,
} from "../types/listas.types";

/**
 * Las columnas tipo_* / estado_* usan valor_entero, no el ID de gen_lista_opcion.
 * Para catálogos de texto se puede elegir "codigo"; para una FK real, "id".
 * Nunca convierte null en "0" ni reemplaza el valor faltante por otro identificador.
 */
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
