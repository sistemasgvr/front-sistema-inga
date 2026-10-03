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
function setup() {
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
  const api = { apiGet: async () => ({ certificado: 'certificate' }),
    apiPost: async (url, body) => { calls.push(['sign', url, body]); return { firma: 'signature' }; } };
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
  const content = print[2][0].data;
  assert.match(content, /2 x Pollo/);
  assert.match(content, /NOTA: Sin aji/);
  assert.match(content, /\+ Limon/);
  assert.equal(content.split('\x1b').length, 2); // Sólo la inicialización, no el control de la nota.
  assert.ok(content.endsWith('\x1dV\x00'));
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
