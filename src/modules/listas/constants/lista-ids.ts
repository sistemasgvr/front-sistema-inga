/**
 * IDs reales de gen_lista, confirmados con los datos proporcionados por el usuario.
 * Administrar aquí la correspondencia al agregar o cambiar una lista.
 * Consultar: SELECT id, codigo FROM gen_lista ORDER BY id;
 */
export const LISTA_IDS = {
  ALMACEN_TIPO: 1,
  ESTACION_TIPO: 2,
  PRODUCTO_TIPO: 3,
  KARDEX_TIPO: 6,
  PEDIDO_TIPO: 7,
  PEDIDO_ESTADO: 8,
  MESA_ESTADO: 9,
  MEDIO_PAGO: 10,
  COMPROBANTE_TIPO: 11,
  LINEA_TIPO: 12,
  PREP_ESTADO: 13,
  SUNAT_ESTADO: 14,
  PERSONA_TIPO: 15,
  DOCUMENTO_TIPO: 16,
  SALIDA_DESTINO: 17,
  TURNO_ESTADO: 18,
  CAJA_MOV_TIPO: 19,
  PROD_TIPO: 20,
  REQ_ESTADO: 21,
} as const;

export type NombreLista = keyof typeof LISTA_IDS;
