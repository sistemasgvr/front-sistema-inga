'use client';

import { Icon } from '@/components/ui/icon';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { useNotificaciones } from '../hooks/use-notificaciones';
import type { FiltroNotificaciones, Notificacion } from '../types/notificaciones.types';
import {
  COLOR_SEVERIDAD,
  esRutaInterna,
  ICONO_CANAL,
  tiempoRelativo,
} from '../utils/notificaciones.utils';

const FILTROS: { valor: FiltroNotificaciones; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'no-leidas', etiqueta: 'No leídas' },
];

export function CampanaNotificaciones() {
  const n = useNotificaciones();
  const [open, setOpen] = useState(false);
  // Refresca los "hace X min" cada minuto mientras el panel está abierto.
  const [ahora, setAhora] = useState(() => Date.now());
  const contenedor = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const reloj = setInterval(() => setAhora(Date.now()), 60_000);
    const fuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      clearInterval(reloj);
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  function ir(item: Notificacion) {
    n.marcarLeida(item.id);
    setOpen(false);
    if (esRutaInterna(item.ruta)) router.push(item.ruta);
  }

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        onClick={() => {
          if (!open) setAhora(Date.now());
          setOpen(!open);
        }}
        aria-label={n.noLeidas > 0 ? `Notificaciones, ${n.noLeidas} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        {n.noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1 text-xs font-medium text-white">
            {n.noLeidas > 99 ? '99+' : n.noLeidas}
          </span>
        )}
        <Icon name={n.noLeidas > 0 ? 'mdi:bell-ring-outline' : 'mdi:bell-outline'} size={20} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="fixed inset-x-4 top-20 z-50 flex max-h-[min(75vh,560px)] flex-col rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[400px]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 pt-4 pb-3 dark:border-gray-800">
            <div className="min-w-0">
              <h5 className="text-base font-semibold text-gray-800 dark:text-white/90">Notificaciones</h5>
              <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${n.conectado ? 'bg-success-500' : 'bg-gray-400'}`}
                />
                {n.conectado ? 'En vivo' : 'Sin conexión en vivo'}
                {n.noLeidas > 0 && ` · ${n.noLeidas} sin leer`}
              </p>
            </div>
            <button
              type="button"
              onClick={n.marcarTodasLeidas}
              disabled={n.noLeidas === 0}
              className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent dark:text-brand-400 dark:hover:bg-brand-500/10 dark:disabled:text-gray-600"
            >
              <Icon name="mdi:check-all" size={16} />
              Marcar todas como leídas
            </button>
          </div>

          <div className="flex gap-1.5 px-4 py-2.5" role="tablist" aria-label="Filtrar notificaciones">
            {FILTROS.map((f) => (
              <button
                key={f.valor}
                type="button"
                role="tab"
                aria-selected={n.filtro === f.valor}
                onClick={() => n.cambiarFiltro(f.valor)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  n.filtro === f.valor
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {f.etiqueta}
                {f.valor === 'no-leidas' && n.noLeidas > 0 ? ` (${n.noLeidas > 99 ? '99+' : n.noLeidas})` : ''}
              </button>
            ))}
          </div>

          <ul className="custom-scrollbar flex-1 overflow-y-auto px-2 pb-2">
            {n.notificaciones.length === 0 && !n.cargando && (
              <li className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                <Icon name="mdi:bell-check-outline" size={32} />
                {n.filtro === 'no-leidas' ? 'No tienes notificaciones sin leer.' : 'Sin notificaciones.'}
              </li>
            )}
            {n.notificaciones.map((item) => (
              <li key={item.id} className="group relative">
                <button
                  type="button"
                  onClick={() => ir(item)}
                  className={`flex w-full gap-3 rounded-xl py-2.5 pr-10 pl-2.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-white/5 ${
                    item.leida ? '' : 'bg-brand-50/50 dark:bg-brand-500/5'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${COLOR_SEVERIDAD[item.severidad]}`}
                  >
                    <Icon name={ICONO_CANAL[item.canal] ?? ICONO_CANAL.sistema} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm leading-5 ${
                        item.leida
                          ? 'font-medium text-gray-600 dark:text-gray-400'
                          : 'font-semibold text-gray-800 dark:text-white/90'
                      }`}
                    >
                      {item.titulo}
                    </span>
                    {item.mensaje && (
                      <span className="mt-0.5 block break-words text-xs text-gray-500 dark:text-gray-400">
                        {item.mensaje}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-gray-400 dark:text-gray-500">
                      {tiempoRelativo(item.creadaEn, ahora)}
                    </span>
                  </span>
                </button>
                {!item.leida && (
                  <>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-4 right-4 h-2 w-2 rounded-full bg-brand-500 group-hover:hidden group-focus-within:hidden"
                    />
                    <button
                      type="button"
                      onClick={() => n.marcarLeida(item.id)}
                      title="Marcar como leída"
                      aria-label={`Marcar como leída: ${item.titulo}`}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-gray-500 opacity-100 transition hover:bg-gray-200 hover:text-brand-600 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      <Icon name="mdi:check" size={16} />
                    </button>
                  </>
                )}
              </li>
            ))}
            {n.cargando && (
              <li className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400" role="status">
                Cargando…
              </li>
            )}
            {n.hayMas && !n.cargando && (
              <li className="px-2 pt-1">
                <button
                  type="button"
                  onClick={n.cargarMas}
                  className="w-full rounded-lg py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Cargar más
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
