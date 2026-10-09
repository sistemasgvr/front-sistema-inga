import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../../src/modules/productos/utils/producto-reglas.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const compiled = { exports: {} };
vm.runInNewContext(code, { module: compiled, exports: compiled.exports });
const { aplicarReglasTipo } = compiled.exports;
const producto = { nombre: 'Prueba', codigo_interno: 'P1', tipo_producto: 3, precio_venta: 20,
  disponible_venta: true, controla_stock: true, id_almacen_stock: 4, id_estacion: 2,
  tiempo_prep_min: 15, stock_inicial: 10, costo_inicial: 5, stock_minimo: 3 };

test('un tipo nuevo limpia venta y estación sin perder nombre ni almacén', () => {
  const result = aplicarReglasTipo(producto, { id: 81, permite_venta: false, requiere_receta: false,
    requiere_estacion: false, permite_stock_inicial: true });
  assert.equal(result.tipo_producto, 81);
  assert.equal(result.nombre, 'Prueba');
  assert.equal(result.precio_venta, 0);
  assert.equal(result.disponible_venta, false);
  assert.equal(result.id_estacion, null);
  assert.equal(result.tiempo_prep_min, null);
  assert.equal(result.id_almacen_stock, 4);
  assert.equal(result.stock_inicial, 10);
  assert.equal(producto.precio_venta, 20);
});

test('prohibir saldo inicial conserva control de stock y stock mínimo', () => {
  const result = aplicarReglasTipo(producto, { id: 95, permite_venta: true, requiere_receta: true,
    requiere_estacion: true, permite_stock_inicial: false });
  assert.equal(result.stock_inicial, 0);
  assert.equal(result.costo_inicial, 0);
  assert.equal(result.controla_stock, true);
  assert.equal(result.stock_minimo, 3);
  assert.equal(result.id_estacion, 2);
  assert.equal(result.precio_venta, 20);
});

test('desactivar stock limpia todos los datos de inventario aunque el tipo permita saldo inicial', () => {
  const result = aplicarReglasTipo({ ...producto, controla_stock: false }, { id: 81, permite_venta: true,
    requiere_receta: false, requiere_estacion: false, permite_stock_inicial: true });
  assert.equal(result.id_almacen_stock, null);
  assert.equal(result.stock_inicial, 0);
  assert.equal(result.costo_inicial, 0);
  assert.equal(result.stock_minimo, 0);
});
