import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const source = leer('../../src/shared/utils/busqueda.ts');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const compiled = { exports: {} };
vm.runInNewContext(code, { module: compiled, exports: compiled.exports });
const { normalizarTexto, puntajeCoincidencia } = compiled.exports;

test('normaliza tildes, mayúsculas y espacios', () => {
  assert.equal(normalizarTexto('Categorías'), 'categorias');
  assert.equal(normalizarTexto('  Configuración '), 'configuracion');
  assert.equal(normalizarTexto('VENTAS'), 'ventas');
  assert.equal(normalizarTexto('RolÉs y Permisos'), 'roles y permisos');
});

test('el nombre que empieza igual gana', () => {
  assert.equal(puntajeCoincidencia('Catálogo', 'Productos', 'cata'), 3);
  assert.equal(puntajeCoincidencia('Catálogo', 'Productos', 'Catálogo'), 3);
});

test('sin tildes también encuentra: categoria -> Categorías', () => {
  assert.equal(puntajeCoincidencia('Categorías', 'Productos', 'categoria'), 3);
});

test('contener el nombre vale menos que empezar con él', () => {
  assert.equal(puntajeCoincidencia('Catálogo', 'Productos', 'logo'), 2);
  assert.ok(
    puntajeCoincidencia('Catálogo', 'Productos', 'cata') >
      puntajeCoincidencia('Catálogo', 'Productos', 'logo'),
  );
});

test('se puede llegar por el nombre del menú padre', () => {
  assert.equal(puntajeCoincidencia('Catálogo', 'Productos', 'product'), 1);
});

test('sin coincidencia devuelve 0 y el término vacío también', () => {
  assert.equal(puntajeCoincidencia('Catálogo', 'Productos', 'zzz'), 0);
  assert.equal(puntajeCoincidencia('Catálogo', 'Productos', '   '), 0);
});
