'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env';
import { getStoredToken } from '@/modules/auth/services/auth.service';

export interface OpcionesSocket {
  canales: string[];
  onNueva: (n: unknown) => void;
  onEstado?: (conectado: boolean) => void;
}

export function useNotificacionesSocket({ canales, onNueva, onEstado }: OpcionesSocket) {
  const socketRef = useRef<Socket | null>(null);
  const onNuevaRef = useRef(onNueva);
  onNuevaRef.current = onNueva;

  useEffect(() => {
    const apiOrigin = new URL(env.apiUrl, window.location.origin).origin;
    const socket = io(`${apiOrigin}/notificaciones`, {
      path: process.env.NEXT_PUBLIC_SOCKET_PATH ?? '/socket.io',
      transports: ['websocket'],
      autoConnect: false,
      auth: (cb) => cb({ token: getStoredToken() }),
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      onEstado?.(true);
      socket.emit('notificaciones:suscribir', { canales }, (res: { ok: boolean; canales?: string[] }) => {
        // suscripción confirmada
        void res;
      });
    });

    socket.on('disconnect', () => onEstado?.(false));
    socket.on('connect_error', (err) => {
      onEstado?.(false);
      console.error('Notificaciones socket error:', err?.message ?? err);
    });
    socket.on('notificacion:nueva', (payload: unknown) => {
      onNuevaRef.current(payload);
    });

    socket.connect();
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [canales.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return socketRef;
}
