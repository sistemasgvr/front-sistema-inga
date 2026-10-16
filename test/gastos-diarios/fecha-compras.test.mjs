import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const vista = leer('../../src/modules/gastos-diarios/components/gastos-diarios-view.tsx');
const datePicker = leer('../../src/components/form/DatePicker.tsx');
const rango = leer('../../src/components/form/DateRangePicker.tsx');

test('la fecha de compras usa el selector de fechas compartido', () => {
  assert.match(vista, /import \{ DatePicker \} from "@\/components\/form\/DatePicker"/);
  assert.match(vista, /<DatePicker value=\{fecha\} max=\{hoyISO\(\)\} onChange=\{cambiarFecha\} \/>/);
  assert.doesNotMatch(vista, /type="date"/, 'ya no usa el campo nativo del navegador');
});

test('DatePicker reutiliza el calendario del rango en modo de un día', () => {
  assert.match(datePicker, /<DateRangePicker[\s\S]*unDia/);
  assert.match(datePicker, /onChange=\{\(rango\) => onChange\(rango\.desde\)\}/);
});

test('en modo de un día elegir una fecha cierra el calendario y no se puede borrar', () => {
  assert.match(rango, /if \(unDia\) \{\s*const siguiente = rangoDesdeFechas\(dia, dia\);[\s\S]*?setAbierto\(false\);/);
  assert.match(rango, /\{!unDia && \(\s*<button[\s\S]*?Borrar/);
});
