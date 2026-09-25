"use client";

import { useEffect, useState } from "react";
import { getOpcionesCatalogo, type OpcionCatalogo } from "../services/catalogos.service";

export function useCatalogo(codigoLista: string) {
  const [opciones, setOpciones] = useState<OpcionCatalogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const data = await getOpcionesCatalogo(codigoLista);
        if (isMounted) setOpciones(data);
      } catch {
        if (isMounted) setOpciones([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, [codigoLista]);

  return { opciones, isLoading };
}