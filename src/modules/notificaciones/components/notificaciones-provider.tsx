'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast/ToastContext';
import { NotificacionesContext } from '../context/notificaciones-context';
import { useNotificacionesSocket } from '../hooks/use-notificaciones-socket';
import { listarNotificaciones, marcarLeida as marcarLeidaApi } from '../services/notificaciones.service';
import type { ContextoNotificaciones, Notificacion } from '../types/notificaciones.types';

const CANALES_POR_DEFECTO = ['sistema', 'pedidos'];

function normalizar(payload: unknown): Notificacion | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.id !== 'string' || typeof p.ruta !== 'string') return null;
  if (!p.ruta.startsWith('/') || p.ruta.includes('://')) return null;
  return {
    id: p.id,
    canal: (p.canal as Notificacion['canal']) ?? 'sistema',
    titulo: String(p.titulo ?? 'Notificación'),
    mensaje: String(p.mensaje ?? ''),
    severidad: (p.severidad as Notificacion['severidad']) ?? 'info',
    ruta: p.ruta,
    idReferencia: typeof p.idReferencia === 'number' ? p.idReferencia : null,
    creadaEn: String(p.creadaEn ?? new Date().toISOString()),
    leida: Boolean(p.leida),
  };
}

export function NotificacionesProvider({ children }: { children: React.ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [conectado, setConectado] = useState(false);
  const vistos = useRef<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let activo = true;
    listarNotificaciones().then((lista) => {
      if (!activo) return;
      setNotificaciones(lista);
      lista.forEach((n) => vistos.current.add(n.id));
    });
    return () => {
      activo = false;
    };
  }, []);

  const onNueva = useCallback((payload: unknown) => {
    const n = normalizar(payload);
    if (!n) return;
    if (vistos.current.has(n.id)) return;
    vistos.current.add(n.id);
    setNotificaciones((prev) => [n, ...prev].slice(0, 50));
    toast(n.severidad === 'error' ? 'error' : n.severidad === 'warning' ? 'warning' : n.severidad === 'success' ? 'success' : 'info', n.titulo, n.mensaje, { agruparPorTitulo: true });
  }, [toast]);

  useNotificacionesSocket({
    canales: CANALES_POR_DEFECTO,
    onNueva,
    onEstado: setConectado,
  });

  const marcarLeida = useCallback((id: string) => {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    void marcarLeidaApi(id);
  }, []);

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }, []);

  const limpiar = useCallback(() => setNotificaciones([]), []);

  const noLeidas = useMemo(() => notificaciones.filter((n) => !n.leida).length, [notificaciones]);

  const value: ContextoNotificaciones = {
    notificaciones,
    noLeidas,
    conectado,
    marcarLeida,
    marcarTodasLeidas,
    limpiar,
  };

  // Exponer navegación vía evento custom para componentes hijos (campana).
  // Se guarda router en ref para uso en componentes.
  (globalThis as { __ingaRouter?: typeof router }).__ingaRouter = router;

  return <NotificacionesContext.Provider value={value}>{children}</NotificacionesContext.Provider>;
}
