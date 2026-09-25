"use client";

import { useCallback, useEffect, useState } from "react";
import { obtenerLista } from "../services/listas.service";
import { opcionesParaSelect } from "../utils/listas.utils";
import type {
  CampoValorLista,
  ListaConOpciones,
  ListaReferencia,
} from "../types/listas.types";

type Resultado = {
  clave: string;
  revision: number;
  lista: ListaConOpciones | null;
  error: string | null;
};

/** Hook de datos sin UI: cada vista reutiliza su propio Select y mensajes. */
export function useLista(
  referencia: ListaReferencia,
  {
    enabled = true,
    campoValor = "valor_entero",
  }: { enabled?: boolean; campoValor?: CampoValorLista } = {},
) {
  const [revision, setRevision] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const clave = `${typeof referencia}:${referencia}`;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    obtenerLista(referencia, controller.signal)
      .then((lista) => {
        if (!controller.signal.aborted)
          setResultado({ clave, revision, lista, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setResultado({
            clave,
            revision,
            lista: null,
            error:
              error instanceof Error
                ? error.message
                : "No se pudo cargar la lista.",
          });
      });
    return () => controller.abort();
  }, [referencia, clave, revision, enabled]);

  const actual =
    enabled && resultado?.clave === clave && resultado.revision === revision
      ? resultado
      : null;
  const opciones = actual?.lista?.opciones ?? [];
  const recargar = useCallback(() => setRevision((value) => value + 1), []);
  return {
    lista: actual?.lista ?? null,
    opciones,
    selectOptions: opcionesParaSelect(opciones, campoValor),
    isLoading: enabled && actual === null,
    error: actual?.error ?? null,
    recargar,
  };
}
