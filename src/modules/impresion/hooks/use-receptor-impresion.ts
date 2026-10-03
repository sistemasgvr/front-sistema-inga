"use client";

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { env } from '@/config/env';
import { getStoredToken, getStoredUser } from '@/modules/auth/services/auth.service';
import { ApiError } from '@/shared/api/api-client';
import { confirmarImpresion } from '../services/impresion.service';
import { conectarQz, imprimirComanda } from '../services/qz.service';
import type { TrabajoImpresion, PreferenciasImpresion, ConfirmacionImpresion, EstadoImpresion } from '../types/impresion.types';

const INACTIVO: EstadoImpresion = { mensaje: 'Esta PC no imprime comandas', nivel: 'inactivo' };

export function useReceptorImpresion() {
  const [estaciones, setEstaciones] = useState<number[]>([]);
  const [estado, setEstado] = useState<EstadoImpresion>(INACTIVO);
  // Cambiarlo reinicia el receptor (botón «Reanudar» tras un fallo de impresión).
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(`inga-impresion:${getStoredUser()?.id}`) ?? 'null') as
        (PreferenciasImpresion & { activo?: boolean }) | null;
      // Formato anterior: estaciones marcadas con la recepción apagada no deben empezar a imprimir solas.
      if (value && Array.isArray(value.estaciones) && value.activo !== false) {
        const ids = value.estaciones.filter((id) => Number.isSafeInteger(id) && id > 0).slice(0, 100);
        queueMicrotask(() => setEstaciones(ids));
      }
    } catch { /* Configuración local dañada: se inicia sin estaciones. */ }
  }, []);

  function configurar(ids: number[]) {
    localStorage.setItem(`inga-impresion:${getStoredUser()?.id}`, JSON.stringify({ estaciones: ids } satisfies PreferenciasImpresion));
    setEstaciones(ids);
  }

  useEffect(() => {
    if (!estaciones.length) return;
    let stopped = false;
    let busy = false;
    let blocked = false;
    let ready = false;
    const userId = getStoredUser()?.id;
    const ackKey = `inga-impresion-confirmaciones:${userId}`;
    const apiOrigin = new URL(env.apiUrl, window.location.origin).origin;
    const socket = io(`${apiOrigin}/impresion`, {
      path: process.env.NEXT_PUBLIC_SOCKET_PATH ?? '/socket.io',
      transports: ['websocket'], autoConnect: false,
      auth: (callback) => callback({ token: getStoredToken() }),
    });
    const status = (mensaje: string, nivel: EstadoImpresion['nivel'] = 'ok') => { if (!stopped) setEstado({ mensaje, nivel }); };
    const readAcks = (): ConfirmacionImpresion[] => JSON.parse(localStorage.getItem(ackKey) ?? '[]') as ConfirmacionImpresion[];
    async function flush() {
      for (const receipt of readAcks()) {
        try { await confirmarImpresion(receipt); }
        catch (error) {
          // Un operador pudo resolver/reasignar el trabajo mientras esta PC estaba sin conexión.
          if (!(error instanceof ApiError) || error.statusCode !== 409) throw error;
        }
        localStorage.setItem(ackKey, JSON.stringify(readAcks().filter((r) => r.id !== receipt.id)));
      }
    }
    async function drain() {
      if (busy || blocked || stopped || !ready || !socket.connected) return;
      busy = true;
      try {
        await flush(); // Reintenta sólo el ACK; jamás vuelve a enviar el papel.
        await conectarQz();
        while (!stopped && socket.connected) {
          const response = await socket.timeout(15000).emitWithAck('impresion:solicitar', { estaciones }) as {
            ok: boolean; message?: string; trabajo: TrabajoImpresion | null; propietario: string;
          };
          if (!response.ok) throw new Error(response.message);
          if (!response.trabajo) { status('Conectado · esperando comandas'); break; }
          const receipt: ConfirmacionImpresion = { id: response.trabajo.id, propietario: response.propietario, enviado: false };
          try {
            if (stopped) throw new Error('Se detuvo el receptor antes de enviar');
            status(`Enviando comanda ${response.trabajo.id} a ${response.trabajo.contenido.estacion}`);
            await imprimirComanda(response.trabajo);
            receipt.enviado = true;
          } catch (error) {
            receipt.error = (error instanceof Error ? error.message : String(error)).slice(0, 500);
            blocked = true;
            status(`Impresión pausada. Comanda ${receipt.id}: ${receipt.error}. Revisa la impresora y la cola, luego pulsa «Reanudar».`, 'pausado');
          }
          localStorage.setItem(ackKey, JSON.stringify([...readAcks().filter((r) => r.id !== receipt.id), receipt]));
          await flush();
          if (!receipt.enviado) break;
        }
      } catch (error) {
        status(error instanceof Error ? error.message : 'No se pudo procesar la cola de impresión', 'error');
      } finally { busy = false; }
    }
    queueMicrotask(() => status('Conectando…')); // Limpia el aviso de pausa al reanudar.
    socket.on('impresion:listo', () => { ready = true; void drain(); });
    socket.on('impresion:disponible', () => { void drain(); });
    socket.on('impresion:error', (message: string) => status(message, 'error'));
    socket.on('connect_error', () => status('Sin conexión con el servidor de impresión. Reintentando…', 'error'));
    socket.on('disconnect', (reason) => {
      ready = false;
      status(reason === 'io server disconnect' ? 'Sesión sin acceso a impresión. Vuelve a iniciar sesión.' : 'Conexión interrumpida. Reconectando…', 'error');
    });
    socket.connect();
    // Recupera señales perdidas o generadas por otra instancia del VPS.
    const timer = setInterval(() => { void drain(); }, 15000);
    return () => { stopped = true; clearInterval(timer); socket.disconnect(); };
  }, [estaciones, intento]);

  return { estaciones, activo: estaciones.length > 0, estado: estaciones.length ? estado : INACTIVO,
    configurar, reanudar: () => setIntento((n) => n + 1) };
}
