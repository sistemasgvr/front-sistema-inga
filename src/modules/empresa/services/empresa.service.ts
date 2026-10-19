import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/api-client';
import type { Empresa, EmpresaFormValues } from '../types/empresa.types';

export const obtenerEmpresa = () => apiGet<Empresa | null>('/general/empresa');

export const guardarEmpresa = (values: EmpresaFormValues) =>
  apiPut<Empresa>('/general/empresa', {
    ruc: values.ruc.trim(),
    razonSocial: values.razonSocial.trim(),
    direccion: values.direccion.trim() || undefined,
  });

export function subirLogoEmpresa(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiPost<Empresa>('/general/empresa/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export const eliminarLogoEmpresa = () => apiDelete<Empresa>('/general/empresa/logo');
