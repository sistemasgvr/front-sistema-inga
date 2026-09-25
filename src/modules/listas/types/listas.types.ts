export interface Lista {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface ListaOpcion {
  id: number;
  id_lista: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  valor_entero: number | null;
  orden: number;
}

export interface ListaConOpciones extends Lista {
  opciones: ListaOpcion[];
}

export type ListaReferencia = number;
export type CampoValorLista = "valor_entero" | "codigo" | "id";
export type ListaSelectOption = { value: string; label: string };
