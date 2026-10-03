import { apiGet, apiPost } from '@/shared/api/api-client';
import type { ConfirmacionImpresion, PendienteImpresion } from '../types/impresion.types';

export function listarPendientesImpresion(estacion: number) {
  return apiGet<PendienteImpresion[]>('/impresion/pendientes', { params: { estacion } });
}

export function confirmarImpresion({ id, propietario, enviado, error }: ConfirmacionImpresion) {
  return apiPost<{ confirmado: boolean }>(`/impresion/${id}/confirmar`, { propietario, enviado, error });
}

export function resolverImpresion(id: string, enviado: boolean) {
  return apiPost<{ actualizado: boolean }>(`/impresion/${id}/resolver`, { enviado });
}
