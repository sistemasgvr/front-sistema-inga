"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe, logout } from "@/modules/auth/services/auth.service";
import { useDebounce } from "@/hooks/useDebounce";
import {
  listProductos,
  createProducto,
  updateProducto,
  toggleDisponibilidadProducto,
  toggleProductoStatus,
  getUnidadesMedida,
} from "../services/productos.service";
import { listSubCategorias } from "../subcategorias/services/subcategorias.service";
import { listAlmacenes } from "@/modules/almacenes/services/almacenes.service";
import { listEstaciones } from "@/modules/estaciones/services/estaciones.service";
import type {
  ProductoItem,
  ProductoFormValues,
  ProductoStatusFilter,
  ProductosResumen,
  UnidadMedidaItem,
  UnidadConversionItem,
} from "../types/productos.types";

const PAGE_SIZE = 10;

export function useProductos() {
  const [registros, setRegistros] = useState<ProductoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] = useState<ProductoStatusFilter>("activos");
  const [tipoFiltro, setTipoFiltro] = useState<number | undefined>(undefined);

  const [resumen, setResumen] = useState<ProductosResumen>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  const [unidades, setUnidades] = useState<UnidadMedidaItem[]>([]);
  const [conversiones, setConversiones] = useState<UnidadConversionItem[]>([]);
  const [subcategorias, setSubcategorias] = useState<any[]>([]);
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [estaciones, setEstaciones] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error" | "info"; title: string; message: string } | null>(null);

  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);

  const [editingProducto, setEditingProducto] = useState<ProductoItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [recetaProducto, setRecetaProducto] = useState<ProductoItem | null>(null);
  const [isRecetaOpen, setIsRecetaOpen] = useState(false);

  const [confirmProducto, setConfirmProducto] = useState<ProductoItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    async function syncSessionUser() {
      const stored = getStoredUserFromStorage();
      if (stored) {
        setCurrentUser(stored);
      }
      try {
        const fresh = await getMe();
        if (fresh) {
          const freshData = fresh as any;
          if ((freshData.estado ?? freshData.sesion?.estado ?? 1) === 0) {
            await logout();
            return;
          }
          setCurrentUser({
            id: freshData.id ?? freshData.sesion?.id_usuario ?? 1,
            username: freshData.username ?? freshData.sesion?.nombre_usuario ?? "",
            es_super_admin: Boolean(freshData.es_super_admin || freshData.sesion?.es_super_admin),
            permisos: freshData.permisos ?? [],
          });
        }
      } catch {
      } finally {
        setHasLoadedSession(true);
      }
    }
    void syncSessionUser();
    void loadCatalogosAuxiliares();
  }, []);

  function getStoredUserFromStorage() {
    try {
      const data = localStorage.getItem("user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async function loadCatalogosAuxiliares() {
    try {
      const [respUnidades, respSub, respAlm, respEst] = await Promise.all([
        getUnidadesMedida(),
        listSubCategorias({ pagina: 1, limite: 100, estado: "activos" }).catch(() => ({ registros: [] })),
        listAlmacenes({ pagina: 1, limite: 100, estado: "activos" }).catch(() => ({ registros: [] })),
        listEstaciones({ pagina: 1, limite: 100, estado: "activos" }).catch(() => ({ registros: [] })),
      ]);

      setUnidades(respUnidades.unidades);
      setConversiones(respUnidades.conversiones);
      setSubcategorias(respSub.registros || []);
      setAlmacenes(respAlm.registros || []);
      setEstaciones(respEst.registros || []);
    } catch {
      // Silencioso o manejo de error opcional
    }
  }

  const loadProductos = useCallback(async () => {
    if (!hasLoadedSession) return;
    setIsLoading(true);
    try {
      const result = await listProductos({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
        tipo_producto: tipoFiltro,
      });
      setRegistros(result.registros);
      setTotal(result.total);
      if (result.resumen) setResumen(result.resumen);
    } catch {
      setFeedback({
        variant: "error",
        title: "Error al cargar",
        message: "No se pudieron obtener los productos.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, tipoFiltro, hasLoadedSession]);

  useEffect(() => {
    void loadProductos();
  }, [loadProductos]);

  function handleFilterStatus(status: ProductoStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  async function openCreateModal() {
    setEditingProducto(null);
    setIsFormOpen(true);
  }

  async function openEditModal(producto: ProductoItem) {
    setEditingProducto(producto);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingProducto(null);
  }

  async function saveProducto(values: ProductoFormValues) {
    setIsSaving(true);
    try {
      if (editingProducto) {
        await updateProducto(editingProducto.id, values);
        setFeedback({ variant: "success", title: "Actualizado", message: `Producto '${values.nombre}' actualizado con éxito.` });
      } else {
        await createProducto(values);
        setFeedback({ variant: "success", title: "Registrado", message: `Producto '${values.nombre}' creado con éxito.` });
        setPagina(1);
      }
      closeFormModal();
      await loadProductos();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error al guardar",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleDisponibilidad(id: number) {
    try {
      await toggleDisponibilidadProducto(id);
      await loadProductos();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "No se pudo cambiar la disponibilidad.",
      });
    }
  }

  function openConfirmModal(producto: ProductoItem) {
    setConfirmProducto(producto);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    setIsConfirmOpen(false);
    setConfirmProducto(null);
  }

  async function confirmToggleStatus() {
    if (!confirmProducto) return;
    setIsToggling(true);
    try {
      await toggleProductoStatus(confirmProducto);
      closeConfirmModal();
      await loadProductos();
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Error al cambiar estado.",
      });
    } finally {
      setIsToggling(false);
    }
  }

  function openRecetasModal(producto: ProductoItem) {
    setRecetaProducto(producto);
    setIsRecetaOpen(true);
  }

  function closeRecetasModal() {
    setIsRecetaOpen(false);
    setRecetaProducto(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    registros,
    total,
    pagina,
    setPagina,
    pageSize,
    setPageSize: (size: number) => { setPageSize(size); setPagina(1); },
    totalPages,
    searchInput,
    setSearchInput,
    estadoFiltro,
    handleFilterStatus,
    tipoFiltro,
    setTipoFiltro,
    resumen,
    unidades,
    conversiones,
    subcategorias,
    almacenes,
    estaciones,
    isLoading,
    isSaving,
    feedback,
    clearFeedback: () => setFeedback(null),
    currentUser,
    editingProducto,
    isFormOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveProducto,
    handleToggleDisponibilidad,
    recetaProducto,
    isRecetaOpen,
    openRecetasModal,
    closeRecetasModal,
    confirmProducto,
    isConfirmOpen,
    isToggling,
    openConfirmModal,
    closeConfirmModal,
    confirmToggleStatus,
  };
}