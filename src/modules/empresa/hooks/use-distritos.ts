"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { buscarDistritos } from "../services/empresa.service";
import type { Distrito } from "../types/empresa.types";

/**
 * Búsqueda remota de distritos: cada término consulta al backend y la respuesta
 * anterior se descarta (AbortController) si el usuario sigue escribiendo.
 */
export function useDistritos(abierto: boolean) {
  const [termino, setTermino] = useState("");
  const buscar = useDebounce(termino, 300);
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    const controller = new AbortController();
    queueMicrotask(() => { setCargando(true); setError(null); });
    buscarDistritos(buscar, controller.signal)
      .then((lista) => { if (!controller.signal.aborted) setDistritos(lista); })
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "No se pudieron cargar los distritos.");
      })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [abierto, buscar]);

  return { distritos, cargando, error, setTermino };
}
