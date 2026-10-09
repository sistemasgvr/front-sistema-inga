"use client";
import { useLazyOptions } from "@/shared/hooks/use-lazy-options";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMe, getStoredUser, logout } from "@/modules/auth/services/auth.service";
import { listAlmacenes } from "@/modules/almacenes/services/almacenes.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/components/ui/toast/ToastContext";
import { PermisoBanderas } from "@/shared/constants/permiso-banderas";
import { listStock, registrarAjusteStock } from "../services/inventario.service";
import type {
  StockItem,
  StockStatusFilter,
  StockResumen,
  RegistrarMovimientoValues,
} from "../types/inventario.types";
import type { User } from "@/modules/users/types/user.types";

const PAGE_SIZE = 10;

export function useStock() {
  const { toast } = useToast();

  const [registros, setRegistros] = useState<StockItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [estadoFiltro, setEstadoFiltro] = useState<StockStatusFilter>("todos");
  const [selectedAlmacenId, setSelectedAlmacenId] = useState<number | undefined>(undefined);

  const [resumen, setResumen] = useState<StockResumen>({ total: 0, alertas: 0, normales: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const almacenes=useLazyOptions(useCallback(async()=> (await listAlmacenes({pagina:1,limite:100,estado:'activos'})).registros??[],[]));
  const request=useRef<AbortController|null>(null);
  const [revision,setRevision]=useState(0);

  const [adjustingStockItem, setAdjustingStockItem] = useState<StockItem | null>(null);
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);

  useEffect(() => {
    async function syncSessionUser() {
      const stored = getStoredUser();
      if (stored) {
        const storedAny = stored as any;
        setCurrentUser({
          id: stored.id,
          username: stored.username,
          email: stored.email,
          nombres: stored.nombres,
          apellidos: stored.apellidos,
          telefono: stored.telefono ?? null,
          id_sucursal_default: stored.id_sucursal_default ?? null,
          es_super_admin: Boolean(storedAny.es_super_admin || storedAny.sesion?.es_super_admin),
          permisos: storedAny.permisos ?? storedAny.sesion?.permisos ?? [],
          estado: storedAny.estado ?? 1,
          fecha_creacion: storedAny.fecha_creacion ?? "",
        });
      }

      try {
        const fresh = await getMe();
        if (fresh) {
          const freshData = fresh as any;
          if ((freshData.estado ?? 1) === 0) {
            await logout();
            return;
          }

          setCurrentUser({
            id: freshData.id ?? 1,
            username: freshData.username ?? "",
            email: freshData.email ?? "",
            nombres: freshData.nombres ?? "",
            apellidos: freshData.apellidos ?? "",
            telefono: freshData.telefono ?? null,
            id_sucursal_default: freshData.id_sucursal_default ?? null,
            es_super_admin: Boolean(freshData.es_super_admin || freshData.esSuperAdmin),
            permisos: freshData.permisos ?? [],
            estado: freshData.estado ?? 1,
            fecha_creacion: freshData.fecha_creacion ?? "",
          });
        }
      } catch {}
    }

    void syncSessionUser();
  }, []);


  const loadStockData = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setIsLoading(true);
    try {
      const response = await listStock({
        buscar: debouncedSearch.trim(),
        pagina,
        limite: pageSize,
        estado: estadoFiltro,
        id_almacen: selectedAlmacenId,
      }, controller.signal);
      if(controller.signal.aborted)return;

      setRegistros(response.registros ?? []);
      setTotal(response.total ?? 0);
      if (response.resumen) setResumen(response.resumen);
    } catch (error) {
      if(controller.signal.aborted)return;
      toast("error", "Error de carga", error instanceof Error ? error.message : "Error al obtener stock.");
    } finally {
      if(!controller.signal.aborted)setIsLoading(false);
    }
  }, [debouncedSearch, pagina, pageSize, estadoFiltro, selectedAlmacenId, toast, revision]);

  useEffect(() => {
    void loadStockData();
    return ()=>request.current?.abort();
  }, [loadStockData]);

  useEffect(() => {
    setPagina(1);
  }, [debouncedSearch, selectedAlmacenId]);

  function openAjusteModal(item: StockItem) {
    const isSuper = Boolean(currentUser?.es_super_admin);
    const userPermisos = currentUser?.permisos ?? [];

    if (!isSuper && !userPermisos.includes(PermisoBanderas.INVENTARIO_GESTIONAR)) {
      toast("error", "Permiso denegado", "No cuentas con el permiso para realizar ajustes de stock.");
      return;
    }

    setAdjustingStockItem(item);
    setIsAjusteModalOpen(true);
  }

  function closeAjusteModal() {
    if (isSaving) return;
    setIsAjusteModalOpen(false);
    setAdjustingStockItem(null);
  }

  async function saveAjuste(values: RegistrarMovimientoValues) {
    if (isSaving) return;
    setIsSaving(true);

    try {
      await registrarAjusteStock(values);
      toast("success", "Ajuste registrado", "El movimiento de inventario fue guardado exitosamente.");
      setIsAjusteModalOpen(false);
      setAdjustingStockItem(null);
      await loadStockData();
    } catch (error) {
      toast("error", "Error al guardar", error instanceof Error ? error.message : "No se pudo registrar el ajuste.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    registros,
    total,
    pagina,
    setPagina,
    pageSize,
    setPageSize: (size: number) => { setPageSize(size); setPagina(1); },
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    searchInput,
    setSearchInput,
    estadoFiltro,
    handleFilterStatus: (status: StockStatusFilter) => { setEstadoFiltro(status); setPagina(1); setRevision(r=>r+1); },
    selectedAlmacenId,
    setSelectedAlmacenId: (id: number|undefined)=>{setSelectedAlmacenId(id);setPagina(1);setRevision(r=>r+1);},
    resumen,
    isLoading,
    isSaving,
    currentUser,
    availableAlmacenes: almacenes.options,
    loadAlmacenes: almacenes.load,
    loadingAlmacenes: almacenes.isLoading,
    errorAlmacenes: almacenes.error,

    adjustingStockItem,
    isAjusteModalOpen,
    openAjusteModal,
    closeAjusteModal,
    saveAjuste,
  };
}