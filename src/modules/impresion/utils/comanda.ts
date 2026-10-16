import type { ComandaImpresion } from '../types/impresion.types';

// ASCII portable: evita seleccionar una tabla de caracteres distinta en cada impresora.
const texto = (value: unknown) => String(value ?? '').normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e\n]/g, '').slice(0, 2000);

const soles = (valor: unknown) => `S/ ${Number(valor ?? 0).toFixed(2)}`;
const SEPARADOR = '--------------------------------';

export function formatearComanda(comanda: ComandaImpresion): string {
  if (comanda.tipo === 'COMPROBANTE') return formatearComprobante(comanda);
  const lineas = [texto(comanda.estacion).toUpperCase(),
    ...(comanda.reimpresion ? ['*** REIMPRESION ***'] : []),
    comanda.tipo==='PRECUENTA'?'PRECUENTA - NO ES COMPROBANTE':`COMANDA ${texto(comanda.id)} / LOTE ${comanda.numero}`,
    `Pedido: ${texto(comanda.pedido)}`,
    `Mesa: ${texto(comanda.mesa || (comanda.tipo_pedido === 3 ? 'DELIVERY' : 'PARA LLEVAR'))}`,
    `Mozo: ${texto(comanda.mozo)}`,
    new Date(comanda.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima' }),
    SEPARADOR,
    ...comanda.items.flatMap((item) => [
      `${Number(item.cantidad)} x ${texto(item.nombre_producto)}`,
      ...(comanda.tipo==='PRECUENTA'?[`  S/ ${Number(item.monto_subtotal ?? 0).toFixed(2)}`]:[]),
      ...(item.adicionales ?? []).map((a) => `  + ${texto(a.nombre)}`),
      ...(item.observacion ? [`  NOTA: ${texto(item.observacion)}`] : []),
    ]),
    ...(comanda.observacion ? [SEPARADOR, texto(comanda.observacion)] : []),
    ...(comanda.tipo==='PRECUENTA'?[SEPARADOR,`TOTAL S/ ${Number(comanda.total).toFixed(2)}`]:[]),
    SEPARADOR, '', '', '',
  ];
  return '\x1b@' + lineas.join('\n') + '\n\x1dV\x00';
}

/** Ticket del comprobante emitido (Ventas → Imprimir). Todavía no hay envío a SUNAT. */
function formatearComprobante(comanda: ComandaImpresion): string {
  const c = comanda.comprobante;
  const receptor = c?.receptor_num_doc && c.receptor_num_doc !== '00000000'
    ? [`Cliente: ${texto(c.receptor_razon_social)}`, `Doc: ${texto(c.receptor_num_doc)}`]
    : [`Cliente: ${texto(c?.receptor_razon_social || 'CLIENTES VARIOS')}`];
  const lineas = [
    texto(c?.nombre_tipo).toUpperCase(),
    texto(c?.numero),
    new Date(comanda.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima' }),
    `Pedido: ${texto(comanda.pedido)} - ${texto(comanda.mesa ? `Mesa ${comanda.mesa}` : comanda.tipo_pedido === 3 ? 'DELIVERY' : 'PARA LLEVAR')}`,
    ...receptor,
    SEPARADOR,
    ...comanda.items.flatMap((item) => [
      `${Number(item.cantidad)} x ${texto(item.nombre_producto)}`,
      `  ${soles(item.monto_subtotal)}`,
    ]),
    SEPARADOR,
    `Op. gravada  ${soles(c?.monto_gravado)}`,
    `IGV          ${soles(c?.monto_igv)}`,
    `TOTAL        ${soles(c?.monto_total ?? comanda.total)}`,
    ...(comanda.pagos ?? []).map((p) => `${texto(p.nombre_medio)}: ${soles(p.monto)}`),
    SEPARADOR, '', '', '',
  ];
  return '\x1b@' + lineas.join('\n') + '\n\x1dV\x00';
}

export function formatearPrueba(estacion: string, host: string, fecha = new Date()): string {
  const lineas = ['HOJA DE PRUEBA', texto(estacion).toUpperCase(), `Impresora: ${texto(host)}:9100`,
    fecha.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
    SEPARADOR,
    'Si lees este ticket, la estacion', 'imprime correctamente desde esta PC.',
    SEPARADOR, '', '', '',
  ];
  return '\x1b@' + lineas.join('\n') + '\n\x1dV\x00';
}
