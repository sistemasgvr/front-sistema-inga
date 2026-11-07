import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../../src/modules/tipos-producto/utils/tipo-permisos.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const compiled = { exports: {} };
vm.runInNewContext(code, { module: compiled, exports: compiled.exports });
const { avisosImpacto, cambiarPermiso, contarPermisos, hayCambios, extraerPermisos } = compiled.exports;

const base = { permite_venta: true, requiere_receta: false, requiere_estacion: false, permite_stock_inicial: true };
const impacto = { total: 12, sin_receta: 5, sin_estacion: 3, en_venta: 8 };

test('activar receta desmarca el stock inicial', () => {
  const result = cambiarPermiso(base, 'requiere_receta', true);
  assert.equal(result.requiere_receta, true);
  assert.equal(result.permite_stock_inicial, false);
  assert.equal(base.requiere_receta, false);
});

test('con receta activa no se puede marcar stock inicial', () => {
  const conReceta = { ...base, requiere_receta: true, permite_stock_inicial: false };
  assert.equal(cambiarPermiso(conReceta, 'permite_stock_inicial', true).permite_stock_inicial, false);
});

test('quitar receta no reactiva por sí solo el stock inicial', () => {
  const conReceta = { ...base, requiere_receta: true, permite_stock_inicial: false };
  assert.equal(cambiarPermiso(conReceta, 'requiere_receta', false).permite_stock_inicial, false);
});

test('detecta cambios y cuenta permisos activos', () => {
  assert.equal(hayCambios(base, { ...base }), false);
  assert.equal(hayCambios(base, { ...base, requiere_estacion: true }), true);
  assert.equal(contarPermisos(base), 2);
});

test('extrae solo los cuatro permisos de un tipo', () => {
  assert.deepEqual(Object.keys(extraerPermisos({ id: 1, nombre: 'A', ...base })).sort(), Object.keys(base).sort());
});

test('avisa de cada cambio que afecta a productos existentes', () => {
  const despues = { ...base, permite_venta: false, requiere_receta: true, requiere_estacion: true };
  const avisos = avisosImpacto(base, despues, impacto);
  assert.equal(avisos.length, 3);
  assert.match(avisos[0], /8 productos/);
  assert.match(avisos[1], /5 productos/);
  assert.match(avisos[2], /3 productos/);
});

test('usa singular con un solo producto afectado', () => {
  const avisos = avisosImpacto(base, { ...base, permite_venta: false }, { ...impacto, en_venta: 1 });
  assert.match(avisos[0], /^1 producto /);
});

test('no avisa si ningún producto queda afectado o el cambio no es riesgoso', () => {
  const sinAfectados = { total: 2, sin_receta: 0, sin_estacion: 0, en_venta: 0 };
  const riesgoso = { ...base, permite_venta: false, requiere_receta: true, requiere_estacion: true };
  assert.deepEqual([...avisosImpacto(base, riesgoso, sinAfectados)], []);
  const conTodo = { ...base, requiere_receta: true, requiere_estacion: true, permite_venta: false };
  assert.deepEqual([...avisosImpacto(conTodo, base, impacto)], []);
});
