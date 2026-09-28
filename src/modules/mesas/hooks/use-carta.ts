"use client";
import { useEffect, useState } from "react";
import { buscarCarta, listarAdicionalesCarta } from "../services/carta.service";
import type { AdicionalCarta, FiltrosCarta, ProductoOption } from "../types/mesas.types";

const initial: FiltrosCarta = { buscar: "", tipo_producto: "", id_categoria: "", id_subcategoria: "" };

export function useCarta() {
  const [filtros, setFiltros] = useState(initial);
  const [revision, setRevision] = useState(0);
  const [resultado, setResultado] = useState<{ clave: string; productos: ProductoOption[]; error: string | null } | null>(null);
  const clave = JSON.stringify([filtros, revision]);

  useEffect(() => {
    const controller = new AbortController();
    // Agrupa la escritura rápida en el buscador; los filtros sin búsqueda se consultan inmediatamente.
    const timer = setTimeout(() => {
      buscarCarta(filtros, controller.signal).then(productos => {
        if (!controller.signal.aborted) setResultado({ clave, productos, error: null });
      }).catch((error: unknown) => {
        if (!controller.signal.aborted) setResultado({ clave, productos: [], error: error instanceof Error ? error.message : "No se pudo cargar la carta." });
      });
    }, filtros.buscar ? 300 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [filtros, clave]);

  const cambiar = (cambio: Partial<FiltrosCarta>) => {
    setFiltros(previous => ({ ...previous, ...cambio }));
    setRevision(value => value + 1);
  };
  const actual = resultado?.clave === clave ? resultado : null;
  return { filtros, cambiar, productos: actual?.productos ?? [], isLoading: !actual, error: actual?.error, recargar: () => setRevision(value => value + 1) };
}

export function useAdicionalesCarta(id: number | null, revision: number) {
  const clave = `${id}:${revision}`;
  const [resultado, setResultado] = useState<{ clave: string; opciones: AdicionalCarta[]; error: string | null } | null>(null);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    listarAdicionalesCarta(id, controller.signal).then(opciones => {
      if (!controller.signal.aborted) setResultado({ clave, opciones, error: null });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResultado({ clave, opciones: [], error: error instanceof Error ? error.message : "No se pudieron cargar los adicionales." });
    });
    return () => controller.abort();
  }, [id, clave]);
  const actual = resultado?.clave === clave ? resultado : null;
  return { opciones: actual?.opciones ?? [], isLoading: !!id && !actual, error: actual?.error };
}
