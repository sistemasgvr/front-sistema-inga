'use client';

import { createContext } from 'react';
import type { ContextoNotificaciones } from '../types/notificaciones.types';

export const NotificacionesContext = createContext<ContextoNotificaciones | null>(null);
