"use client";

import { useCallback, useEffect } from "react";
import Select, { type SelectProps } from "@/components/form/Select";
import { useLazyOptions } from "@/shared/hooks/use-lazy-options";
import { obtenerOpcionesLista } from "../services/listas.service";
import { opcionesParaSelect } from "../utils/listas.utils";
import type { CampoEtiquetaLista, CampoValorLista } from "../types/listas.types";

type ListaSelectProps = Omit<
  SelectProps,
  "options" | "onOpen" | "isLoading" | "loadError"
> & {
  idLista: number;
  campoValor?: CampoValorLista;
  /** Texto visible de cada opción: `nombre` (por defecto) o `codigo`. */
  campoEtiqueta?: CampoEtiquetaLista;
  /** Si se indica, solo se muestran las opciones con estos códigos. */
  codigos?: readonly string[];
};

export function ListaSelect(props: ListaSelectProps) {
  return (
    <ListaSelectContent
      key={`${props.idLista}:${props.campoValor ?? "valor_entero"}`}
      {...props}
    />
  );
}

function ListaSelectContent({
  idLista,
  campoValor = "valor_entero",
  campoEtiqueta = "nombre",
  codigos,
  ...props
}: ListaSelectProps) {
  const loader = useCallback(
    (signal: AbortSignal) => obtenerOpcionesLista(idLista, signal),
    [idLista],
  );
  const lista = useLazyOptions(loader);
  // Con un valor preseleccionado se cargan las opciones de inmediato para mostrar su etiqueta.
  const tieneValor = !!props.defaultValue;
  const { load } = lista;
  useEffect(() => {
    if (tieneValor) void load();
  }, [tieneValor, load]);
  return (
    <Select
      {...props}
      options={opcionesParaSelect(
        codigos ? lista.options.filter((o) => codigos.includes(o.codigo)) : lista.options,
        campoValor,
        campoEtiqueta,
      )}
      onOpen={() => void lista.load()}
      isLoading={lista.isLoading}
      loadError={lista.error}
    />
  );
}
