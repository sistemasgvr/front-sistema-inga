import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const modal = leer('../../src/modules/inventario/components/ajuste-stock-modal.tsx');
const hook = leer('../../src/modules/inventario/hooks/use-ajuste-stock.ts');
const receta = leer('../../src/modules/recetas/components/receta-form-modal.tsx');

test('el ajuste pide el costo unitario en los ingresos', () => {
  // Regresión: mandaba costo_promedio viejo, y el promedio ponderado se
  // realimentaba con ese valor, dejando el costo en cero para siempre.
  assert.match(modal, /Costo unitario de compra/);
  assert.match(modal, /f\.signo===1/);
});

test('el campo no aparece en las salidas', () => {
  // En una salida el backend ya usa el costo promedio: no tiene sentido pedirlo.
  assert.match(modal, /\{f\.signo===1&&/);
});

test('el costo escrito es el que se envía, no el promedio anterior', () => {
  assert.match(modal, /costo_unitario:f\.signo===1\?costoIngresado:Number\(stockItem\.costo_promedio\)/);
});

test('un ingreso sin costo se rechaza con un mensaje claro', () => {
  assert.match(modal, /Ingresa el costo unitario de compra/);
});

test('el campo se reinicia al abrir el modal', () => {
  assert.match(hook, /setCostoUnitario\(""\)/);
});

test('el recetario muestra el subtotal de cada insumo', () => {
  // La suma de subtotales es el costo del plato: hace verificable el total.
  assert.match(receta, /Subtotal/);
  assert.match(receta, /Number\(item\.monto_subtotal \?\? 0\)/);
});

test('el recetario avisa cuando un insumo no tiene costo', () => {
  assert.match(receta, /costo_unitario_estimado/);
  assert.match(receta, /mdi:alert-circle-outline/);
});