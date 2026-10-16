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

export interface ComprobanteImpresion {
  nombre_tipo: string;
  numero: string;
  receptor_num_doc?: string | null;
  receptor_razon_social?: string | null;
  monto_gravado: number;
  monto_igv: number;
  monto_total: number;
}

export interface ComandaImpresion {
  tipo?: 'PRECUENTA' | 'COMPROBANTE';
  /** Marcado por Ventas al volver a encolar una comanda ya impresa. */
  reimpresion?: boolean;
  comprobante?: ComprobanteImpresion;
  pagos?: { nombre_medio: string; monto: number }[];
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
