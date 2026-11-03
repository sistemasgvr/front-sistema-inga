"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { consultarDocumento } from "../services/personas.service";
import type { ConsultaDocumento } from "../types/personas.types";

/** DNI de 8 dígitos o RUC de 11. */
export const esDocumentoConsultable = (numero: string) => /^(\d{8}|\d{11})$/.test(numero);

type Estado = {
  numero: string;
  resultado: ConsultaDocumento | null;
  error: string | null;
  cargando: boolean;
};

const INICIAL: Estado = { numero: "", resultado: null, error: null, cargando: false };

/**
 * Consulta de DNI / RUC (cliente registrado o RENIEC / SUNAT). Cada consulta es
 * una petición nueva; si llega otra antes de responder, la anterior se cancela
 * y su respuesta no se muestra.
 */
export function useConsultaDocumento() {
  const [estado, setEstado] = useState<Estado>(INICIAL);
  const peticion = useRef<AbortController | null>(null);

  const limpiar = useCallback(() => {
    peticion.current?.abort();
    setEstado(INICIAL);
  }, []);

  const consultar = useCallback(async (numero: string): Promise<ConsultaDocumento | null> => {
    peticion.current?.abort();
    if (!esDocumentoConsultable(numero)) {
      setEstado(INICIAL);
      return null;
    }
    const controller = new AbortController();
    peticion.current = controller;
    setEstado({ numero, resultado: null, error: null, cargando: true });
    try {
      const resultado = await consultarDocumento(numero, controller.signal);
      if (controller.signal.aborted) return null;
      setEstado({ numero, resultado, error: null, cargando: false });
      return resultado;
    } catch (e) {
      if (controller.signal.aborted) return null;
      setEstado({
        numero,
        resultado: null,
        error: e instanceof Error ? e.message : "No se pudo consultar el documento.",
        cargando: false,
      });
      return null;
    }
  }, []);

  useEffect(() => () => peticion.current?.abort(), []);

  return { ...estado, consultar, limpiar };
}
