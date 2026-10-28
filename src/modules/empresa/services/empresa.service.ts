import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/api-client';
import type { Distrito, Empresa, EmpresaFormValues } from '../types/empresa.types';

export const obtenerEmpresa = () => apiGet<Empresa | null>('/general/empresa');

export const guardarEmpresa = (values: EmpresaFormValues) =>
  apiPut<Empresa>('/general/empresa', {
    ruc: values.ruc.trim(),
    razonSocial: values.razonSocial.trim(),
    nombreComercial: values.nombreComercial.trim(),
    direccion: values.direccion.trim() || undefined,
    idDistrito: values.idDistrito ?? undefined,
    tasaIgv: Number(values.tasaIgv),
  });

export const buscarDistritos = (buscar: string, signal?: AbortSignal) =>
  apiGet<Distrito[]>('/general/empresa/distritos', {
    params: { buscar: buscar.trim() || undefined },
    signal,
  });

export function subirLogoEmpresa(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiPost<Empresa>('/general/empresa/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export const eliminarLogoEmpresa = () => apiDelete<Empresa>('/general/empresa/logo');
