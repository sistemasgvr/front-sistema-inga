'use client';

import { Icon } from '@/components/ui/icon';
import { useNotificaciones } from '../hooks/use-notificaciones';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export function CampanaNotificaciones() {
  const { notificaciones, noLeidas, marcarLeida } = useNotificaciones();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function ir(n: (typeof notificaciones)[number]) {
    if (!n.ruta.startsWith('/') || n.ruta.includes('://')) return;
    marcarLeida(n.id);
    setOpen(false);
    router.push(n.ruta);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1 text-xs font-medium text-white">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
        <Icon name="mdi:bell-outline" size={20} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          {notificaciones.length === 0 && (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">Sin notificaciones</p>
          )}
          <ul className="flex flex-col">
            {notificaciones.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => ir(n)}
                  className={`w-full rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-white/5 ${n.leida ? 'opacity-60' : ''}`}
                >
                  <div className="text-sm font-medium text-gray-800 dark:text-white/90">{n.titulo}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{n.mensaje}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
