'use client';

import { useContext } from 'react';
import { NotificacionesContext } from '../context/notificaciones-context';

export function useNotificaciones() {
  const ctx = useContext(NotificacionesContext);
  if (!ctx) throw new Error('useNotificaciones debe usarse dentro de NotificacionesProvider');
  return ctx;
}
