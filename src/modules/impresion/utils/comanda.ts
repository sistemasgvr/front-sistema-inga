import type { ComandaImpresion } from '../types/impresion.types';

// ASCII portable: evita seleccionar una tabla de caracteres distinta en cada impresora.
const texto = (value: unknown) => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e\n]/g, '').slice(0, 2000);

export function formatearComanda(comanda: ComandaImpresion): string {
  const lineas = [texto(comanda.estacion).toUpperCase(),
    comanda.tipo==='PRECUENTA'?'PRECUENTA - NO ES COMPROBANTE':`COMANDA ${texto(comanda.id)} / LOTE ${comanda.numero}`,
    `Pedido: ${texto(comanda.pedido)}`,
    `Mesa: ${texto(comanda.mesa || (comanda.tipo_pedido === 3 ? 'DELIVERY' : 'PARA LLEVAR'))}`,
    `Mozo: ${texto(comanda.mozo)}`,
    new Date(comanda.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima' }),
    '--------------------------------',
    ...comanda.items.flatMap((item) => [
      `${Number(item.cantidad)} x ${texto(item.nombre_producto)}`,
      ...(comanda.tipo==='PRECUENTA'?[`  S/ ${Number(item.monto_subtotal ?? 0).toFixed(2)}`]:[]),
      ...(item.adicionales ?? []).map((a) => `  + ${texto(a.nombre)}`),
      ...(item.observacion ? [`  NOTA: ${texto(item.observacion)}`] : []),
    ]),
    ...(comanda.observacion ? ['--------------------------------', texto(comanda.observacion)] : []),
    ...(comanda.tipo==='PRECUENTA'?['--------------------------------',`TOTAL S/ ${Number(comanda.total).toFixed(2)}`]:[]),
    '--------------------------------', '', '', '',
  ];
  return '\x1b@' + lineas.join('\n') + '\n\x1dV\x00';
}

export function formatearPrueba(estacion: string, host: string, fecha = new Date()): string {
  const lineas = ['HOJA DE PRUEBA', texto(estacion).toUpperCase(), `Impresora: ${texto(host)}:9100`,
    fecha.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
    '--------------------------------',
    'Si lees este ticket, la estacion', 'imprime correctamente desde esta PC.',
    '--------------------------------', '', '', '',
  ];
  return '\x1b@' + lineas.join('\n') + '\n\x1dV\x00';
}
