/** Ancho del rollo de la impresora térmica, en milímetros. */
export type AnchoPapel = 58 | 80;
export type PreferenciasImpresion = { estaciones: number[] };
export type ConfirmacionImpresion = { id: string; propietario: string; enviado: boolean; error?: string; reintentable?: boolean };
export type EstadoImpresion = { mensaje: string; nivel: 'inactivo' | 'ok' | 'error' | 'pausado' };
export type ContextoImpresion = {
  estaciones: number[];
  activo: boolean;
  estado: EstadoImpresion;
  configurar: (estaciones: number[]) => void;
  reanudar: () => void;
};

/** Encabezado de los tickets (Configuración → Empresa). `logo`: PNG blanco y negro en base64. */
export interface EmpresaTicket {
  ruc: string | null;
  razon_social: string | null;
  direccion: string | null;
  logo: string | null;
}

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
export interface TrabajoImpresion { id: string; id_estacion: number; host: string; ancho_papel?: AnchoPapel; contenido: ComandaImpresion; }
export interface PendienteImpresion {
  id: string; id_estacion: number; estacion: string; pedido: string;
  estado: 'pendiente' | 'procesando' | 'revision'; error?: string; actualizado: string;
}
