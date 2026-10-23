import type {
  CanalNotificacion,
  Notificacion,
  SeveridadNotificacion,
} from '../types/notificaciones.types';

const SEVERIDADES: SeveridadNotificacion[] = ['info', 'success', 'warning', 'error'];

/** Solo rutas internas de la app: "/ventas?venta=1", nunca "//host" ni "https://". */
export function esRutaInterna(ruta: unknown): ruta is string {
  return (
    typeof ruta === 'string' &&
    ruta.startsWith('/') &&
    !ruta.startsWith('//') &&
    !ruta.includes('://') &&
    !/\s/.test(ruta)
  );
}

/** Valida el payload recibido por socket o API; descarta lo que no sea una notificación. */
export function normalizarNotificacion(payload: unknown): Notificacion | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.id !== 'string' || !esRutaInterna(p.ruta)) return null;
  const severidad = SEVERIDADES.includes(p.severidad as SeveridadNotificacion)
    ? (p.severidad as SeveridadNotificacion)
    : 'info';
  return {
    id: p.id,
    canal: (typeof p.canal === 'string' ? p.canal : 'sistema') as CanalNotificacion,
    titulo: String(p.titulo ?? 'Notificación'),
    mensaje: String(p.mensaje ?? ''),
    severidad,
    ruta: p.ruta,
    idReferencia: typeof p.idReferencia === 'number' ? p.idReferencia : null,
    creadaEn: String(p.creadaEn ?? new Date().toISOString()),
    leida: Boolean(p.leida),
  };
}

/** "hace un momento", "hace 5 min", "hace 2 h", "ayer", o la fecha corta. */
export function tiempoRelativo(iso: string, ahora: number = Date.now()): string {
  const fecha = new Date(iso);
  const ms = fecha.getTime();
  if (Number.isNaN(ms)) return '';
  const minutos = Math.floor((ahora - ms) / 60_000);
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  const dd = String(fecha.getDate()).padStart(2, '0');
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${fecha.getFullYear()}`;
}

export const ICONO_CANAL: Record<CanalNotificacion, string> = {
  pedidos: 'mdi:receipt-text-outline',
  cocina: 'mdi:chef-hat',
  caja: 'mdi:cash-register',
  inventario: 'mdi:package-variant-closed',
  ventas: 'mdi:cash-check',
  planilla: 'mdi:account-cash-outline',
  'cuentas-por-pagar': 'mdi:truck-outline',
  'cuentas-por-cobrar': 'mdi:account-arrow-left-outline',
  gastos: 'mdi:wallet-outline',
  'gastos-diarios': 'mdi:cart-outline',
  sistema: 'mdi:information-outline',
};

export const COLOR_SEVERIDAD: Record<SeveridadNotificacion, string> = {
  info: 'bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400',
  success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400',
  error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
};
