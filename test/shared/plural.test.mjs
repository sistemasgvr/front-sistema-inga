import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = readFileSync(new URL('../../src/shared/utils/plural.ts', import.meta.url), 'utf8');
const compiled = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: compiled, exports: compiled.exports });
const { plural } = compiled.exports;
test('uno en singular, el resto en plural', () => {
  assert.equal(plural(1, 'consumo'), '1 consumo');
  assert.equal(plural(0, 'abono'), '0 abonos');
  assert.equal(plural(3, 'día', 'días'), '3 días');
});
