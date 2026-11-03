"use client";

import { useEffect, useRef } from "react";

export const EVENTO_BUSQUEDA = "busqueda-desde-header";

export type DetalleBusqueda = {
  ruta: string;
  termino: string;
};

export function solicitarBusqueda(ruta: string, termino: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<DetalleBusqueda>(EVENTO_BUSQUEDA, {
      detail: { ruta, termino },
    }),
  );
}

export function useBusquedaDesdeUrl(aplicar: (busqueda: string) => void) {
  const aplicado = useRef(false);
  const aplicarRef = useRef(aplicar);

  useEffect(() => {
    aplicarRef.current = aplicar;
  }, [aplicar]);

  useEffect(() => {
    if (aplicado.current) return;
    aplicado.current = true;

    const buscar = new URLSearchParams(window.location.search)
      .get("buscar")
      ?.trim();
    if (!buscar) return;

    aplicarRef.current(buscar);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    const alBuscar = (event: Event) => {
      const detalle = (event as CustomEvent<DetalleBusqueda>).detail;
      if (!detalle?.termino) return;
      if (detalle.ruta !== window.location.pathname) return;
      aplicarRef.current(detalle.termino);
    };

    window.addEventListener(EVENTO_BUSQUEDA, alBuscar);
    return () => window.removeEventListener(EVENTO_BUSQUEDA, alBuscar);
  }, []);
}
