export { LISTA_IDS } from "./constants/lista-ids";
export type { NombreLista } from "./constants/lista-ids";
export {
  listarListas,
  obtenerLista,
  obtenerOpcionesLista,
} from "./services/listas.service";
export { opcionesParaSelect } from "./utils/listas.utils";
export { useLista } from "./hooks/use-lista";
export type {
  Lista,
  ListaConOpciones,
  ListaOpcion,
  ListaReferencia,
  CampoValorLista,
  ListaSelectOption,
} from "./types/listas.types";
