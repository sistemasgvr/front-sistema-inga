import { apiGet, apiPatch } from '@/shared/api/api-client';
import type { Notificacion } from '../types/notificaciones.types';

export async function listarNotificaciones(): Promise<Notificacion[]> {
  try {
    return await apiGet<Notificacion[]>('/notificaciones');
  } catch {
    return [];
  }
}

export async function contarNoLeidas(): Promise<number> {
  try {
    const res = await apiGet<{ total: number }>('/notificaciones/no-leidas/count');
    return res?.total ?? 0;
  } catch {
    return 0;
  }
}

export async function marcarLeida(id: string): Promise<void> {
  try {
    await apiPatch(`/notificaciones/${id}/leer`);
  } catch {
    // Ignorar errores de red; el estado local ya se actualizó.
  }
}
