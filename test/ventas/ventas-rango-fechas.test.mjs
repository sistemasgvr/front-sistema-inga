import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const vista = leer('../../src/modules/ventas/components/ventas-view.tsx');
const hook = leer('../../src/modules/ventas/hooks/use-ventas.ts');
const servicio = leer('../../src/modules/ventas/services/ventas.service.ts');
const tipos = leer('../../src/modules/ventas/types/ventas.types.ts');

test('el filtro de fechas usa el selector de rango compartido', () => {
  assert.match(vista, /import \{ DateRangePicker \} from "@\/components\/form\/DateRangePicker"/);
  assert.match(vista, /<DateRangePicker/);
  assert.match(vista, /v\.cambiarRangoFechas\(rango\.desde, rango\.hasta\)/);
});

test('la vista ya no pide fechas con los campos nativos del navegador', () => {
  assert.doesNotMatch(vista, /type="date"/, 'el rango se elige en el calendario propio');
  assert.doesNotMatch(vista, /cambiarFiltro\("fecha_desde"/);
  assert.doesNotMatch(vista, /cambiarFiltro\("fecha_hasta"/);
});

test('el rango no admite fechas futuras', () => {
  assert.match(vista, /max=\{hoy\}/);
  assert.match(vista, /useMemo\(\(\) => hoyLima\(\), \[\]\)/, 'el límite se fija al montar la vista');
});

test('elegir un rango mueve los dos campos en una sola actualización', () => {
  assert.match(
    hook,
    /function cambiarRangoFechas\(desde: string, hasta: string\) \{\s*setFiltros\(\(prev\) => \(\{ \.\.\.prev, fecha_desde: desde, fecha_hasta: hasta \}\)\);\s*setPagina\(1\);\s*\}/,
    'un setFiltros = una sola petición; volver a un rango ya visitado vuelve a consultar',
  );
  assert.match(hook, /cambiarRangoFechas,/);
});

test('la consulta al backend conserva los dos parámetros de fecha', () => {
  assert.match(tipos, /fecha_desde: string;\s*fecha_hasta: string;/);
  assert.match(servicio, /fecha_desde: params\.fecha_desde \|\| undefined,/);
  assert.match(servicio, /fecha_hasta: params\.fecha_hasta \|\| undefined,/);
  assert.match(hook, /controller\.abort\(\)/, 'la respuesta anterior se cancela al cambiar el filtro');
});