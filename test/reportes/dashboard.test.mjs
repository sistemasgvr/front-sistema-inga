import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const code = ts.transpileModule(leer('../../src/modules/dashboard/utils/ayudas.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const compiled = { exports: {} };
vm.runInNewContext(code, { module: compiled, exports: compiled.exports });
const { ayudasDashboard } = compiled.exports;

const vista = leer('../../src/modules/dashboard/components/dashboard-view.tsx');
const indicador = leer('../../src/modules/reportes/components/indicador.tsx');
const platos = leer('../../src/modules/dashboard/components/pestana-platos.tsx');
const mozos = leer('../../src/modules/dashboard/components/pestana-mozos.tsx');
const resumen = leer('../../src/modules/dashboard/components/pestana-resumen.tsx');
const gastos = leer('../../src/modules/dashboard/components/pestana-gastos.tsx');
const modeloApi = leer('../../../api-sistema-inga/src/modules/reportes/models/reportes.model.ts');

test('las ayudas de compras, administrativos y planilla dicen que suman el rango elegido', () => {
  const a = ayudasDashboard('01/10/2026 — 16/10/2026');
  for (const clave of ['compras', 'administrativos', 'planilla', 'totalGastos']) {
    assert.match(a[clave], /Suma de todo lo registrado del 01\/10\/2026 al 16\/10\/2026/, clave);
  }
  assert.match(a.planilla, /lo pagado/);
});

test('la ayuda explica cómo se calcula cada cifra principal', () => {
  const a = ayudasDashboard('01/10/2026 — 01/10/2026');
  assert.match(a.ventas, /con IGV/);
  assert.match(a.ventas, /no se suman/);
  assert.match(a.ticket, /Ventas con IGV ÷ número de pedidos cobrados/);
  assert.match(a.ticket, /sirve para/);
  assert.match(a.margen, /costo de receta/);
  assert.match(a.utilidad, /compras del día \+ gastos administrativos \+ planilla/);
  assert.match(a.ingresosGastos, /Ingresos: ventas cobradas sin IGV/);
  assert.match(a.ingresosGastos, /Gastos: compras del día \+ gastos administrativos \+ pagos de planilla/);
});

test('las tarjetas muestran el globo de ayuda, que no sale al imprimir', () => {
  assert.match(indicador, /import InfoTooltip from "@\/components\/ui\/tooltip\/InfoTooltip"/);
  assert.match(indicador, /\{ayuda && \(\s*<span className="-ml-1\.5 print:hidden">/);
  for (const clave of ['ventas', 'ticket', 'margen', 'utilidad']) {
    assert.match(vista, new RegExp(`ayuda=\{ayudas\.${clave}\}`), clave);
  }
});

test('la venta se muestra con IGV y aclara que la venta sin IGV no se suma', () => {
  assert.match(vista, /titulo="Ventas totales"\s*valor=\{formatoMoneda\(estado\.ventas_brutas\)\}/);
  assert.match(vista, /Con IGV\. Sin IGV: \$\{formatoMoneda\(estado\.ventas_netas\)\} \(la misma venta, no se suma\)/);
});

test('el dashboard se divide en pestañas y solo monta la visible', () => {
  for (const p of ['resumen', 'ventas', 'platos', 'mozos', 'gastos']) {
    assert.match(vista, new RegExp(`\{ id: "${p}"`), p);
    assert.match(vista, new RegExp(`\{pestana === "${p}" && `), `${p} se monta solo al estar activa`);
  }
  assert.match(vista, /<NavTabs/);
});

test('platos más vendidos y venta vs costo están en un solo gráfico con su tabla', () => {
  assert.match(platos, /topPlatos\(datos\.productos, 10\)/);
  assert.match(platos, /name: "Venta sin IGV"/);
  assert.match(platos, /name: "Costo de receta"/);
  assert.match(platos, /\$\{p\.nombre\} \(\$\{p\.cantidad\} und\)/, 'la cantidad va en la etiqueta');
  assert.match(platos, /<TablaReporte/);
});

test('top 10 mozos por mesas atendidas, con el dato desde la API', () => {
  assert.match(mozos, /topMozosPorMesas\(datos\.por_mozo, 10\)/);
  assert.match(mozos, /titulo="Top 10 mozos por mesas atendidas"/);
  assert.match(modeloApi, /count\(\*\) FILTER \(WHERE v\.id_mesa IS NOT NULL\)::INT AS mesas/);
});

test('ingresos vs gastos detalla qué abarca cada concepto', () => {
  assert.match(resumen, /Ingresos:<\/span> ventas cobradas sin IGV/);
  assert.match(resumen, /Gastos:<\/span> compras del día \+ gastos administrativos \+/);
  assert.match(gastos, /detalle=\{detalle\}/, 'cada tarjeta de gasto indica que es la suma del rango');
});
