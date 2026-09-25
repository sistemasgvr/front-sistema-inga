"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  getRecetaDetalleApi,
  getHistorialRecetasProductoApi,
  getInsumosProcesadosApi,
  crearRecetaApi,
  guardarInsumoRecetaApi,
  eliminarInsumoRecetaApi,
} from "../services/recetas.service";
import type {
  RecetaItem,
  InsumoProcesadoBusquedaItem,
  GuardarInsumoPayload,
} from "../types/recetas.types";
import type { ProductoItem } from "@/modules/productos/types/productos.types";

export function useRecetas(producto: ProductoItem | null) {
  const { toast } = useToast();

  const [recetaActiva, setRecetaActiva] = useState<RecetaItem | null>(null);
  const [historial, setHistorial] = useState<RecetaItem[]>([]);
  const [insumosBusqueda, setInsumosBusqueda] = useState<InsumoProcesadoBusquedaItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingInsumos, setIsSearchingInsumos] = useState(false);

  const cargarRecetaProducto = useCallback(async () => {
    if (!producto) return;
    setIsLoading(true);
    try {
      const versiones = await getHistorialRecetasProductoApi(producto.id);
      setHistorial(versiones);

      const vigente = versiones.find((v) => Boolean(v.vigente)) ?? versiones[0] ?? null;

      if (vigente) {
        const detalle = await getRecetaDetalleApi(vigente.id);
        setRecetaActiva(detalle);
      } else {
        setRecetaActiva(null);
      }
    } catch (error) {
      toast(
        "error",
        "Error al cargar receta",
        error instanceof Error ? error.message : "No se pudo obtener la receta del producto."
      );
    } finally {
      setIsLoading(false);
    }
  }, [producto, toast]);

  async function buscarInsumos(termino: string) {
    setIsSearchingInsumos(true);
    try {
      const resultados = await getInsumosProcesadosApi(termino);
      setInsumosBusqueda(resultados);
    } catch {
      setInsumosBusqueda([]);
    } finally {
      setIsSearchingInsumos(false);
    }
  }

  async function crearNuevaVersionReceta(nombre?: string, rendimiento: number = 1, observacion?: string) {
    if (!producto) return null;
    setIsSaving(true);
    try {
      const res = await crearRecetaApi(producto.id, {
        nombre: nombre || `Receta - ${producto.nombre}`,
        rendimiento_porciones: rendimiento,
        observacion,
      });

      const idCreado = res?.id || (res as any)?.data?.id;

      if (idCreado) {
        const detalle = await getRecetaDetalleApi(idCreado);
        setRecetaActiva(detalle);
      }

      await cargarRecetaProducto();
      toast("success", "Receta inicializada", "Se creó la nueva versión de la receta.");
      return res;
    } catch (error) {
      toast(
        "error",
        "Error al crear receta",
        error instanceof Error ? error.message : "No se pudo versionar la receta."
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function agregarInsumoAEnlace(payload: GuardarInsumoPayload) {
    if (!recetaActiva) return;
    setIsSaving(true);
    try {
      await guardarInsumoRecetaApi(recetaActiva.id, payload);
      toast("success", "Insumo guardado", "El insumo se registró en la receta.");
      
      const detalleActualizado = await getRecetaDetalleApi(recetaActiva.id);
      setRecetaActiva(detalleActualizado);
    } catch (error) {
      toast(
        "error",
        "Error al guardar insumo",
        error instanceof Error ? error.message : "No se pudo agregar el insumo."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function quitarInsumoDeReceta(idInsumoReceta: number) {
    if (!recetaActiva) return;
    setIsSaving(true);
    try {
      await eliminarInsumoRecetaApi(idInsumoReceta);
      toast("info", "Insumo eliminado", "Se removió el ingrediente de la receta.");

      const detalleActualizado = await getRecetaDetalleApi(recetaActiva.id);
      setRecetaActiva(detalleActualizado);
    } catch (error) {
      toast(
        "error",
        "Error al eliminar insumo",
        error instanceof Error ? error.message : "No se pudo quitar el ingrediente."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return {
    recetaActiva,
    historial,
    insumosBusqueda,
    isLoading,
    isSaving,
    isSearchingInsumos,
    cargarRecetaProducto,
    buscarInsumos,
    crearNuevaVersionReceta,
    agregarInsumoAEnlace,
    quitarInsumoDeReceta,
  };
}