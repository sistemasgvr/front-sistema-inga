import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../../src/shared/utils/fecha.ts', import.meta.url), 'utf8');
const compiled = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { module: compiled, exports: compiled.exports },
);
const {
  SEPARADOR_RANGO,
  aYmd,
  compararDia,
  cursorParaRangoEnmascarado,
  decadaDe,
  desdeYmd,
  diasDelMes,
  enmascararRango,
  enmascararSegmento,
  esHoy,
  formatearDdMmYyyy,
  formatearRango,
  indiceDigitoEnCursor,
  limitesSeparador,
  mismoDia,
  parsearDdMmYyyy,
  parsearLimite,
  rangoDesdeFechas,
  rangoDesdeTexto,
  segmentosDe,
  segmentoParaNavegacion,
} = compiled.exports;

// El módulo se evalúa en otro realm, así que sus objetos y arreglos no comparten
// prototipo con los de este archivo: se comparan campo por campo.
const par = (objeto) => `${objeto.desde}|${objeto.hasta}`;
const parTriple = (objeto) => `${objeto.anio}|${objeto.mes}|${objeto.dia}`;

test('el rango se escribe y se relee como dd/mm/aaaa', () => {
  assert.equal(formatearRango({ desde: '2026-01-05', hasta: '2026-12-31' }), '05/01/2026 — 31/12/2026');
  assert.equal(formatearRango({ desde: '2026-01-05', hasta: '' }), `05/01/2026${SEPARADOR_RANGO}`);
  assert.equal(formatearRango({ desde: '', hasta: '' }), '');
  assert.equal(formatearDdMmYyyy('2026-03-09'), '09/03/2026');
  assert.equal(formatearDdMmYyyy('2026-01-05'), '05/01/2026');
});

