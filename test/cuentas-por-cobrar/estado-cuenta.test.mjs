import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const code = ts.transpileModule(leer('../../src/modules/cuentas-por-cobrar/utils/estado-cuenta.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const compiled = { exports: {} };
vm.runInNewContext(code, { module: compiled, exports: compiled.exports });
const e = compiled.exports;
const plano = (v) => JSON.parse(JSON.stringify(v));

const linea = (datos) => ({
  id: 1,
  producto: 'Lomo saltado',
  cantidad: 2,
  precio_unitario: 25,
  adicionales: [],
  descuento: 0,
  subtotal: 50,
  cortesia: false,
  ...datos,
});

const pedido = (datos) => ({
  id: 20,
  codigo: 'PED-20',
  tipo_pedido: 1,
  fecha: '2026-10-10 12:23',
  mesa: 'M7',
  mozo: 'Geraldine Rioja',
  comensales: 2,
  total: 135,
  comprobante: null,
  pagos: [{ medio: 'Crédito / descuento consorcio', monto: 135 }],
  lineas: [
    linea({ id: 13, producto: 'ESTOFADO DE POLLO', cantidad: 3, precio_unitario: 25, subtotal: 75 }),
    linea({ id: 14, producto: 'ARROZ CON PATO BLANCO', cantidad: 3, precio_unitario: 20, subtotal: 60 }),
  ],
  ...datos,
});

const mov = (datos) => ({
  id: 1,
  tipo_movimiento: 1,
  fecha: '2026-10-10 12:23',
  monto: 135,
  anio: 2026,
  mes: 10,
  quincena: 1,
  medio_pago: null,
  medio_pago_nombre: null,
  observacion: null,
  pedido: null,
  ...datos,
});

// Los movimientos reales de un cliente entre el 10 y el 16/10/2026.
const movimientosReales = [
  mov({ id: 50, monto: 135, pedido: pedido() }),
  mov({ id: 51, tipo_movimiento: 2, monto: 900, medio_pago: 2, medio_pago_nombre: 'Yape' }),
  mov({ id: 52, monto: 60, pedido: pedido({ id: 21, codigo: 'PED-21', total: 60, lineas: [linea({ subtotal: 60 })] }) }),
  mov({ id: 53, monto: 25, pedido: pedido({ id: 23, codigo: 'PED-23', total: 25, lineas: [] }) }),
  mov({ id: 54, tipo_movimiento: 2, monto: 22, medio_pago: 1, medio_pago_nombre: 'Efectivo', pedido: pedido({ id: 23, codigo: 'PED-23' }) }),
  mov({ id: 55, tipo_movimiento: 2, monto: 50 }),
  mov({ id: 56, tipo_movimiento: 2, monto: 30 }),
  mov({ id: 57, monto: 25, pedido: pedido({ id: 24, codigo: 'PED-24', total: 25, lineas: [] }) }),
];

test('el saldo corrido parte del saldo anterior y cierra en el saldo del período', () => {
  const filas = plano(e.conSaldoCorrido(900, movimientosReales));
  assert.deepEqual(filas.map((f) => f.saldo), [1035, 135, 195, 220, 198, 148, 118, 143]);
  assert.equal(filas[1].abono, 900);
  assert.equal(filas[1].cargo, 0);
  assert.equal(filas[0].cargo, 135);
});

test('el ajuste entra con su signo', () => {
  assert.equal(e.montoConSigno({ tipo_movimiento: 3, monto: -20 }), -20);
  assert.equal(e.montoConSigno({ tipo_movimiento: 3, monto: 15 }), 15);
  const filas = plano(e.conSaldoCorrido(100, [mov({ tipo_movimiento: 3, monto: -20 })]));
  assert.deepEqual([filas[0].abono, filas[0].saldo], [20, 80]);
});

test('la descripción dice qué pedido, qué mesa o qué medio de pago', () => {
  assert.equal(e.descripcionMovimiento(movimientosReales[0]), 'Consumo · PED-20 · Mesa M7');
  assert.equal(e.descripcionMovimiento(movimientosReales[1]), 'Abono · Yape');
  assert.equal(e.descripcionMovimiento(movimientosReales[4]), 'Abono · Efectivo · corrige PED-23');
  assert.equal(e.descripcionMovimiento(mov({ tipo_movimiento: 3, monto: 5 })), 'Ajuste');
  assert.equal(e.descripcionMovimiento(mov({ pedido: pedido({ mesa: null, codigo: 'PED-9' }) })), 'Consumo · PED-9');
});

test('el plato muestra sus adicionales y el precio los incluye', () => {
  const l = linea({ precio_unitario: 25, adicionales: [{ nombre: 'Huevo', precio: 2 }, { nombre: 'Queso', precio: 1.5 }] });
  assert.equal(e.textoLinea(l), 'Lomo saltado + Huevo + Queso');
  assert.equal(e.precioConAdicionales(l), 28.5);
});

test('filasPlatos lista los platos de cada consumo y no los de las correcciones', () => {
  const filas = plano(e.filasPlatos(movimientosReales));
  assert.equal(filas.length, 3, 'PED-20 (2 platos) + PED-21 (1); el abono que corrige PED-23 no repite platos');
  assert.deepEqual(filas[0], {
    fecha: '2026-10-10 12:23',
    pedido: 'PED-20',
    mesa: 'M7',
    plato: 'ESTOFADO DE POLLO',
    cantidad: 3,
    precio: 25,
    descuento: 0,
    subtotal: 75,
    cortesia: false,
  });
});

test('resumenPlatos suma por plato lo consumido en el período', () => {
  const r = plano(
    e.resumenPlatos([
      mov({ pedido: pedido({ lineas: [linea({ cantidad: 2, subtotal: 50 }), linea({ id: 2, producto: 'Chicha', cantidad: 1, subtotal: 5 })] }) }),
      mov({ pedido: pedido({ lineas: [linea({ cantidad: 1, subtotal: 25, adicionales: [{ nombre: 'Huevo', precio: 2 }] })] }) }),
    ]),
  );
  assert.deepEqual(r, [
    { plato: 'Lomo saltado', cantidad: 3, monto: 75 },
    { plato: 'Chicha', cantidad: 1, monto: 5 },
  ]);
});

test('detecta el pago mixto: el pedido costó más de lo que se cargó a la cuenta', () => {
  assert.equal(e.esPagoMixto(mov({ monto: 60, pedido: pedido({ total: 80 }) })), true);
  assert.equal(e.esPagoMixto(movimientosReales[0]), false);
  assert.equal(e.esPagoMixto(mov({ tipo_movimiento: 2, monto: 22, pedido: pedido() })), false);
});

test('atajos de período por quincena, sin pasar de hoy', () => {
  const primera = plano(e.rangosRapidos('2026-10-08'));
  assert.deepEqual(primera.map((r) => [r.clave, r.desde, r.hasta]), [
    ['quincena', '2026-10-01', '2026-10-08'],
    ['quincena-anterior', '2026-09-16', '2026-09-30'],
    ['mes', '2026-10-01', '2026-10-08'],
    ['todo', '', ''],
  ]);
  const segunda = plano(e.rangosRapidos('2026-10-19'));
  assert.deepEqual(segunda.slice(0, 2).map((r) => [r.desde, r.hasta]), [
    ['2026-10-16', '2026-10-19'],
    ['2026-10-01', '2026-10-15'],
  ]);
  const enero = plano(e.rangosRapidos('2027-01-05'));
  assert.deepEqual([enero[1].desde, enero[1].hasta], ['2026-12-16', '2026-12-31'], 'cruza el año');
  const febrero = plano(e.rangosRapidos('2028-03-03'));
  assert.equal(febrero[1].hasta, '2028-02-29', 'año bisiesto');
});

test('la página del estado de cuenta usa su endpoint, cancela respuestas viejas e imprime en A4 vertical', () => {
  const hook = leer('../../src/modules/cuentas-por-cobrar/hooks/use-estado-cuenta-detalle.ts');
  const servicio = leer('../../src/modules/cuentas-por-cobrar/services/cxc.service.ts');
  const vista = leer('../../src/modules/cuentas-por-cobrar/components/estado-cuenta-detalle-view.tsx');
  const pagina = leer('../../src/app/(dashboard)/cuentas-por-cobrar/clientes/[idPersona]/page.tsx');
  const estilos = leer('../../src/app/globals.css');
  assert.match(servicio, /`\$\{BASE\}\/clientes\/\$\{idPersona\}\/detalle`/);
  assert.match(hook, /controller\.abort\(\)/);
  assert.match(hook, /\[idPersona, valido, completo, rango\.desde, rango\.hasta, clave\]/);
  assert.match(pagina, /await props\.params/);
  assert.match(pagina, /<RoleGuard requiredPermission="cxc\.listar">/);
  assert.match(vista, /data-imprimir-reporte=""/);
  assert.match(vista, /reporte-imprimible estado-cuenta/);
  assert.match(vista, /exportarExcel\(nombreArchivo\(base/);
  assert.match(vista, /Mostrar los platos de cada pedido/);
  assert.doesNotMatch(vista, /<header/, 'la impresión oculta las etiquetas header');
  assert.match(estilos, /@page estado-cuenta \{\s*size: A4 portrait;/);
  assert.match(estilos, /\.reporte-imprimible\.estado-cuenta \{\s*page: estado-cuenta;/);
});

test('se llega al estado de cuenta desde la tabla de saldos y desde el modal', () => {
  const tabla = leer('../../src/modules/cuentas-por-cobrar/components/cuentas-por-cobrar-view.tsx');
  const modal = leer('../../src/modules/cuentas-por-cobrar/components/estado-cuenta-modal.tsx');
  assert.match(tabla, /href=\{`\/cuentas-por-cobrar\/clientes\/\$\{cli\.id_persona\}`\}/);
  assert.match(modal, /href=\{`\/cuentas-por-cobrar\/clientes\/\$\{persona\.id_persona\}`\}/);
});

test('la API arma el detalle con pedido, mesa, mozo, pagos, platos y adicionales', () => {
  const modelo = leer('../../../api-sistema-inga/src/modules/cuentas-por-cobrar/models/cuentas-por-cobrar.model.ts');
  const controlador = leer('../../../api-sistema-inga/src/modules/cuentas-por-cobrar/controllers/cuentas-por-cobrar.controller.ts');
  assert.match(controlador, /@Get\('clientes\/:idPersona\/detalle'\)\s*@Permisos\(PermisoBanderas\.CXC_LISTAR\)/);
  for (const campo of ["'mesa'", "'mozo'", "'pagos'", "'lineas'", "'adicionales'", "'cortesia'"]) {
    assert.ok(modelo.includes(campo), `falta ${campo}`);
  }
  assert.match(modelo, /d\.tipo_linea <> 3/, 'sin las líneas anuladas');
  assert.match(modelo, /\(d\.cantidad - d\.cantidad_cancelada\)/, 'descuenta lo cancelado');
});
