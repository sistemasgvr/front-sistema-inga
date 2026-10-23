'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { env } from '@/config/env';
import { getStoredToken } from '@/modules/auth/services/auth.service';

export interface OpcionesSocket {
  onNueva: (n: unknown) => void;
  /** Otra pestaña (o esta) marcó notificaciones como leídas. */
  onLeidas?: (ids: string[] | 'todas') => void;
  /** true al conectar o reconectar: momento de re-sincronizar la lista. */
  onEstado?: (conectado: boolean) => void;
}
export function useNotificacionesSocket({ onNueva, onLeidas, onEstado }: OpcionesSocket) {
  const handlers = useRef({ onNueva, onLeidas, onEstado });
  useEffect(() => {
    handlers.current = { onNueva, onLeidas, onEstado };
  });

  useEffect(() => {
    const apiOrigin = new URL(env.apiUrl, window.location.origin).origin;
    const socket = io(`${apiOrigin}/notificaciones`, {
      path: process.env.NEXT_PUBLIC_SOCKET_PATH ?? '/socket.io',
      transports: ['websocket'],
      autoConnect: false,
      auth: (cb) => cb({ token: getStoredToken() }),
    });

    socket.on('connect', () => handlers.current.onEstado?.(true));
    socket.on('disconnect', () => handlers.current.onEstado?.(false));
    socket.on('connect_error', (err) => {
      handlers.current.onEstado?.(false);
      console.error('Notificaciones socket error:', err?.message ?? err);
    });
    socket.on('notificacion:nueva', (payload: unknown) => handlers.current.onNueva(payload));
    socket.on('notificacion:leidas', (payload: { ids?: string[] | 'todas' }) => {
      if (payload?.ids) handlers.current.onLeidas?.(payload.ids);
    });

    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);
}
