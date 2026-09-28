"use client";
import { useEffect, useState } from "react";
import { buscarPersonas, type PersonaBusquedaItem } from "@/modules/personas";

const MIN_CARACTERES = 2;
const ESPERA_MS = 300;

type Resultado = { consulta: string; items: PersonaBusquedaItem[]; error: string | null };

/**
 * Busca clientes en /personas/buscar mientras se escribe. Cada cambio del texto
 * consulta al backend (con una breve espera) y cancela la consulta anterior.
 * Solo se muestran resultados que correspondan al texto actual.
 */
export function useBuscarClientes(texto: string) {
  const consulta = texto.trim();
  const [resultado, setResultado] = useState<Resultado>({ consulta: "", items: [], error: null });

  useEffect(() => {
    if (consulta.length < MIN_CARACTERES) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      buscarPersonas(consulta, "clientes", 8, controller.signal)
        .then((items) => {
          if (!controller.signal.aborted) setResultado({ consulta, items, error: null });
        })
        .catch((e: unknown) => {
          if (controller.signal.aborted) return;
          setResultado({
            consulta,
            items: [],
            error: e instanceof Error ? e.message : "No se pudo buscar clientes.",
          });
        });
    }, ESPERA_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [consulta]);

  const activa = consulta.length >= MIN_CARACTERES;
  const vigente = activa && resultado.consulta === consulta;
  return {
    activa,
    isLoading: activa && !vigente,
    clientes: vigente ? resultado.items : [],
    error: vigente ? resultado.error : null,
  };
}
