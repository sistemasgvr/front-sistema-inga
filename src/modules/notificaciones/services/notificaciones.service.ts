import { apiGet, apiPatch } from '@/shared/api/api-client';
import type { PaginaNotificaciones } from '../types/notificaciones.types';
import { normalizarNotificacion } from '../utils/notificaciones.utils';

export const TAMANO_PAGINA = 20;

export async function listarNotificaciones(params: {
  soloNoLeidas?: boolean;
  offset?: number;
  limite?: number;
}): Promise<PaginaNotificaciones> {
  const res = await apiGet<{ registros?: unknown[]; total?: number }>('/notificaciones', {
    params: {
      soloNoLeidas: params.soloNoLeidas ? 'true' : undefined,
      offset: params.offset ?? 0,
      limite: params.limite ?? TAMANO_PAGINA,
    },
  });
  const registros = (res?.registros ?? [])
    .map(normalizarNotificacion)
    .filter((n) => n !== null);
  return { registros, total: Number(res?.total ?? registros.length) };
}

export async function contarNoLeidas(): Promise<number> {
  const res = await apiGet<{ total: number }>('/notificaciones/no-leidas/count');
  return Number(res?.total ?? 0);
}

export async function marcarLeida(id: string): Promise<void> {
  await apiPatch(`/notificaciones/${id}/leer`);
}

export async function marcarTodasLeidas(): Promise<void> {
  await apiPatch('/notificaciones/leer-todas', {});
}
