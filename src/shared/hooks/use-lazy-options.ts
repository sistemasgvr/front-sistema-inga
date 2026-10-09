"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Cada apertura consulta de nuevo y descarta respuestas de aperturas anteriores. */
export function useLazyOptions<T>(
  loader: (signal: AbortSignal) => Promise<T[]>,
) {
  const [options, setOptions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      request.current?.abort();
    },
    [loader],
  );

  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setIsLoading(true);
    setOptions([]);
    setError(null);
    try {
      const result = await loader(controller.signal);
      if (!controller.signal.aborted) {
        setOptions(result);
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
