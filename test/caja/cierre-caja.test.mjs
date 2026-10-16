import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const source = leer('../../src/modules/caja/utils/permisos-cierre.ts');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const compiled = { exports: {} };
vm.runInNewContext(code, { module: compiled, exports: compiled.exports });
const { esAdministrador, puedeCerrarTurno, mensajeQuienPuedeCerrar } = compiled.exports;

const hookPendiente = leer('../../src/modules/caja/hooks/use-turno-pendiente.ts');
const guard = leer('../../src/modules/caja/components/turno-pendiente-guard.tsx');
const modalPendiente = leer('../../src/modules/caja/components/turno-pendiente-modal.tsx');
const hookTurnos = leer('../../src/modules/caja/hooks/use-turnos.ts');
const detalle = leer('../../src/modules/caja/components/turno-detalle-modal.tsx');

const turno = { id: 10, id_cajero: 3, nombre_cajero: 'Ana Cajera' };

test('el cajero que abrió la caja puede cerrarla', () => {
  assert.equal(puedeCerrarTurno(turno, { id: 3, roles: [{ codigo: 'CAJERO' }] }), true);
});

test('un administrador puede cerrar una caja que no abrió', () => {
  assert.equal(puedeCerrarTurno(turno, { id: 7, roles: [{ codigo: 'ADMIN' }] }), true);
  assert.equal(puedeCerrarTurno(turno, { id: 1, es_super_admin: true }), true);
  assert.equal(puedeCerrarTurno(turno, { id: 1, sesion: { es_super_admin: true } }), true);
});

test('cualquier otro usuario no puede cerrarla', () => {
  assert.equal(puedeCerrarTurno(turno, { id: 8, roles: [{ codigo: 'CAJERO' }] }), false);
  assert.equal(puedeCerrarTurno(turno, { id: 8, roles: [{ codigo: 'OPERARIO' }] }), false);
  assert.equal(puedeCerrarTurno(turno, { id: 8 }), false);
  assert.equal(puedeCerrarTurno(turno, null), false);
  assert.equal(puedeCerrarTurno(null, { id: 3, roles: [{ codigo: 'ADMIN' }] }), false);
});

test('compara el id del cajero aunque llegue como texto', () => {
  assert.equal(puedeCerrarTurno({ ...turno, id_cajero: '3' }, { id: 3 }), true);
});

test('esAdministrador solo reconoce ADMIN y superadministrador', () => {
  assert.equal(esAdministrador({ id: 1, roles: [{ codigo: 'ADMIN' }] }), true);
  assert.equal(esAdministrador({ id: 1, roles: [{ codigo: 'MOZO' }] }), false);
  assert.equal(esAdministrador(undefined), false);
});

test('el texto explica quién puede cerrar la caja', () => {
  assert.equal(
    mensajeQuienPuedeCerrar(turno),
    'Solo Ana Cajera, quien abrió esta caja, o un administrador puede cerrarla.',
  );
  assert.match(mensajeQuienPuedeCerrar({ id_cajero: 3 }), /el cajero que la abrió/);
});

test('la alerta consulta la caja vigente, no solo la del usuario', () => {
  assert.match(hookPendiente, /getTurnoVigente\(\)/);
  assert.doesNotMatch(hookPendiente, /getTurnoAbierto/);
  assert.match(hookPendiente, /setPuedeCerrar\(puedeCerrarTurno\(actual, user\)\)/);
  assert.match(hookPendiente, /if \(!turno \|\| !puedeCerrar\) return;/, 'cerrar no corre sin permiso');
});

test('la alerta solo ofrece cerrar a quien puede hacerlo', () => {
  assert.match(modalPendiente, /\{puedeCerrar && \(\s*<Button/);
  assert.match(modalPendiente, /mensajeQuienPuedeCerrar\(turno\)/);
  assert.match(modalPendiente, /Abierta por/);
  assert.match(guard, /puedeCerrar=\{control\.puedeCerrar\}/);
  assert.match(guard, /\{control\.puedeCerrar && \(\s*<CierreTurnoModal/);
});

test('el historial deja cerrar desde el detalle con la misma regla', () => {
  assert.match(hookTurnos, /puedeCerrarTurno\(detalle\?\.turno, usuario\)/);
  assert.match(hookTurnos, /if \(!turno \|\| !puedeCerrar\) return;/);
  assert.match(detalle, /puedeCerrar \? \(/);
  assert.match(detalle, /mensajeQuienPuedeCerrar\(turno\)/);
});
