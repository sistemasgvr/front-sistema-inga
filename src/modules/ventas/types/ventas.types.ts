import type { EstadoSunat } from "@/modules/sunat";

export type PagoResumen = {
  id: number;
  medio_pago: number;
  nombre_medio: string;
  monto: number;
};

/** Fila del listado: un pedido cobrado con su comprobante vigente. */
export type VentaItem = {
  id: number;
  codigo: string;
  tipo_pedido: number;
  id_sucursal: number;
  monto_total: number;
  fecha_apertura: string;
  fecha_cierre: string | null;
  codigo_mesa: string | null;
  nombre_mozo: string | null;
  nombre_cliente: string | null;
  id_comprobante: number | null;
  tipo_comprobante: number | null;
  numero_comprobante: string | null;
  receptor_num_doc: string | null;
  receptor_razon_social: string | null;
  /** Estado SUNAT del comprobante vigente (boleta/factura). */
  estado_sunat: EstadoSunat | null;
  fecha_limite_envio: string | null;
  reemitido: boolean;
  pagos: PagoResumen[];
  cajas: string | null;
  caja_cerrada: boolean;
};

export type VentasResumen = {
  cantidad: number;
  monto_total: number;
  por_medio: { medio_pago: number; nombre_medio: string; monto: number }[];
};

export type FiltrosVentas = {
  buscar: string;
  fecha_desde: string;
  fecha_hasta: string;
  tipo_comprobante: string;
  medio_pago: string;
  estado_sunat: string;
};

export type ListVentasParams = Partial<FiltrosVentas> & {
  pagina: number;
  limite: number;
};

export type ListVentasResult = {
  registros: VentaItem[];
  total: number;
  resumen?: VentasResumen;
};

export type PagoVenta = PagoResumen & {
  estado: number;
  id_comprobante: number | null;
  id_turno: number | null;
  estado_turno: number | null;
  id_caja: number | null;
  nombre_caja: string | null;
  fecha_creacion: string;
  fecha_modificacion: string;
  usuario: string | null;
};

export type ComprobanteVenta = {
  id: number;
  tipo_comprobante: number;
  serie: string;
  correlativo: string;
  numero: string;
  receptor_tipo_doc: number | null;
  receptor_num_doc: string | null;
  receptor_razon_social: string | null;
  monto_gravado: number;
  monto_igv: number;
  monto_total: number;
  fecha_emision: string;
  estado: number;
  id_comprobante_origen: number | null;
  estado_sunat: EstadoSunat;
  sunat_mensaje: string | null;
  codigo_respuesta_sunat: string | null;
  observaciones_sunat: string | null;
  fecha_limite_envio: string | null;
  fecha_envio_sunat: string | null;
  forma_envio: 1 | 2 | null;
  tiene_xml: boolean;
  tiene_cdr: boolean;
  items: {
    descripcion: string;
    cantidad: number;
    unidad: string | null;
    precio_unitario: number;
    monto_total: number;
  }[];
};

export type ComandaVenta = {
  id: number;
  numero: number;
  id_estacion: number;
  estacion: string | null;
  fecha_envio: string;
  tipo: "COMANDA" | "PRECUENTA" | "COMPROBANTE";
  estado_impresion: "pendiente" | "procesando" | "enviado" | "revision" | null;
  error_impresion: string | null;
  cantidad_items: number;
};

export type VentaDetalle = {
  id: number;
  codigo: string;
  tipo_pedido: number;
  codigo_mesa: string | null;
  nombre_mozo: string | null;
  nombre_cliente: string | null;
  monto_subtotal: number;
  monto_igv: number;
  monto_total: number;
  fecha_cierre: string | null;
  items: {
    id: number;
    nombre_producto: string;
    cantidad: number;
    cantidad_cancelada: number;
    precio_unitario: number;
    monto_subtotal: number;
    tipo_linea: number;
  }[];
  pagos: PagoVenta[];
  comprobantes: ComprobanteVenta[];
  comandas_impresion: ComandaVenta[];
};

export type ReemitirValues = {
  tipo_comprobante: number;
  documento?: string;
};
