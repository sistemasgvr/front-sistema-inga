/** ven_comprobante.estado_sunat: 0 no aplica, 1 pendiente, 2 aceptado, 3 rechazado, 4 anulado, 5 en proceso. */
export type EstadoSunat = 0 | 1 | 2 | 3 | 4 | 5;

/** Configuración SUNAT de la empresa. El backend nunca devuelve los secretos, solo si están cargados. */
export interface ConfiguracionSunat {
  proveedor: string;
  idAmbiente: 1 | 2;
  tieneToken: boolean;
  tieneUsuarioSol: boolean;
  /** Usuario SOL enmascarado (solo los últimos 4 caracteres visibles). */
  usuarioSol: string | null;
  tieneClaveSol: boolean;
  tieneCertificado: boolean;
  certificadoTitular: string | null;
  certificadoVence: string | null;
  diasLimiteEnvioBoleta: number;
  diasLimiteEnvioFactura: number;
  /** false si el API no tiene SUNAT_CRYPTO_KEY: no se pueden guardar credenciales. */
  cifradoConfigurado: boolean;
  /** Datos que faltan en Empresa para que SUNAT acepte los comprobantes. */
  datosEmpresaFaltantes: string[];
  fechaModificacion: string | null;
}

export interface ConfiguracionSunatValues {
  tokenEmision: string;
  idAmbiente: 1 | 2;
  usuarioSol: string;
  claveSol: string;
  diasLimiteEnvioBoleta: number;
  diasLimiteEnvioFactura: number;
}

/** Estado SUNAT de un comprobante (GET /sunat/comprobantes/:id). */
export interface ComprobanteSunat {
  id: number;
  idPedido: number;
  tipoComprobante: number;
  numero: string;
  estado: number;
  estadoSunat: EstadoSunat;
  formaEnvio: 1 | 2 | null;
  codigoRespuesta: string | null;
  mensaje: string | null;
  observaciones: string | null;
  hash: string | null;
  fechaEmision: string;
  fechaLimiteEnvio: string | null;
  fechaEnvio: string | null;
  intentos: number;
  montoTotal: number;
  tieneXml: boolean;
  tieneCdr: boolean;
  tienePdfA4: boolean;
}

export interface HistorialSunat {
  id: number;
  operacion: string;
  exito: boolean;
  codigo: string | null;
  mensaje: string | null;
  id_lote: number | null;
  fecha_creacion: string;
}

/** Fila de la bandeja (pendientes, en proceso y rechazados). */
export interface BandejaItem {
  id: number;
  id_pedido: number;
  tipo_comprobante: number;
  numero: string;
  receptor_num_doc: string | null;
  receptor_razon_social: string | null;
  monto_total: number;
  estado: number;
  estado_sunat: EstadoSunat;
  sunat_mensaje: string | null;
  codigo_respuesta_sunat: string | null;
  fecha_emision: string;
  fecha_limite_envio: string | null;
  fecha_envio_sunat: string | null;
  intentos_envio: number;
  por_vencer: boolean;
}

export interface ComprobanteDia {
  id: number;
  idPedido: number;
  tipoComprobante: number;
  numero: string;
  receptorNumDoc: string | null;
  receptorRazonSocial: string | null;
  montoTotal: number;
  estado: number;
  estadoSunat: EstadoSunat;
  formaEnvio: 1 | 2 | null;
  sunatMensaje: string | null;
  fechaLimiteEnvio: string | null;
  fechaEmision: string;
}

export interface ResumenDia {
  fecha: string;
  grupos: {
    tipoComprobante: number;
    nombreTipo: string;
    cantidad: number;
    pendientes: number;
    porEstado: { estadoSunat: EstadoSunat; nombreEstado: string; cantidad: number; monto: number }[];
  }[];
  comprobantes: ComprobanteDia[];
}

export interface ResultadoEnvioDia {
  fecha: string;
  facturas: { total: number; enviadas: number; aceptadas: number; rechazadas: number; errores: string[] };
  boletas: { total: number; resumenes: ({ identificador?: string; estado_sunat?: number } & { error?: string; cantidad?: number })[] };
}

/** Resumen diario (RC, tipo 1) o comunicación de baja (RA, tipo 2). */
export interface LoteSunat {
  id: number;
  tipo_lote: 1 | 2;
  identificador: string;
  fecha_documentos: string;
  fecha_envio: string;
  ticket: string | null;
  estado_sunat: EstadoSunat;
  codigo_respuesta_sunat: string | null;
  sunat_mensaje: string | null;
  intentos_consulta?: number;
  tiene_xml: boolean;
  tiene_cdr: boolean;
  fecha_creacion: string;
  cantidad?: number;
  comprobantes?: {
    id: number;
    numero: string;
    tipo_comprobante: number;
    estado_item: 1 | 3;
    motivo: string | null;
    monto_total: number;
    estado_sunat: EstadoSunat;
  }[];
}
