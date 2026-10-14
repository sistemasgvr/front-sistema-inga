import { apiGet, apiPost } from '@/shared/api/api-client';
import type { QzConfiguracion } from '../types/qz-configuracion.types';

export const obtenerConfiguracionQz = () => apiGet<QzConfiguracion>('/impresion/qz/configuracion');
export async function guardarConfiguracionQz(certificado: File, clave: File) {
  if (certificado.size > 32000 || clave.size > 16000)
    throw new Error('El certificado admite hasta 32 KB y la clave hasta 16 KB.');
  return apiPost<QzConfiguracion>('/impresion/qz/configuracion', {
    certificado: await certificado.text(), clavePrivada: await clave.text(),
  });
}
