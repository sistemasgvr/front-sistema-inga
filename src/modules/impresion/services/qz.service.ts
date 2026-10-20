import { apiGet, apiPost } from '@/shared/api/api-client';
import { ENCABEZADO_LOGO, formatearComanda, formatearPrueba } from '../utils/comanda';
import type { AnchoPapel, EmpresaTicket, TrabajoImpresion } from '../types/impresion.types';

let conexion: Promise<typeof import('qz-tray')['default']> | null = null;
// QZ sólo informa «Failed to sign request»; se guarda el motivo real que dio el servidor.
let ultimoErrorFirma: string | null = null;

/** QZ no firmó el envío: el ticket no llegó a la impresora y puede reintentarse sin duplicar. */
export class ErrorFirmaQz extends Error {}

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
          .then(({ firma }) => resolve(firma))
          .catch((error: unknown) => { ultimoErrorFirma = error instanceof Error ? error.message : String(error); reject(error); })
          .finally(() => mensajes.delete(hash));
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

/** Esperas antes de reintentar cuando el servidor no firmó (p. ej. un corte breve de red o del API). */
const REINTENTOS_FIRMA_MS = [500, 2000];

async function imprimirRaw(host: string, data: string, logo?: string | null) {
  const qz = await conectarQz();
  // QZ modifica los objetos al enviarlos: se arman de nuevo en cada intento.
  const datos = () => {
    const texto = { type: 'raw', format: 'command', flavor: 'plain', data } as const;
    return logo ? [
      { type: 'raw', format: 'command', flavor: 'plain', data: ENCABEZADO_LOGO },
      { type: 'raw', format: 'image', flavor: 'base64', data: logo, options: { language: 'ESCPOS', dotDensity: 'double' } },
      texto,
    ] as const : [texto];
  };
  for (let intento = 0; ; intento++) {
    ultimoErrorFirma = null;
    try {
      await qz.print(qz.configs.create({ host: host.trim(), port: 9100 }, { encoding: 'US-ASCII' }), [...datos()]);
      return;
    } catch (error) {
      // Sólo el rechazo de firma garantiza que nada llegó a la impresora: reintentar no duplica el ticket.
      if (!/failed to sign/i.test(error instanceof Error ? error.message : String(error))) throw error;
      if (intento >= REINTENTOS_FIRMA_MS.length) {
        const firma = ultimoErrorFirma;
        throw new ErrorFirmaQz(`El servidor no autorizó la impresión${firma ? `: ${firma}` : ''}`);
      }
      await new Promise((resolve) => setTimeout(resolve, REINTENTOS_FIRMA_MS[intento]));
    }
  }
}

// Logo y datos fiscales cambian muy poco: se piden una vez cada pocos minutos, no por ticket.
let empresa: { valor: EmpresaTicket | null; vence: number } | null = null;
async function datosEmpresa() {
  if (empresa && empresa.vence > Date.now()) return empresa.valor;
  try {
    empresa = { valor: await apiGet<EmpresaTicket | null>('/impresion/empresa'), vence: Date.now() + 5 * 60_000 };
  } catch {
    // Sin encabezado se sigue imprimiendo: una comanda no debe esperar al logo.
    empresa = { valor: empresa?.valor ?? null, vence: Date.now() + 30_000 };
  }
  return empresa.valor;
}

export async function imprimirComanda(trabajo: TrabajoImpresion) {
  const datos = await datosEmpresa();
  return imprimirRaw(trabajo.host, formatearComanda(trabajo.contenido, datos, trabajo.ancho_papel ?? 80), datos?.logo);
}

// Va directo a la impresora: no pasa por la cola ni crea comandas en el backend.
export async function imprimirPrueba(host: string, estacion: string, papel: AnchoPapel = 80) {
  if (!host.trim()) throw new Error('La estación no tiene IP de impresora configurada');
  await imprimirRaw(host, formatearPrueba(estacion, host.trim(), new Date(), papel));
}
