"use client";

import { useCallback, useRef, useState } from "react";
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
  FiltroInsumosReceta,
} from "../types/recetas.types";
import type { ProductoItem } from "@/modules/productos/types/productos.types";
import { listTiposProducto } from "@/modules/tipos-producto/services/tipos-producto.service";
import type { TipoProducto } from "@/modules/tipos-producto/types/tipos-producto.types";
import { listCategorias } from "@/modules/productos/categorias/services/categorias.service";
import type { CategoriaItem } from "@/modules/productos/categorias/types/categorias.types";
import { listSubCategorias } from "@/modules/productos/subcategorias/services/subcategorias.service";
import type { SubCategoriaItem } from "@/modules/productos/subcategorias/types/subcategorias.types";

export function useRecetas(producto: ProductoItem | null) {
  const { toast } = useToast();

  // Permite que los manejadores de filtro disparen una búsqueda sin depender de
  // `buscarInsumos`, que se declara más abajo y crearía una referencia circular.
  const buscarInsumosRef = useRef<(f: FiltroInsumosReceta) => void>(() => {});

  // Espejo de los filtros en una ref. Si `buscarInsumos` los leyera del estado
  // directamente, cambiar un filtro le cambiaría la identidad y dispararía el
  // efecto que carga la receta, recargando el modal entero.
  const filtrosRef = useRef<FiltroInsumosReceta>({});

  const [recetaActiva, setRecetaActiva] = useState<RecetaItem | null>(null);
  const [historial, setHistorial] = useState<RecetaItem[]>([]);
  const [insumosBusqueda, setInsumosBusqueda] = useState<InsumoProcesadoBusquedaItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingInsumos, setIsSearchingInsumos] = useState(false);

  // Catálogos de los filtros del selector. Se piden al abrir cada desplegable,
  // no al montar el modal, para no cargar de más lo que nadie llega a usar.
  const [tiposProducto, setTiposProducto] = useState<TipoProducto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [subcategorias, setSubcategorias] = useState<SubCategoriaItem[]>([]);
  const [isLoadingFiltros, setIsLoadingFiltros] = useState(false);
  const [filtrosError, setFiltrosError] = useState<string | null>(null);

  const [filtroTipo, setFiltroTipo] = useState<number | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);
  const [filtroSubcategoria, setFiltroSubcategoria] = useState<number | null>(null);

  // La ref se sincroniza en cada render para que `buscarInsumos` vea el valor
  // vigente sin depender del estado y por tanto sin cambiar de identidad.
  filtrosRef.current = {
    id_tipo_producto: filtroTipo,
    id_categoria: filtroCategoria,
    id_subcategoria: filtroSubcategoria,
  };

  /**
   * Carga los catálogos de los tres desplegables.
   *
   * Se llama al abrir cualquiera de ellos: es la responsabilidad del componente
   * comunicar que se abrió, no del hook adivinarlo.
   */
  const cargarFiltros = useCallback(async () => {
    if (isLoadingFiltros) return;
    setIsLoadingFiltros(true);
    setFiltrosError(null);
    try {
      const [tipos, cats] = await Promise.all([
        listTiposProducto(),
        listCategorias({ pagina: 1, limite: 100, estado: "activos" }),
      ]);
      setTiposProducto(Array.isArray(tipos) ? tipos : []);
      setCategorias(cats.registros ?? []);
    } catch (error) {
      setFiltrosError(
        error instanceof Error ? error.message : "No se pudieron cargar los filtros."
      );
    } finally {
      setIsLoadingFiltros(false);
    }
  }, [isLoadingFiltros]);

  /**
   * Carga las subcategorías de la categoría elegida.
   *
   * Cambiar de categoría vuelve a pedir al backend con la selección actual y
   * limpia la subcategoría: conservar la anterior mostraría datos del contexto
   * previo.
   */
  const cargarSubcategorias = useCallback(async (idCategoria: number | null) => {
    if (!idCategoria) {
      setSubcategorias([]);
      return;
    }
    try {
      const res = await listSubCategorias({
        pagina: 1,
        limite: 100,
        estado: "activos",
        id_categoria: idCategoria,
      });
      setSubcategorias(res.registros ?? []);
    } catch {
      setSubcategorias([]);
    }
  }, []);

  const aplicarFiltroCategoria = useCallback(
    async (idCategoria: number | null) => {
      setFiltroCategoria(idCategoria);
      setFiltroSubcategoria(null);
      await cargarSubcategorias(idCategoria);
      void buscarInsumosRef.current({
        id_categoria: idCategoria,
        id_subcategoria: null,
      });
    },
    [cargarSubcategorias]
  );

  const aplicarFiltroSubcategoria = useCallback((idSubcategoria: number | null) => {
    setFiltroSubcategoria(idSubcategoria);
    void buscarInsumosRef.current({ id_subcategoria: idSubcategoria });
  }, []);

  const aplicarFiltroTipo = useCallback((idTipo: number | null) => {
    setFiltroTipo(idTipo);
    void buscarInsumosRef.current({ id_tipo_producto: idTipo });
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltroTipo(null);
    setFiltroCategoria(null);
    setFiltroSubcategoria(null);
    setSubcategorias([]);
    void buscarInsumosRef.current({});
  }, []);

  const cargarRecetaProducto = useCallback(async () => {
    if (!producto?.id) return;
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
  }, [producto?.id, toast]);

  /**
   * Busca insumos para agregar a la receta.
   *
   * Acepta un objeto de filtros y no solo el texto: el recetario admite insumos
   * crudos y sub-platos, así que tipo, categoría y subcategoría son parte de la
   * búsqueda y no un filtro opcional del cliente.
   */
  const buscarInsumos = useCallback(
    async (filtros: FiltroInsumosReceta | string = {}) => {
      const parcial: FiltroInsumosReceta =
        typeof filtros === "string" ? { busqueda: filtros } : filtros;

      const vigentes = filtrosRef.current;

      // El texto se combina con los filtros ya aplicados: escribirse en el
      // buscador no debe descartar el tipo o la categoría elegidos.
      const normalizado: FiltroInsumosReceta = {
        busqueda: parcial.busqueda,
        id_tipo_producto: parcial.id_tipo_producto ?? vigentes.id_tipo_producto,
        id_categoria: parcial.id_categoria ?? vigentes.id_categoria,
        id_subcategoria: parcial.id_subcategoria ?? vigentes.id_subcategoria,
      };

      setIsSearchingInsumos(true);
      try {
        const resultados = await getInsumosProcesadosApi(normalizado);
        setInsumosBusqueda(resultados);
      } catch {
        setInsumosBusqueda([]);
      } finally {
        setIsSearchingInsumos(false);
      }
    },
    // Sin dependencias a propósito: la identidad estable es lo que evita que el
    // efecto del modal vuelva a pedir la receta al cambiar un filtro.
    []
  );

  buscarInsumosRef.current = buscarInsumos;

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
      toast("success", "Receta actualizada", "Se guardó el ingrediente en la receta.");
      
      const detalleActualizado = await getRecetaDetalleApi(recetaActiva.id);
      setRecetaActiva(detalleActualizado);
    } catch (error) {
      toast(
        "error",
        "Error al guardar insumo",
        error instanceof Error ? error.message : "No se pudo actualizar el insumo."
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
    // Filtros del selector de insumos
    tiposProducto,
    categorias,
    subcategorias,
    isLoadingFiltros,
    filtrosError,
    cargarFiltros,
    filtroTipo,
    filtroCategoria,
    filtroSubcategoria,
    aplicarFiltroTipo,
    aplicarFiltroCategoria,
    aplicarFiltroSubcategoria,
    limpiarFiltros,
  };
}