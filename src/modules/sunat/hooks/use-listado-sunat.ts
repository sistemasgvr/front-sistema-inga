"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Resultado<T> = { registros: T[]; total: number };

/**
 * Listado paginado con filtros remotos: cada cambio de filtro o página consulta al
 * backend y la respuesta anterior se descarta si llega tarde.
 */
export function useListadoSunat<T, F extends object>(
  cargar: (params: F & { pagina: number; limite: number }, signal: AbortSignal) => Promise<Resultado<T>>,
  filtrosIniciales: F,
  limite = 10,
) {
  const [filtros, setFiltros] = useState<F>(filtrosIniciales);
  const [pagina, setPagina] = useState(1);
  const [revision, setRevision] = useState(0);
  const [respuesta, setRespuesta] = useState<{ clave: string; datos: Resultado<T> | null; error: string | null } | null>(null);

  const consulta = useMemo(() => ({ ...filtros, pagina, limite }), [filtros, pagina, limite]);
  const clave = `${JSON.stringify(consulta)}#${revision}`;

  useEffect(() => {
    const controller = new AbortController();
    cargar(consulta, controller.signal)
      .then((datos) => { if (!controller.signal.aborted) setRespuesta({ clave, datos, error: null }); })
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setRespuesta({ clave, datos: null, error: e instanceof Error ? e.message : "No se pudo cargar el listado." });
      });
    return () => controller.abort();
  }, [cargar, consulta, clave]);

  const cambiarFiltro = useCallback(<K extends keyof F>(campo: K, valor: F[K]) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPagina(1);
  }, []);

  const recargar = useCallback(() => setRevision((r) => r + 1), []);
  const actual = respuesta?.clave === clave ? respuesta : null;
  const total = actual?.datos?.total ?? 0;

  return {
    filtros,
    cambiarFiltro,
    pagina,
    setPagina,
    limite,
    registros: actual?.datos?.registros ?? [],
    total,
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
    cargando: !actual,
    error: actual?.error ?? null,
    recargar,
  };
}