test('se rechazan las fechas que no existen en el calendario', () => {
  assert.equal(parsearDdMmYyyy('29/02/2024')?.getFullYear(), 2024);
  assert.equal(parsearDdMmYyyy('31/02/2026'), null);
  assert.equal(parsearDdMmYyyy('00/01/2026'), null);
  assert.equal(parsearDdMmYyyy('12/13/2026'), null);
  assert.equal(parsearDdMmYyyy('1/1/26'), null, 'exige año de cuatro dígitos');
  assert.equal(aYmd(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(desdeYmd('2026-02-30'), null);
});

test('las fechas locales no se desplazan al convertirlas a ISO', () => {
  const ida = parsearDdMmYyyy('05/01/2026');
  assert.equal(aYmd(ida), '2026-01-05');
  assert.equal(par(rangoDesdeFechas(ida, null)), '2026-01-05|');
  assert.ok(mismoDia(desdeYmd('2026-01-05'), ida));
  assert.equal(compararDia(ida, new Date(2026, 0, 6)), -1);
  assert.equal(compararDia(ida, new Date(2026, 0, 5)), 0);
});

test('la máscara obliga las barras y el guion del rango', () => {
  assert.equal(enmascararSegmento(''), '');
  assert.equal(enmascararSegmento('1'), '1');
  assert.equal(enmascararSegmento('123'), '12/3');
  assert.equal(enmascararSegmento('12345'), '12/34/5');
  assert.equal(enmascararSegmento('123456'), '12/34/56');
  assert.equal(enmascararSegmento('31122026'), '31/12/2026');
  assert.equal(enmascararRango(''), '', 'sin escribir nada no se inventa el guion');
  assert.equal(enmascararRango('5'), `5${SEPARADOR_RANGO}`, 'al escribir se muestra la estructura');
  assert.equal(enmascararRango('05012026'), `05/01/2026${SEPARADOR_RANGO}`);
  assert.equal(enmascararRango('05/01/2026/31/12/2026'), `05/01/2026${SEPARADOR_RANGO}31/12/2026`);
  assert.equal(enmascararRango('05012026 — 31122026').length, 23, 'el ancho máximo del campo');
});

test('el guion separa los dos segmentos y se puede escribir en el segundo', () => {
  const parDeTexto = segmentosDe('05/01/2026 — 31/12/2026');
  assert.equal(`${parDeTexto[0]}|${parDeTexto[1]}`, '05/01/2026 | 31/12/2026');
  const sinGuion = segmentosDe('05/01/2026');
  assert.equal(`${sinGuion[0]}|${sinGuion[1]}`, '05/01/2026|');
  const limites = limitesSeparador(`05/01/2026${SEPARADOR_RANGO}`);
  assert.equal(limites.inicio, 10);
  assert.equal(limites.fin, 13);
  assert.equal(limitesSeparador('05/01/2026'), null);
  // Typing en el segmento derecho sin haber llenado el izquierdo.
  assert.equal(enmascararRango(` — 31122026`), `${SEPARADOR_RANGO}31/12/2026`);
});

test('al reenmascarar el cursor conserva cuántos dígitos tenía delante', () => {
  const texto = '05/01/2026 — 31/12/2026';
  assert.equal(indiceDigitoEnCursor(texto, 0), 0);
  assert.equal(indiceDigitoEnCursor(texto, 5), 4);
  assert.equal(cursorParaRangoEnmascarado(texto, 0), 0);
  assert.equal(cursorParaRangoEnmascarado(texto, 2), 2);
  assert.equal(cursorParaRangoEnmascarado(texto, 5), 7, 'quinto dígito en la posición 6');
  // Si el cursor estaba tras el guion, no debe saltar hacia el segmento izquierdo.
  assert.equal(cursorParaRangoEnmascarado(texto, 4, true), 13);
});

test('un rango escrito a mano se ordena de menor a mayor', () => {
  const invertido = rangoDesdeTexto('31/12/2026 — 05/01/2026');
  assert.equal(aYmd(invertido.desde), '2026-01-05');
  assert.equal(aYmd(invertido.hasta), '2026-12-31');
  assert.equal(aYmd(rangoDesdeTexto('05/01/2026').desde), '2026-01-05');
  assert.equal(rangoDesdeTexto('05/01/2026').hasta, null);
  assert.equal(rangoDesdeTexto('texto sin sentido').desde, null);
  assert.equal(rangoDesdeTexto('31/02/2026').desde, null);
});

test('el calendario muestra 42 celdas empezando en lunes', () => {
  const celdas = diasDelMes(2026, 9); // octubre 2026
  assert.equal(celdas.length, 42);
  const conDia = celdas.filter(Boolean);
  assert.equal(conDia.length, 31);
  assert.equal(conDia[0].getMonth(), 9);
  const primera = celdas.findIndex(Boolean);
  assert.equal((conDia[0].getDay() + 6) % 7, primera, 'la semana arranca en lunes');
  assert.equal(diasDelMes(2024, 1).filter(Boolean).length, 29);
});

test('los límites admiten ISO corto y dd/mm/aaaa', () => {
  assert.equal(aYmd(parsearLimite('2026-01-05')), '2026-01-05');
  assert.equal(aYmd(parsearLimite('05/01/2026')), '2026-01-05');
  assert.equal(parsearLimite(''), null);
  assert.equal(parsearLimite(undefined), null);
  assert.equal(decadaDe(2026), 2016, 'la década arranca en múltiplos de doce');
  assert.equal(decadaDe(2028), 2028);
});

test('la navegación por texto solo mueve el calendario a fechas reales', () => {
  assert.equal(parTriple(segmentoParaNavegacion('05/01/2026')), '2026|0|5');
  assert.equal(segmentoParaNavegacion('31/02/2026'), null);
  assert.equal(segmentoParaNavegacion(''), null);
  assert.equal(segmentoParaNavegacion('1'), null);
  assert.ok(esHoy(new Date()), '"hoy" se resuelve contra la fecha local del proceso');
});