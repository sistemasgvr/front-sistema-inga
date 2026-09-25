"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe, getStoredUser, logout } from "@/modules/auth/services/auth.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/components/ui/toast/ToastContext";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import {
  listProductos,
  createProducto,
  updateProducto,
  toggleDisponibilidadProducto,
  toggleProductoStatus,
  getUnidadesMedida,
} from "../services/productos.service";
import { listCategorias } from "../categorias/services/categorias.service";
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
import type { User } from "@/modules/users/types/user.types";

const PAGE_SIZE = 10;

export function useProductos() {
  const { toast } = useToast();

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
  const [categorias, setCategorias] = useState<any[]>([]);
  const [subcategorias, setSubcategorias] = useState<any[]>([]);
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [estaciones, setEstaciones] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingProductoId, setLoadingProductoId] = useState<number | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);

  const [editingProducto, setEditingProducto] = useState<ProductoItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [recetaProducto, setRecetaProducto] = useState<ProductoItem | null>(null);
  const [isRecetaOpen, setIsRecetaOpen] = useState(false);

  const [confirmProducto, setConfirmProducto] = useState<ProductoItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncSessionUser() {
      const stored = getStoredUser();
      if (stored && isMounted) {
        const storedAny = stored as any;
        const isSuperStored = Boolean(storedAny.es_super_admin || storedAny.sesion?.es_super_admin);
        const permisosStored: string[] = storedAny.permisos ?? storedAny.sesion?.permisos ?? [];

        setCurrentUser({
          id: stored.id,
          username: stored.username,
          email: stored.email,
          nombres: stored.nombres ?? "",
          apellidos: stored.apellidos ?? "",
          telefono: stored.telefono ?? null,
          id_sucursal_default: stored.id_sucursal_default ?? null,
          es_super_admin: isSuperStored,
          permisos: permisosStored,
          estado: storedAny.estado ?? storedAny.sesion?.estado ?? 1,
          fecha_creacion: storedAny.fecha_creacion ?? "",
        });
      }

      try {
        const fresh = await getMe();
        if (fresh && isMounted) {
          const freshData = fresh as any;
          const userEstado = freshData.estado ?? freshData.sesion?.estado ?? 1;

          if (userEstado === 0) {
            await logout();
            return;
          }

          const isSuper = Boolean(
            freshData.es_super_admin || 
            freshData.esSuperAdmin || 
            freshData.sesion?.es_super_admin
          );

          const permisosBackend: string[] = freshData.permisos ?? freshData.sesion?.permisos ?? [];

          setCurrentUser({
            id: freshData.id ?? freshData.sesion?.id_usuario ?? 1,
            username: freshData.username ?? freshData.sesion?.nombre_usuario ?? "",
            email: freshData.email ?? freshData.sesion?.correo ?? "",
            nombres: freshData.nombres ?? freshData.sesion?.nombres ?? "",
            apellidos: freshData.apellidos ?? freshData.sesion?.apellidos ?? "",
            telefono: freshData.telefono ?? null,
            id_sucursal_default: freshData.id_sucursal_default ?? null,
            es_super_admin: isSuper,
            permisos: permisosBackend,
            estado: userEstado,
            fecha_creacion: freshData.fecha_creacion ?? "",
          });
        } else if (!fresh && isMounted) {
          await logout();
        }
      } catch {
      } finally {
        if (isMounted) {
          setHasLoadedSession(true);
        }
      }
    }

    void syncSessionUser();
    void loadCatalogosAuxiliares();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadCatalogosAuxiliares = useCallback(async () => {
    try {
      const [respUnidades, respCat, respSub, respAlm, respEst] = await Promise.all([
        getUnidadesMedida().catch(() => ({ unidades: [], conversiones: [] })),
        listCategorias({ pagina: 1, limite: 100, estado: "activos" }).catch(() => ({ registros: [] })),
        listSubCategorias({ pagina: 1, limite: 100, estado: "activos" }).catch(() => ({ registros: [] })),
        listAlmacenes({ pagina: 1, limite: 100, estado: "activos" }).catch(() => ({ registros: [] })),
        listEstaciones({ pagina: 1, limite: 100, estado: "activos" }).catch(() => ({ registros: [] })),
      ]);

      setUnidades(respUnidades.unidades ?? []);
      setConversiones(respUnidades.conversiones ?? []);
      setCategorias(respCat.registros ?? []);
      setSubcategorias(respSub.registros ?? []);
      setAlmacenes(respAlm.registros ?? []);
      setEstaciones(respEst.registros ?? []);
    } catch {
    }
  }, []);

  const loadProductos = useCallback(async () => {
    if (!hasLoadedSession) return;

    const isSuper = Boolean(currentUser?.es_super_admin || currentUser?.sesion?.es_super_admin);
    const userPermisos = currentUser?.permisos ?? currentUser?.sesion?.permisos ?? [];
    const hasListPermission = isSuper || userPermisos.includes(PermisoBanderas.PRODUCTOS_LISTAR);

    if (currentUser && !hasListPermission) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await listProductos({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
        tipo_producto: tipoFiltro,
      });
      setRegistros(result.registros ?? []);
      setTotal(result.total ?? 0);
      if (result.resumen) setResumen(result.resumen);
    } catch (error) {
      toast("error", "Error de carga", error instanceof Error ? error.message : "No se pudieron obtener los productos.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, tipoFiltro, hasLoadedSession, currentUser, toast]);

  useEffect(() => {
    void loadProductos();
  }, [loadProductos]);

  useEffect(() => {
    setPagina(1);
  }, [debouncedSearch]);

  function handleFilterStatus(status: ProductoStatusFilter) {
    setEstadoFiltro(status);
    setPagina(1);
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setPagina(1);
  }

  async function verifyActionAccess(requiredPermission?: string): Promise<boolean> {
    try {
      const fresh = await getMe();
      const freshData = fresh as any;
      const userEstado = freshData?.estado ?? freshData?.sesion?.estado ?? 1;

      if (!fresh || userEstado === 0) {
        toast("error", "Acceso denegado", "Tu usuario ha sido inactivado o tu sesión ya no es válida.");
        await logout();
        return false;
      }

      const isSuper = Boolean(
        freshData.es_super_admin || 
        freshData.esSuperAdmin || 
        freshData.sesion?.es_super_admin
      );

      if (isSuper) return true;

      if (requiredPermission) {
        const permisosBackend: string[] = freshData.permisos ?? freshData.sesion?.permisos ?? [];
        if (!permisosBackend.includes(requiredPermission)) {
          toast("error", "Permiso denegado", "No cuentas con el permiso necesario para realizar esta acción.");
          return false;
        }
      }

      return true;
    } catch {
      toast("error", "Atención", "No se pudo verificar el permiso en el servidor.");
      return false;
    }
  }

  async function openCreateModal() {
    if (isFormOpen) return;

    const isValid = await verifyActionAccess(PermisoBanderas.PRODUCTOS_CREAR);
    if (!isValid) return;

    setEditingProducto(null);
    await loadCatalogosAuxiliares();
    setIsFormOpen(true);
  }

  async function openEditModal(producto: ProductoItem) {
    if (isFormOpen || loadingProductoId !== null) return;
    setLoadingProductoId(producto.id);

    const isValid = await verifyActionAccess(PermisoBanderas.PRODUCTOS_EDITAR);
    if (!isValid) {
      setLoadingProductoId(null);
      return;
    }

    setEditingProducto(producto);
    await loadCatalogosAuxiliares();
    setIsFormOpen(true);
    setLoadingProductoId(null);
  }

  function closeFormModal() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingProducto(null);
  }

  async function saveProducto(values: ProductoFormValues) {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const permissionNeeded = editingProducto ? PermisoBanderas.PRODUCTOS_EDITAR : PermisoBanderas.PRODUCTOS_CREAR;
      const isValid = await verifyActionAccess(permissionNeeded);
      if (!isValid) return;

      if (editingProducto) {
        await updateProducto(editingProducto.id, values);
        toast("success", "Producto actualizado", `'${values.nombre}' fue actualizado correctamente.`);
      } else {
        await createProducto(values);
        toast("success", "Producto registrado", `'${values.nombre}' fue creado exitosamente.`);
        setPagina(1);
      }

      closeFormModal();
      await loadProductos();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo procesar la solicitud.";
      toast("error", "Atención", message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleDisponibilidad(id: number) {
    const isValid = await verifyActionAccess(PermisoBanderas.PRODUCTOS_EDITAR);
    if (!isValid) return;

    try {
      await toggleDisponibilidadProducto(id);
      toast("info", "Disponibilidad actualizada", "Se modificó la disponibilidad en la carta.");
      await loadProductos();
    } catch (error) {
      toast("error", "Atención", error instanceof Error ? error.message : "No se pudo cambiar la disponibilidad.");
    }
  }

  async function openConfirmModal(producto: ProductoItem) {
    if (isConfirmOpen || loadingProductoId !== null) return;
    setLoadingProductoId(producto.id);

    const isActivo = producto.estado === 1;
    const requiredPermission = isActivo ? PermisoBanderas.PRODUCTOS_ELIMINAR : PermisoBanderas.PRODUCTOS_ACTIVAR;

    const isValid = await verifyActionAccess(requiredPermission);
    if (isValid) {
      setConfirmProducto(producto);
      setIsConfirmOpen(true);
    }
    setLoadingProductoId(null);
  }

  function closeConfirmModal() {
    if (isToggling) return;
    setIsConfirmOpen(false);
    setConfirmProducto(null);
  }

  async function confirmToggleStatus() {
    if (!confirmProducto || isToggling) return;
    setIsToggling(true);

    try {
      const isActivo = confirmProducto.estado === 1;
      const requiredPermission = isActivo ? PermisoBanderas.PRODUCTOS_ELIMINAR : PermisoBanderas.PRODUCTOS_ACTIVAR;

      const isValid = await verifyActionAccess(requiredPermission);
      if (!isValid) return;

      await toggleProductoStatus(confirmProducto);
      const accion = isActivo ? "dado de baja" : "activado";
      toast("info", "Estado actualizado", `El producto '${confirmProducto.nombre}' ha sido ${accion}.`);
      closeConfirmModal();
      await loadProductos();
    } catch (error) {
      toast("error", "Error al cambiar estado", error instanceof Error ? error.message : "Error inesperado.");
    } finally {
      setIsToggling(false);
    }
  }

  async function openRecetasModal(producto: ProductoItem) {
    const isValid = await verifyActionAccess(PermisoBanderas.PRODUCTOS_VER);
    if (!isValid) return;

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
    setPageSize: handlePageSizeChange,
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
    categorias,
    subcategorias,
    almacenes,
    estaciones,
    isLoading,
    isSaving,
    loadingProductoId,

    currentUser,
    hasLoadedSession,

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