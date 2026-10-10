export type PreferenciasImpresion = { estaciones: number[] };
export type ConfirmacionImpresion = { id: string; propietario: string; enviado: boolean; error?: string };
export type EstadoImpresion = { mensaje: string; nivel: 'inactivo' | 'ok' | 'error' | 'pausado' };
export type ContextoImpresion = {
  estaciones: number[];
  activo: boolean;
  estado: EstadoImpresion;
  configurar: (estaciones: number[]) => void;
  reanudar: () => void;
};

export interface ComandaImpresion {
  tipo?: 'PRECUENTA';
  total?: number;
  id: string;
  numero: number;
  pedido: string;
  mesa?: string;
  mozo?: string;
  estacion: string;
  fecha: string;
  tipo_pedido: number;
  observacion?: string;
  items: { cantidad: number | string; nombre_producto: string; observacion?: string; monto_subtotal?: number;
    adicionales?: { nombre: string }[] }[];
}
export interface TrabajoImpresion { id: string; host: string; contenido: ComandaImpresion; }
export interface PendienteImpresion {
  id: string; id_estacion: number; estacion: string; pedido: string;
  estado: 'pendiente' | 'procesando' | 'revision'; error?: string; actualizado: string;
}
