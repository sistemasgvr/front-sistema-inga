"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import * as api from "../services/mesas.service";
import type {
  Feedback,
  Mesa,
  Pedido,
  PedidoResumen,
  Salon,
  SucursalOption,
  AbrirPedidoValues,
  AgregarItemValues,
  AnularValues,
} from "../types/mesas.types";

/** Pedidos sin mesa que se gestionan desde la vista de mesas: para llevar (2) y delivery (3). */
export const TIPOS_PEDIDO_EXTERNO = [2, 3] as const;

export function useMesas() {
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [sucursalId, setSucursalId] = useState<number>(0);
  const [salones, setSalones] = useState<Salon[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [turnoActivo, setTurnoActivo] = useState<{ id: number } | null>(null);
  const generation = useRef(0);
  const mesasRequest = useRef<AbortController | null>(null);
  const pending = useRef(false);
  const pedidoRequest = useRef(0);
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [pedidosExternos, setPedidosExternos] = useState<PedidoResumen[]>([]);
  const [loadingExternos, setLoadingExternos] = useState(true);
  const externosRequest = useRef<AbortController | null>(null);

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
        if (!items.length) {
          setLoading(false);
          setLoadingExternos(false);
        }
      })
      .catch((e) => {
        if (active) {
          error(e);
          setLoading(false);
          setLoadingExternos(false);
        }
      });
    return () => {
      active = false;
    };
  }, [error]);

  const reload = useCallback(() => {
    if (!sucursalId) return Promise.resolve();
    const current = ++generation.current;
    mesasRequest.current?.abort();
    return Promise.all([api.listSalones(sucursalId), api.listMesas(sucursalId)])
      .then(([s, m]) => {
        if (current === generation.current) {
          setSalones(s);
          setMesas(m);
        }
      })
      .catch((e: unknown) => {
        if (current === generation.current) {
          setSalones([]);
          setMesas([]);
          error(e);
        }
      })
      .finally(() => {
        if (current === generation.current) {
          setLoading(false);
          setLoadingMesas(false);
        }
      });
  }, [sucursalId, error]);

  // Lista de pedidos para llevar/delivery en curso; cada consulta cancela la anterior.
  const loadPedidosExternos = useCallback(() => {
    externosRequest.current?.abort();
    if (!sucursalId) return Promise.resolve();
    const controller = new AbortController();
    externosRequest.current = controller;
    return api
      .listPedidosEnCurso(sucursalId, TIPOS_PEDIDO_EXTERNO, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setPedidosExternos(items);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setPedidosExternos([]);
        error(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingExternos(false);
        if (externosRequest.current === controller) externosRequest.current = null;
      });
  }, [sucursalId, error]);

  const invalidate = useCallback(() => {
    generation.current++;
    mesasRequest.current?.abort();
    externosRequest.current?.abort();
  }, []);

  useEffect(() => {
    void reload();
    void loadPedidosExternos();
    return invalidate;
  }, [reload, loadPedidosExternos, invalidate]);

  const changeSucursal = useCallback(
    (id: number) => {
      if (pending.current || id === sucursalId) return;
      generation.current++;
      mesasRequest.current?.abort();
      setLoadingMesas(false);
      setSalones([]);
      setMesas([]);
      setPedidosExternos([]);
      setLoading(true);
      setLoadingExternos(true);
      setSucursalId(id);
      setSelectedMesa(null);
      setPedido(null);
    },
    [sucursalId],
  );

  const selectMesa = useCallback((mesa: Mesa | null) => {
    pedidoRequest.current++;
    setLoadingPedido(false);
    setFeedback(null);
    setSelectedMesa(mesa);
    setPedido(null);
  }, []);

  const loadPedido = useCallback(
    async (idPedido: number) => {
      // Si se selecciona otra mesa antes de responder, se descarta esta respuesta.
      const current = ++pedidoRequest.current;
      setLoadingPedido(true);
      try {
        const p = await api.obtenerPedido(idPedido);
        if (current !== pedidoRequest.current) return null;
        setPedido(p);
        return p;
      } catch (e) {
        if (current === pedidoRequest.current) error(e);
        return null;
      } finally {
        if (current === pedidoRequest.current) setLoadingPedido(false);
      }
    },
    [error],
  );

  // Mantiene visible el avance de cocina sin vaciar ni bloquear el resumen.
  useEffect(() => {
    if (!pedido?.id || ![2,3].includes(pedido.estado_pedido)) return;
    const id = pedido.id;
    const controller = new AbortController();
    let consultando = false;
    async function refrescar() {
      if (consultando || pending.current || document.visibilityState !== "visible") return;
      consultando = true;
      const revision = pedidoRequest.current;
      try {
        const actualizado = await api.obtenerPedido(id, controller.signal);
        if (!controller.signal.aborted && !pending.current && revision === pedidoRequest.current) {
          setPedido(actual => actual?.id === id ? actualizado : actual);
        }
      } catch {
        // Un fallo temporal se reintenta sin interrumpir las acciones del usuario.
      } finally { consultando = false; }
    }
    const timer = window.setInterval(() => void refrescar(), 3000);
    const alVolver = () => void refrescar();
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
    };
  }, [pedido?.id, pedido?.estado_pedido]);

  const loadTurnoActivo = useCallback(async () => {
    setTurnoActivo(null);
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
      if (!idSalon || pending.current) return;
      const current = ++generation.current;
      mesasRequest.current?.abort();
      const controller = new AbortController();
      mesasRequest.current = controller;
      setLoadingMesas(true);
      setFeedback(null);
      setMesas([]);
      setSelectedMesa(null);
      setPedido(null);
      try {
        const mesasSalon = await api.listMesasPorSalon(
          idSalon,
          controller.signal,
        );
        if (current === generation.current && !controller.signal.aborted)
          setMesas(mesasSalon);
      } catch (e) {
        if (current === generation.current && !controller.signal.aborted)
          error(e);
      } finally {
        if (current === generation.current && !controller.signal.aborted)
          setLoadingMesas(false);
        if (mesasRequest.current === controller) mesasRequest.current = null;
      }
    },
    [error],
  );

  async function mutate(
    action: () => Promise<unknown>,
    mensaje = "Los cambios se guardaron correctamente.",
  ): Promise<boolean> {
    if (pending.current) return false;
    pending.current = true;
    pedidoRequest.current++;
    setLoadingPedido(false);
    setSaving(true);
    setFeedback(null);
    try {
      await action();
      await Promise.all([reload(), loadPedidosExternos()]);
      setFeedback({
        variant: "success",
        title: "Guardado",
        message: mensaje,
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

  const abrirPedido = (values: AbrirPedidoValues) =>
    mutate(async () => {
      setPedido(await api.abrirPedido(values));
    });
  const agregarItem = (values: AgregarItemValues) =>
    mutate(async () => {
      if (!pedido) throw new Error("Seleccione un pedido.");
      setPedido(await api.agregarItem(pedido.id, values));
    });
  const agregarItems = async (items: AgregarItemValues[]) => {
    let guardados = 0;
    const ok = await mutate(async () => {
      if (!pedido) throw new Error("Seleccione un pedido.");
      for (const values of items) {
        setPedido(await api.agregarItem(pedido.id, values));
        guardados++;
      }
    });
    return { ok, guardados };
  };
  const comandar = () =>
    mutate(async () => {
      if (!pedido) throw new Error("Seleccione un pedido.");
      setPedido(await api.comandarPedido(pedido.id));
    });
  const entregarItem = (idItem: number) =>
    mutate(async () => {
      const item = pedido?.items.find(i => i.id === idItem);
      if (!pedido || ![2,3].includes(pedido.estado_pedido) || !item || item.estado !== 1 ||
          item.tipo_linea === 3 || item.estado_preparacion !== 4)
        throw new Error("Solo se pueden entregar platos listos.");
      const objetivo = Number(item.cantidad) - Number(item.cantidad_cancelada);
      if (objetivo <= Number(item.cantidad_entregada))
        throw new Error("Este plato ya fue entregado.");
      setPedido(await api.entregarItemPedido(pedido.id, item.id, objetivo));
    }, "Plato entregado al cliente.");
  const cancelarItem = (idItem: number, motivo: string) => mutate(async()=>{
    const item=pedido?.items.find(i=>i.id===idItem);
    const usuario=getStoredUser();
    if(!pedido||!item||!usuario||![1,2].includes(item.estado_preparacion)||!motivo.trim())
      throw new Error("Solo se puede cancelar desde el resumen antes de iniciar la preparación.");
    setPedido(await api.anularItem(pedido.id,item.id,{id_usuario_autoriza:usuario.id,motivo:motivo.trim(),
      cantidad_cancelada:Number(item.cantidad)-Number(item.cantidad_entregada),solo_sin_preparar:true}));
  },"Plato cancelado.");
  const cambiarEstado = (estado_pedido: number) =>
    mutate(async () => {
      if (!pedido) throw new Error("Seleccione un pedido.");
      setPedido(await api.cambiarEstadoPedido(pedido.id, { estado_pedido }));
    });
  const cerrarPedido = (accion:'precuenta'|'cobrar'|'credito',datos:{id_estacion?:number;tipo_comprobante?:number;medio_pago?:number;documento?:string}) =>
    mutate(async()=>{if(!pedido)throw new Error('Seleccione un pedido.');setPedido(await api.cerrarPedido(pedido.id,accion,datos));},
      accion==='precuenta'?'Precuenta enviada a impresión.':accion==='credito'?'Cuenta por cobrar registrada.':'Cobro registrado.');
  const descartar = () =>
    mutate(async () => {
      if (!pedido) throw new Error("Seleccione un pedido.");
      await api.descartarPedido(pedido.id);
      setPedido(null);
    }, `El pedido ${pedido?.codigo ?? ""} se canceló porque no se agregaron productos.`);
  const anular = (values: Pick<AnularValues,"motivo"|"destino_preparado"|"destino_insumos">) =>
    mutate(async () => {
      const usuario = getStoredUser();
      if (!pedido || !usuario)
        throw new Error("Seleccione un pedido e inicie sesión.");
      await api.anularPedido(pedido.id, {
        id_usuario_autoriza: usuario.id,
        ...values,
      });
      setPedido(null);
    });

  return {
    sucursales,
    sucursalId,
    changeSucursal,
    salones,
    mesas,
    loading,
    loadingMesas,
    saving,
    feedback,
    clearError: () =>
      setFeedback((previous) =>
        previous?.variant === "error" ? null : previous,
      ),
    selectedMesa,
    selectMesa,
    pedido,
    loadingPedido,
    loadPedido,
    clearPedido,
    turnoActivo,
    loadTurnoActivo,
    loadMesasPorSalon,
    error,
    reload: () => {
      setLoading(true);
      setLoadingExternos(true);
      return Promise.all([reload(), loadPedidosExternos()]);
    },
    pedidosExternos,
    loadingExternos,
    mutate,
    abrirPedido,
    agregarItem,
    agregarItems,
    comandar,
    entregarItem,
    cancelarItem,
    cambiarEstado,
    cerrarPedido,
    anular,
    descartar,
  };
}
