import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = readFileSync(new URL('../../src/shared/utils/decimal.ts', import.meta.url), 'utf8');
const compiled = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: compiled, exports: compiled.exports });
const { normalizarDecimal, validarDecimal } = compiled.exports;
test('coma y punto representan doscientos gramos expresados en kg', () => {
  for (const value of ['0.200', '0,200', ',2', '.2']) {
    assert.equal(Number(normalizarDecimal(value)), 0.2);
    assert.equal(validarDecimal(value, '0.0001', undefined, 0.0001), '');
  }
});
test('rechaza separadores mezclados y cantidades fuera del rango', () => {
  for (const value of ['1,2.3', '1,2,3', 'NaN', 'Infinity', 'abc']) assert.notEqual(validarDecimal(value), '');
  assert.notEqual(validarDecimal('-1', '0'), '');
  assert.notEqual(validarDecimal('101', '0', '100'), '');
  assert.notEqual(validarDecimal('0.001', '0', undefined, 0.01), '');
});
test('permite valores de edición intermedios sin reemplazar su texto', () => {
  assert.equal(normalizarDecimal('0,'), '0.');
  assert.equal(validarDecimal(''), '');
  assert.equal(validarDecimal('12,50', '0', undefined, 0.01), '');
});
