export type SeveridadNotificacion = 'info' | 'success' | 'warning' | 'error';
export type CanalNotificacion = 'pedidos' | 'cocina' | 'caja' | 'inventario' | 'ventas' | 'cuentas-por-pagar' | 'cuentas-por-cobrar' | 'gastos' | 'gastos-diarios' | 'sistema';

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

export interface ContextoNotificaciones {
  notificaciones: Notificacion[];
  noLeidas: number;
  conectado: boolean;
  marcarLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
  limpiar: () => void;
}
