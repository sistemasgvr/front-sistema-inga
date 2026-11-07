"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  getImpactoTipoProducto,
  updatePermisosTipoProducto,
} from "../services/tipos-producto.service";
import type {
  PermisosTipoProducto,
  TipoProducto,
} from "../types/tipos-producto.types";
import {
  avisosImpacto,
  cambiarPermiso,
  extraerPermisos,
  hayCambios,
  type PermisoTipoClave,
} from "../utils/tipo-permisos";
import { useTiposProducto } from "./use-tipos-producto";

type Permisos = Record<number, PermisosTipoProducto>;
interface CambioPendiente {
  tipo: TipoProducto;
  permisos: PermisosTipoProducto;
  avisos: string[];
}

function mensajeError(cause: unknown) {
  return cause instanceof Error ? cause.message : "No se pudieron guardar los permisos.";
}

export function useTiposPermisos(onUpdated: () => void) {
  const catalogo = useTiposProducto();
  const { toast } = useToast();
  const [guardados, setGuardados] = useState<Permisos>({});
  const [borradores, setBorradores] = useState<Permisos>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<CambioPendiente | null>(null);

  const nodos = catalogo.options.map((tipo) => {
    const original = guardados[tipo.id] ?? extraerPermisos(tipo);
    const actual = borradores[tipo.id] ?? original;
    return { tipo, original, actual, modificado: hayCambios(original, actual) };
  });
  const hayBorradores = nodos.some((nodo) => nodo.modificado);

  function cambiar(tipo: TipoProducto, clave: PermisoTipoClave, activo: boolean) {
    const nodo = nodos.find((item) => item.tipo.id === tipo.id);
    if (!nodo) return;
    setBorradores((actuales) => ({
      ...actuales,
      [tipo.id]: cambiarPermiso(nodo.actual, clave, activo),
    }));
  }

  async function persistir(tipo: TipoProducto, permisos: PermisosTipoProducto) {
    const actualizado = await updatePermisosTipoProducto(tipo.id, permisos);
    setGuardados((actuales) => ({ ...actuales, [tipo.id]: extraerPermisos(actualizado) }));
    setBorradores((actuales) => {
      const resto = { ...actuales };
      delete resto[tipo.id];
      return resto;
    });
    toast("success", "Permisos actualizados", `Se guardó el tipo ${tipo.nombre}.`);
    onUpdated();
  }

  async function guardar(tipo: TipoProducto) {
    const nodo = nodos.find((item) => item.tipo.id === tipo.id);
    if (!nodo || savingId !== null) return;
    setSavingId(tipo.id);
    setError(null);
    try {
      const impacto = await getImpactoTipoProducto(tipo.id);
      const avisos = avisosImpacto(nodo.original, nodo.actual, impacto);
      if (avisos.length > 0) setPendiente({ tipo, permisos: nodo.actual, avisos });
      else await persistir(tipo, nodo.actual);
    } catch (cause) {
      setError(mensajeError(cause));
    } finally {
      setSavingId(null);
    }
  }

  async function confirmarPendiente() {
    if (!pendiente) return;
    setSavingId(pendiente.tipo.id);
    setError(null);
    try {
      await persistir(pendiente.tipo, pendiente.permisos);
    } catch (cause) {
      setError(mensajeError(cause));
    } finally {
      setPendiente(null);
      setSavingId(null);
    }
  }

  return {
    nodos,
    isLoading: catalogo.isLoading,
    loadError: catalogo.error,
    recargar: catalogo.load,
    cambiar,
    guardar,
    savingId,
    error,
    pendiente,
    confirmarPendiente,
    cancelarPendiente: () => setPendiente(null),
    hayBorradores,
  };
}
