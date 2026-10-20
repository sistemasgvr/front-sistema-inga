import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto, createHash } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
const testDirectory = dirname(fileURLToPath(import.meta.url));

function load(file, imports = {}) {
  const source = readFileSync(resolve(testDirectory, '../../src/modules/impresion', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(code, { exports: compiledModule.exports, module: compiledModule, TextEncoder, crypto: webcrypto,
    require: (id) => { if (!(id in imports)) throw new Error(`Unexpected import ${id}`); return imports[id]; },
  });
  return compiledModule.exports;
}
const comanda = load('utils/comanda.ts');
const ticket = { id: '42', numero: 1, pedido: 'P-1', mesa: 'M5', mozo: 'José', estacion: 'Cocina',
  fecha: '2026-10-03T15:00:00Z', tipo_pedido: 1,
  items: [{ cantidad: 2, nombre_producto: 'Pollo', observacion: 'Sin ají\x1b@', adicionales: [{ nombre: 'Limón' }] }],
};
// Quita los comandos ESC/POS para comparar sólo el texto impreso.
const limpio = (data) => data.replace(/\x1b@|\x1b[aE][\s\S]|\x1d![\s\S]|\x1dV[\s\S]/g, '');
function setup(empresa = null, rechazoFirma = null) {
  let active = false;
  const calls = [];
  const security = {};
  const qz = {
    api: { setSha256Type: (hasher) => { security.hash = hasher; } },
    websocket: { isActive: () => active, connect: async () => { calls.push(['connect']); active = true; } },
    security: { setCertificatePromise: () => {}, setSignatureAlgorithm: () => {},
      setSignaturePromise: (signer) => { security.sign = signer; } },
    socket: { open: async (...args) => calls.push(['open', ...args]), close: async (...args) => calls.push(['close', ...args]) },
    configs: { create: (config) => config },
    print: async (...args) => calls.push(['print', ...args]),
  };
  const api = {
    apiGet: async (url) => {
      if (url !== '/impresion/empresa') return { certificado: 'certificate' };
      calls.push(['get', url]);
      if (empresa instanceof Error) throw empresa;
      return empresa;
    },
    apiPost: async (url, body) => {
      calls.push(['sign', url, body]);
      if (rechazoFirma) throw new Error(rechazoFirma);
      return { firma: 'signature' };
    } };
  const service = load('services/qz.service.ts', { 'qz-tray': qz, '@/shared/api/api-client': api, '../utils/comanda': comanda });
  return { service, qz, calls, security };
}

test('dos solicitudes simultáneas comparten una conexión QZ', async () => {
  const { service, calls } = setup();
  await Promise.all([service.conectarQz(), service.conectarQz()]);
  assert.equal(calls.filter(([name]) => name === 'connect').length, 1);
});
test('la prueba de conexión abre/cierra TCP sin enviar un ticket', async () => {
  const { service, calls } = setup();
  await service.probarConexion('192.168.1.101');
  assert.equal(JSON.stringify(calls), JSON.stringify([['connect'], ['open', '192.168.1.101', 9100], ['close', '192.168.1.101', 9100]]));
});
test('la firma envía el mensaje original al backend, no sólo el hash opaco', async () => {
  const { service, calls, security } = setup();
  await service.conectarQz();
  const message = JSON.stringify({ call: 'socket.open', params: { host: '192.168.1.101', port: 9100 }, timestamp: 123 });
  const hash = await security.hash(message);
  assert.equal(hash, createHash('sha256').update(message).digest('hex'));
  assert.equal(await new Promise(security.sign(hash)), 'signature');
  assert.equal(calls.find(([name]) => name === 'sign')[2].mensaje, message);
});
test('el ticket contiene ítems, notas y adicionales y elimina controles inyectados', async () => {
  const { service, calls } = setup();
  await service.imprimirComanda({ id: '42', host: '192.168.1.101', contenido: ticket });
  const print = calls.find(([name]) => name === 'print');
  assert.equal(print[1].host, '192.168.1.101');
  assert.equal(print[2].length, 1); // Sin logo configurado no se envía imagen.
  const content = print[2][0].data;
  assert.match(limpio(content), /CANT PRODUCTO\n-{32}\n2 {4}Pollo\n {5}\+ Limon\n {5}NOTA: Sin aji@\n/);
  assert.doesNotMatch(content, /Sin aji\x1b/); // El ESC inyectado en la nota se descarta.
  assert.ok(content.endsWith('\x1dV\x00'));
});
test('la comanda destaca la mesa en tamaño grande y lista los datos del pedido', () => {
  const content = comanda.formatearComanda(ticket);
  assert.match(content, /\x1d!\x01MESA\x1d!\x00\n\x1d!\x22M5\x1d!\x00/); // «MESA» a doble alto y el número al triple.
  assert.match(limpio(content), /Comanda: 42 \/ Lote 1\nFecha: {3}03\/10\/2026 10:00\nPedido: {2}P-1\nMozo: {4}Jose\n/);
  assert.match(limpio(comanda.formatearComanda({ ...ticket, mesa: undefined, tipo_pedido: 3 })), /DELIVERY/);
});
test('el logo se imprime centrado como imagen antes del texto y se pide una sola vez', async () => {
  const { service, calls } = setup({ ruc: '20123456789', razon_social: 'Inga SAC', direccion: 'Av. Sol 1', logo: 'iVBORw0KGgo=' });
  await service.imprimirComanda({ id: '42', host: '192.168.1.101', contenido: ticket });
  await service.imprimirComanda({ id: '43', host: '192.168.1.101', contenido: ticket });
  const [, , data] = calls.find(([name]) => name === 'print');
  assert.equal(data[0].data, '\x1b@\x1ba\x01');
  assert.equal(JSON.stringify(data[1]), JSON.stringify({ type: 'raw', format: 'image', flavor: 'base64', data: 'iVBORw0KGgo=',
    options: { language: 'ESCPOS', dotDensity: 'double' } }));
  assert.match(data[2].data, /Pollo/);
  assert.equal(calls.filter(([name, url]) => name === 'get' && url === '/impresion/empresa').length, 1);
});
test('si no se pueden leer los datos de la empresa, la comanda se imprime igual', async () => {
  const { service, calls } = setup(new Error('500'));
  await service.imprimirComanda({ id: '42', host: '192.168.1.101', contenido: ticket });
  const [, , data] = calls.find(([name]) => name === 'print');
  assert.equal(data.length, 1);
  assert.match(data[0].data, /Pollo/);
});
test('la precuenta muestra mesa, pedido, mozo y fecha alineados, con subtotales y total', () => {
  const content = limpio(comanda.formatearComanda({ ...ticket, tipo: 'PRECUENTA', total: 41.5,
    items: [{ cantidad: 2, nombre_producto: 'Arroz con pato a la chiclayana', monto_subtotal: 41.5, observacion: 'Sin sal',
      adicionales: [{ nombre: 'Crema' }] }] }));
  assert.match(content, /PRECUENTA\nNo valido como comprobante de pago\n-{32}\nMesa: {4}M5\nPedido: {2}P-1\nMozo: {4}Jose\nFecha: {3}03\/10\/2026 10:00/);
  assert.match(content, /CANT PRODUCTO {11}SUBTOTAL\n/);
  assert.match(content, /\n2 {4}Arroz con pato a +41\.50\n {5}la chiclayana\n {5}\+ Crema\n/);
  assert.match(content, /\n {17}TOTAL {2}S\/ 41\.50\n/);
  assert.doesNotMatch(content, /NOTA/); // Las notas son para cocina, no para el cliente.
});
test('un fallo de QZ permite intentar una nueva conexión y no imprime', async () => {
  const { service, qz, calls } = setup();
  qz.websocket.connect = async () => { throw new Error('offline'); };
  await assert.rejects(service.conectarQz(), /Instálalo/);
  qz.websocket.connect = async () => { calls.push(['retry']); };
  await service.conectarQz();
  assert.equal(calls.filter(([name]) => name === 'retry').length, 1);
  assert.equal(calls.filter(([name]) => name === 'print').length, 0);
});
test('la hoja de prueba imprime directo en la IP de la estación sin pasar por la cola', async () => {
  const { service, calls } = setup();
  await service.imprimirPrueba(' 192.168.1.50 ', 'Cocina Ñoña');
  const [, config, [job]] = calls.find(([name]) => name === 'print');
  assert.equal(JSON.stringify(config), JSON.stringify({ host: '192.168.1.50', port: 9100 }));
  assert.match(job.data, /HOJA DE PRUEBA\nCOCINA NONA\nImpresora: 192\.168\.1\.50:9100/);
  assert.ok(!calls.some(([name, url]) => name === 'sign' && !String(url).includes('qz')));
  await assert.rejects(service.imprimirPrueba('  ', 'Cocina'), /IP de impresora/);
});
test('el comprobante impreso desde Ventas lleva número, empresa, receptor, totales y medios de pago', () => {
  const crudo = comanda.formatearComanda({ ...ticket, tipo: 'COMPROBANTE', total: 80,
    items: [{ cantidad: 1, nombre_producto: 'Barco criollo', monto_subtotal: 80 }],
    comprobante: { nombre_tipo: 'BOLETA DE VENTA', numero: 'B001-00000002', receptor_num_doc: '12345678',
      receptor_razon_social: 'Ana Pérez', monto_gravado: 67.8, monto_igv: 12.2, monto_total: 80 },
    pagos: [{ nombre_medio: 'Yape', monto: 80 }] },
  { ruc: '20123456789', razon_social: 'Restaurante Inga S.A.C.', direccion: 'Av. Perú 123 - Lima', logo: null });
  const contenido = limpio(crudo);
  assert.match(crudo, /BOLETA DE VENTA\n\x1d!\x11B001-00000002/); // Número a doble tamaño.
  assert.match(contenido, /B001-00000002\n\nRestaurante Inga S\.A\.C\.\nRUC 20123456789\nAv\. Peru 123 - Lima\n-{32}\nFecha: {3}03\/10\/2026 10:00\nPedido: {2}P-1 - Mesa M5\nCliente: Ana Perez\nDNI: {5}12345678\n/);
  assert.match(contenido, /\n1 {4}Barco criollo +80\.00\n/);
  assert.match(contenido, /\n {11}OP\. GRAVADA {2}S\/ 67\.80\n {19}IGV {2}S\/ 12\.20\n {17}TOTAL {2}S\/ 80\.00\n/);
  assert.match(contenido, /Yape {2}S\/ 80\.00/);
  assert.doesNotMatch(contenido, /COMANDA|QR/);
});
test('una comanda reimpresa se marca para no confundirla con un pedido nuevo', () => {
  assert.match(comanda.formatearComanda({ ...ticket, reimpresion: true }), /\*\*\* REIMPRESION \*\*\*\n/);
  assert.doesNotMatch(comanda.formatearComanda(ticket), /REIMPRESION/);
});
test('si el servidor no firma, se informa el motivo y se marca como reintentable (no salió papel)', async () => {
  const { service, qz, security } = setup(null, 'Sólo se permite texto de comanda RAW');
  await service.conectarQz();
  // Igual que QZ Tray: pide la firma y, si se rechaza, sólo informa «Failed to sign request».
  qz.print = async () => {
    const hash = await security.hash(JSON.stringify({ call: 'print', timestamp: 1 }));
    try { await new Promise(security.sign(hash)); } catch { throw new Error('Failed to sign request'); }
  };
  await assert.rejects(service.imprimirPrueba('192.168.1.101', 'Cocina'), (error) => {
    assert.ok(error instanceof service.ErrorFirmaQz);
    assert.match(error.message, /Sólo se permite texto de comanda RAW/);
    return true;
  });
});
test('un error de la impresora no se confunde con un rechazo de firma', async () => {
  const { service, qz } = setup();
  qz.print = async () => { throw new Error('Connection refused'); };
  await assert.rejects(service.imprimirPrueba('192.168.1.101', 'Cocina'), (error) => !(error instanceof service.ErrorFirmaQz));
});
