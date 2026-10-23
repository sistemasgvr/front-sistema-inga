'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/components/ui/toast/ToastContext';
import { NotificacionesContext } from '../context/notificaciones-context';
import { useNotificacionesSocket } from '../hooks/use-notificaciones-socket';
import {
  contarNoLeidas,
  listarNotificaciones,
  marcarLeida as marcarLeidaApi,
  marcarTodasLeidas as marcarTodasLeidasApi,
} from '../services/notificaciones.service';
import { normalizarNotificacion } from '../utils/notificaciones.utils';
import type {
  ContextoNotificaciones,
  FiltroNotificaciones,
  Notificacion,
} from '../types/notificaciones.types';

export function NotificacionesProvider({ children }: { children: React.ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [total, setTotal] = useState(0);
  const [noLeidas, setNoLeidas] = useState(0);
  const [filtro, setFiltro] = useState<FiltroNotificaciones>('todas');
  const [cargando, setCargando] = useState(false);
  const [conectado, setConectado] = useState(false);
  // Ids ya recibidos: una reconexión o una página repetida no duplican avisos ni toasts.
  const vistos = useRef<Set<string>>(new Set());
  // Solo cuenta la respuesta de la última petición (cambios rápidos de filtro).
  const peticion = useRef(0);
  const { toast } = useToast();

  const actualizarContador = useCallback(() => {
    contarNoLeidas().then(setNoLeidas).catch(() => undefined);
  }, []);

  const cargar = useCallback(
    async (offset: number) => {
      const id = ++peticion.current;
      setCargando(true);
      try {
        const pagina = await listarNotificaciones({
          soloNoLeidas: filtro === 'no-leidas',
          offset,
        });
        if (id !== peticion.current) return;
        pagina.registros.forEach((n) => vistos.current.add(n.id));
        setTotal(pagina.total);
        setNotificaciones((prev) => {
          if (offset === 0) return pagina.registros;
          const ids = new Set(prev.map((n) => n.id));
          return [...prev, ...pagina.registros.filter((n) => !ids.has(n.id))];
        });
      } catch {
        // Sin conexión con la API la campana queda con lo último cargado.
      } finally {
        if (id === peticion.current) setCargando(false);
      }
    },
    [filtro],
  );

  const recargar = useCallback(() => {
    void cargar(0);
    actualizarContador();
  }, [cargar, actualizarContador]);

  // Cada cambio de filtro pide al servidor la lista con la selección actual.
  useEffect(() => {
    // Sincroniza con el servidor; el estado de carga se marca antes de pedir.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar();
  }, [recargar]);

  const onNueva = useCallback(
    (payload: unknown) => {
      const n = normalizarNotificacion(payload);
      if (!n || vistos.current.has(n.id)) return;
      vistos.current.add(n.id);
      setNotificaciones((prev) => [n, ...prev]);
      setTotal((t) => t + 1);
      setNoLeidas((c) => c + 1);
      toast(n.severidad, n.titulo, n.mensaje, { agruparPorTitulo: true });
    },
    [toast],
  );

  const onLeidas = useCallback(
    (ids: string[] | 'todas') => {
      setNotificaciones((prev) =>
        prev.map((n) => (ids === 'todas' || ids.includes(n.id) ? { ...n, leida: true } : n)),
      );
      actualizarContador();
    },
    [actualizarContador],
  );

  const onEstado = useCallback(
    (activo: boolean) => {
      setConectado(activo);
      // Al reconectar se recuperan los avisos emitidos mientras no había conexión.
      if (activo) recargar();
    },
    [recargar],
  );

  useNotificacionesSocket({ onNueva, onLeidas, onEstado });

  const marcarLeida = useCallback(
    (id: string) => {
      const actual = notificaciones.find((n) => n.id === id);
      if (actual?.leida) return;
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
      setNoLeidas((c) => Math.max(0, c - 1));
      marcarLeidaApi(id).catch(actualizarContador);
    },
    [notificaciones, actualizarContador],
  );

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => (n.leida ? n : { ...n, leida: true })));
    setNoLeidas(0);
    marcarTodasLeidasApi().catch(() => {
      toast('error', 'Notificaciones', 'No se pudieron marcar como leídas. Intenta de nuevo.');
      recargar();
    });
  }, [toast, recargar]);

  const value = useMemo<ContextoNotificaciones>(
    () => ({
      notificaciones,
      noLeidas,
      total,
      conectado,
      cargando,
      hayMas: notificaciones.length < total,
      filtro,
      cambiarFiltro: setFiltro,
      cargarMas: () => void cargar(notificaciones.length),
      marcarLeida,
      marcarTodasLeidas,
    }),
    [notificaciones, noLeidas, total, conectado, cargando, filtro, cargar, marcarLeida, marcarTodasLeidas],
  );

  return <NotificacionesContext.Provider value={value}>{children}</NotificacionesContext.Provider>;
}
