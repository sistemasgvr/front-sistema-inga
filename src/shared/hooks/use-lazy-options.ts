"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Carga al abrir un selector, conserva el resultado durante su montaje y permite reintentar. */
export function useLazyOptions<T>(
  loader: (signal: AbortSignal) => Promise<T[]>,
) {
  const [options, setOptions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);
  const request = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );

  const load = useCallback(async () => {
    if (loaded.current || (request.current && !request.current.signal.aborted))
      return;
    const controller = new AbortController();
    request.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const result = await loader(controller.signal);
      if (!controller.signal.aborted) {
        setOptions(result);
        loaded.current = true;
      }
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar las opciones.",
        );
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
      if (request.current === controller) request.current = null;
    }
  }, [loader]);

  return { options, isLoading, error, load };
}
