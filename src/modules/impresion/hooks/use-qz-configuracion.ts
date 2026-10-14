'use client';
import { useEffect, useState } from 'react';
import { obtenerConfiguracionQz, guardarConfiguracionQz } from '../services/qz-configuracion.service';
import type { QzConfiguracion } from '../types/qz-configuracion.types';

export function useQzConfiguracion() {
  const [configuracion, setConfiguracion] = useState<QzConfiguracion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  useEffect(() => {
    let vigente = true;
    obtenerConfiguracionQz().then(value => { if (vigente) setConfiguracion(value); })
      .catch(() => { if (vigente) setError('No se pudo consultar la configuración de QZ. Recarga para reintentar.'); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);
  async function guardar(certificado: File, clave: File) {
    if (guardando) return false;
    setGuardando(true); setError(''); setMensaje('');
    try {
      setConfiguracion(await guardarConfiguracionQz(certificado, clave));
      setMensaje('Certificado y clave guardados. Recarga Inga en las PCs que imprimen para usar el nuevo certificado.');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la configuración.');
      return false;
    } finally { setGuardando(false); }
  }
  return { configuracion, cargando, guardando, error, mensaje, guardar };
}
