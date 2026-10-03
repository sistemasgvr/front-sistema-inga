import { apiGet, apiPost } from '@/shared/api/api-client';
import { formatearComanda, formatearPrueba } from '../utils/comanda';
import type { TrabajoImpresion } from '../types/impresion.types';

let conexion: Promise<typeof import('qz-tray')['default']> | null = null;

export async function conectarQz() {
  if (conexion) return conexion;
  conexion = (async () => {
    const qz = (await import('qz-tray')).default;
    if (!qz.websocket.isActive()) {
      // Comprueba configuración antes de intentar conectar con el programa local.
      const { certificado } = await apiGet<{ certificado: string | null }>('/impresion/qz/certificado');
      const mensajes = new Map<string, string>();
      qz.api.setSha256Type(async (mensaje) => {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(mensaje));
        const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
        mensajes.set(hash, mensaje);
        return hash;
      });
      qz.security.setCertificatePromise((resolve) => resolve(certificado));
      qz.security.setSignatureAlgorithm('SHA512');
      qz.security.setSignaturePromise((hash) => (resolve, reject) => {
        const mensaje = mensajes.get(hash);
        if (!mensaje) { reject(new Error('No se encontró el mensaje QZ para firmar')); return; }
        apiPost<{ firma: string }>('/impresion/qz/firmar', { mensaje })
          .then(({ firma }) => resolve(firma)).catch(reject).finally(() => mensajes.delete(hash));
      });
      try { await qz.websocket.connect({ retries: 1, delay: 1 }); }
      catch { throw new Error('No se pudo conectar con QZ Tray. Instálalo y ábrelo en esta PC; autoriza el sitio si aparece una solicitud.'); }
    }
    return qz;
  })();
  try { return await conexion; } finally { conexion = null; }
}

export async function probarConexion(host: string) {
  if (!host.trim()) throw new Error('La estación no tiene IP de impresora configurada');
  const qz = await conectarQz();
  await qz.socket.open(host.trim(), 9100);
  await qz.socket.close(host.trim(), 9100);
}

async function imprimirRaw(host: string, data: string) {
  const qz = await conectarQz();
  await qz.print(qz.configs.create({ host: host.trim(), port: 9100 }, { encoding: 'US-ASCII' }), [
    { type: 'raw', format: 'command', flavor: 'plain', data },
  ]);
}

export function imprimirComanda(trabajo: TrabajoImpresion) {
  return imprimirRaw(trabajo.host, formatearComanda(trabajo.contenido));
}

// Va directo a la impresora: no pasa por la cola ni crea comandas en el backend.
export async function imprimirPrueba(host: string, estacion: string) {
  if (!host.trim()) throw new Error('La estación no tiene IP de impresora configurada');
  await imprimirRaw(host, formatearPrueba(estacion, host.trim()));
}
