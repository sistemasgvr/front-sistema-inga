export const LISTA_IDS = {
  // Pendientes: reemplazar 0 con los IDs reales de gen_lista al configurar la BD.
  ALM_TIPO_MOVIMIENTO: 0 as number,
  ALM_MOTIVO_MOVIMIENTO: 0 as number,
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
