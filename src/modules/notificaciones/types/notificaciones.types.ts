export type SeveridadNotificacion = 'info' | 'success' | 'warning' | 'error';
export type CanalNotificacion =
  | 'pedidos'
  | 'cocina'
  | 'caja'
  | 'inventario'
  | 'ventas'
  | 'planilla'
  | 'cuentas-por-pagar'
  | 'cuentas-por-cobrar'
  | 'gastos'
  | 'gastos-diarios'
  | 'sistema';

export interface Notificacion {
  id: string;
  canal: CanalNotificacion;
  titulo: string;
  mensaje: string;
  severidad: SeveridadNotificacion;
  ruta: string;
  idReferencia: number | null;
  creadaEn: string;
  leida: boolean;
}

export interface PaginaNotificaciones {
  registros: Notificacion[];
  total: number;
}

export type FiltroNotificaciones = 'todas' | 'no-leidas';

export interface ContextoNotificaciones {
  notificaciones: Notificacion[];
  /** No leídas según el servidor (no solo las cargadas en la lista). */
  noLeidas: number;
  /** Total de la lista con el filtro actual. */
  total: number;
  conectado: boolean;
  cargando: boolean;
  hayMas: boolean;
  filtro: FiltroNotificaciones;
  cambiarFiltro: (filtro: FiltroNotificaciones) => void;
  cargarMas: () => void;
  marcarLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
}
