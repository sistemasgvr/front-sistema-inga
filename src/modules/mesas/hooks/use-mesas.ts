"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import { useLista } from "@/modules/listas/hooks/use-lista";
import { LISTA_IDS } from "@/modules/listas/constants/lista-ids";
import * as api from "../services/mesas.service";
import type {
  Feedback,
  Mesa,
  Pedido,
  ProductoOption,
  Salon,
  SucursalOption,
} from "../types/mesas.types";

export function useMesas() {
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [sucursalId, setSucursalId] = useState<number>(0);
  const [salones, setSalones] = useState<Salon[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [mozos, setMozos] = useState<{ id: number; nombre: string }[]>([]);
  const [turnoActivo, setTurnoActivo] = useState<{ id: number } | null>(null);
  const generation = useRef(0);
  const pending = useRef(false);

  // Lista de comprobantes
  const listaComprobanteTipo = useLista(LISTA_IDS.COMPROBANTE_TIPO);

  const error = useCallback(
    (e: unknown) =>
      setFeedback({
        variant: "error",
        title: "No se pudo completar",
        message:
          e instanceof Error ? e.message : "Ocurrió un error inesperado.",
      }),
    [],
  );

  useEffect(() => {
    let active = true;
    const user = getStoredUser();
    if (!user?.es_super_admin && !user?.permisos?.includes("ambientes.listar"))
      return;
    api
      .listSucursales()
      .then((items) => {
        if (!active) return;
        setSucursales(items);
        setSucursalId(
          Number(
            items.find(
              (s) => Number(s.id) === Number(user?.id_sucursal_default),
            )?.id ??
              items[0]?.id ??
              0,
          ),
        );
        if (!items.length) setLoading(false);
      })
      .catch((e) => {
        if (active) {
          error(e);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [error]);

  const reload = useCallback(async () => {
    if (!sucursalId) return;
    const current = ++generation.current;
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        api.listSalones(sucursalId),
        api.listMesas(sucursalId),
      ]);
      if (current === generation.current) {
        setSalones(s);
        setMesas(m);
      }
    } catch (e) {
      if (current === generation.current) {
        setSalones([]);
        setMesas([]);
        error(e);
      }
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [sucursalId, error]);

  const invalidate = useCallback(() => {
    generation.current++;
  }, []);

  useEffect(() => {
    void reload();
    return invalidate;
  }, [reload, invalidate]);

  const changeSucursal = useCallback(
    (id: number) => {
      if (pending.current || id === sucursalId) return;
      generation.current++;
      setSalones([]);
      setMesas([]);
      setLoading(true);
      setSucursalId(id);
      setSelectedMesa(null);
      setPedido(null);
    },
    [sucursalId],
  );

  const selectMesa = useCallback((mesa: Mesa | null) => {
    setSelectedMesa(mesa);
    setPedido(null);
  }, []);

  const loadPedido = useCallback(
    async (idPedido: number) => {
      try {
        const p = await api.obtenerPedido(idPedido);
        setPedido(p);
        return p;
      } catch (e) {
        error(e);
        return null;
      }
    },
    [error],
  );

  const loadProductos = useCallback(async () => {
    try {
      const prods = await api.listProductosParaPedido();
      setProductos(prods);
    } catch (e) {
      error(e);
    }
  }, [error]);

  const loadMozos = useCallback(async () => {
    try {
      const m = await api.listMozos();
      setMozos(m);
    } catch (e) {
      error(e);
    }
  }, [error]);

  const loadTurnoActivo = useCallback(async () => {
    const user = getStoredUser();
    if (!user) return;
    try {
      const t = await api.getTurnoActivo(user.id);
      setTurnoActivo(t);
    } catch (e) {
      error(e);
    }
  }, [error]);

  const loadMesasPorSalon = useCallback(
    async (idSalon: number) => {
      if (!idSalon) return;
      try {
        const mesasSalon = await api.listMesasPorSalon(idSalon);
        setMesas((prev) => {
          const otrasMesas = prev.filter(
            (m) => Number(m.id_salon) !== idSalon,
          );
          return [...otrasMesas, ...mesasSalon];
        });
      } catch (e) {
        error(e);
      }
    },
    [error],
  );

  async function mutate(action: () => Promise<unknown>): Promise<boolean> {
    if (pending.current) return false;
    pending.current = true;
    setSaving(true);
    setFeedback(null);
    try {
      await action();
      await reload();
      setFeedback({
        variant: "success",
        title: "Guardado",
        message: "Los cambios se guardaron correctamente.",
      });
      return true;
    } catch (e) {
      error(e);
      return false;
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  const clearPedido = useCallback(() => {
    setPedido(null);
  }, []);

  return {
    sucursales,
    sucursalId,
    changeSucursal,
    salones,
    mesas,
    loading,
    saving,
    feedback,
    selectedMesa,
    selectMesa,
    pedido,
    loadPedido,
    clearPedido,
    productos,
    loadProductos,
    mozos,
    loadMozos,
    turnoActivo,
    loadTurnoActivo,
    loadMesasPorSalon,
    listaComprobanteTipo,
    error,
    reload,
    mutate,
  };
}
