/**
 * Listas de gen_lista por su código. El código es la referencia estable entre
 * bases de datos (el id cambia de una instalación a otra) y es el mismo que usan
 * las funciones SQL, incluida la facturación SUNAT.
 */
export const LISTAS = {
  PRODUCTO_TIPO: "PRODUCTO_TIPO",
  ALMACEN_TIPO: "ALMACEN_TIPO",
  ESTACION_TIPO: "ESTACION_TIPO",
  KARDEX_TIPO: "KARDEX_TIPO",
  PEDIDO_TIPO: "PEDIDO_TIPO",
  PEDIDO_ESTADO: "PEDIDO_ESTADO",
  MESA_ESTADO: "MESA_ESTADO",
  MEDIO_PAGO: "MEDIO_PAGO",
  COMPROBANTE_TIPO: "COMPROBANTE_TIPO",
  LINEA_TIPO: "LINEA_TIPO",
  PREP_ESTADO: "PREP_ESTADO",
  SUNAT_ESTADO: "SUNAT_ESTADO",
  SUNAT_AMBIENTE: "SUNAT_AMBIENTE",
  SUNAT_FORMA_ENVIO: "SUNAT_FORMA_ENVIO",
  PERSONA_TIPO: "PERSONA_TIPO",
  DOCUMENTO_TIPO: "DOCUMENTO_TIPO",
  SALIDA_DESTINO: "SALIDA_DESTINO",
  TURNO_ESTADO: "TURNO_ESTADO",
  CAJA_MOV_TIPO: "CAJA_MOV_TIPO",
  PROD_TIPO: "PROD_TIPO",
  REQ_ESTADO: "REQ_ESTADO",
  ALM_TIPO_MOVIMIENTO: "ALM_TIPO_MOVIMIENTO",
  ALM_MOTIVO_MOVIMIENTO: "ALM_MOTIVO_MOVIMIENTO",
} as const;

export type NombreLista = keyof typeof LISTAS;
/** Código de una lista de gen_lista. */
export type CodigoLista = (typeof LISTAS)[NombreLista];
