import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const source = leer('../../src/modules/reportes/utils/calculos.ts');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const compiled = { exports: {} };
vm.runInNewContext(code, { module: compiled, exports: compiled.exports });
const c = compiled.exports;

// Los objetos creados dentro del contexto vm tienen otro prototipo; se
// normalizan para compararlos con deepEqual.
const plano = (valor) => JSON.parse(JSON.stringify(valor));

const producto = (datos) => ({
  id_producto: 1,
  nombre: 'Lomo saltado',
  categoria: 'Platos',
  cantidad: 10,
  cortesias: 0,
  monto: 250,
  monto_neto: 211.86,
  costo_unitario: 8.5,
  ...datos,
});

test('redondear evita el error de coma flotante y porcentaje no divide entre cero', () => {
  assert.equal(c.redondear(1.005), 1.01);
  assert.equal(c.redondear(0.1 + 0.2), 0.3);
  assert.equal(c.redondear(-1.005), -1.01);
  assert.equal(c.porcentaje(25, 200), 12.5);
  assert.equal(c.porcentaje(5, 0), 0);
  assert.equal(c.sumar([{ m: 0.1 }, { m: 0.2 }, { m: null }], (f) => f.m), 0.3);
});

test('el margen de un plato se calcula sobre la venta sin IGV', () => {
  const r = c.rentabilidadProducto(producto());
  assert.equal(r.costo_total, 85);
  assert.equal(r.margen, 126.86);
  assert.equal(r.margen_pct, 59.9);
  assert.equal(r.precio_promedio, 25);
});

test('las cortesías cuestan pero no cuentan para el precio promedio', () => {
  const r = c.rentabilidadProducto(producto({ cantidad: 12, cortesias: 2 }));
  assert.equal(r.costo_total, 102, 'las 12 unidades consumen receta');
  assert.equal(r.precio_promedio, 25, '250 / 10 unidades cobradas');
});

test('un plato vendido por debajo de su costo da margen negativo', () => {
  const r = c.rentabilidadProducto(producto({ cantidad: 1, monto: 100, monto_neto: 84.75, costo_unitario: 413.09 }));
  assert.equal(r.margen, -328.34);
  assert.ok(r.margen_pct < 0);
});

test('estado de resultados: margen bruto y utilidad operativa por separado', () => {
  const e = c.estadoResultados({
    resumen_ventas: { cantidad: 4, total: 590, igv: 90, descuentos: 10, comensales: 10 },
    productos: [producto({ cantidad: 10, costo_unitario: 8 }), producto({ id_producto: 2, cantidad: 5, costo_unitario: 4 })],
    gastos_diarios: [{ fecha: '2026-10-01', efectivo: 50, yape: 0, credito: 30, total: 80 }],
    gastos_administrativos: [{ fecha: '2026-10-02', monto: 20, tipo_gasto: 1 }],
    planilla: [{ fecha: '2026-10-02', monto: 100 }],
  });
  assert.equal(e.ventas_netas, 500);
  assert.equal(e.costo_ventas, 100);
  assert.equal(e.margen_bruto, 400);
  assert.equal(e.margen_bruto_pct, 80);
  assert.equal(e.total_gastos, 200);
  assert.equal(e.utilidad_operativa, 300, 'no resta el costo de receta: ya está en las compras');
  assert.equal(e.utilidad_pct, 60);
  assert.equal(e.ticket_promedio, 147.5);
  assert.equal(e.consumo_por_comensal, 59);
});

test('sin ventas los indicadores quedan en cero, sin NaN', () => {
  const e = c.estadoResultados({
    resumen_ventas: { cantidad: 0, total: 0, igv: 0, descuentos: 0, comensales: 0 },
    productos: [],
    gastos_diarios: [],
    gastos_administrativos: [{ fecha: '2026-10-02', monto: 50, tipo_gasto: 1 }],
    planilla: [],
  });
  assert.equal(e.ticket_promedio, 0);
  assert.equal(e.margen_bruto_pct, 0);
  assert.equal(e.utilidad_operativa, -50);
  assert.equal(e.utilidad_pct, 0);
});

test('las líneas del estado de resultados expresan cada monto sobre la venta sin IGV', () => {
  const e = c.estadoResultados({
    resumen_ventas: { cantidad: 1, total: 118, igv: 18, descuentos: 0, comensales: 1 },
    productos: [producto({ cantidad: 1, costo_unitario: 30 })],
    gastos_diarios: [],
    gastos_administrativos: [],
    planilla: [],
  });
  const lineas = plano(c.lineasEstadoResultados(e));
  const margen = lineas.find((l) => l.concepto === 'Margen bruto');
  assert.deepEqual(margen, { concepto: 'Margen bruto', monto: 70, pct: 70, nivel: 'total' });
  assert.equal(lineas[0].pct, null, 'la venta con IGV no se expresa sobre sí misma');
});

test('diasDelRango incluye ambos extremos y cruza meses', () => {
  assert.deepEqual(plano(c.diasDelRango('2026-09-29', '2026-10-02')), ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  assert.deepEqual(plano(c.diasDelRango('2026-10-05', '2026-10-01')), []);
});

test('la semana empieza en lunes y el mes agrupa por año-mes', () => {
  assert.equal(c.lunesDeSemana('2026-10-18'), '2026-10-12', 'domingo 18 pertenece a la semana del lunes 12');
  assert.equal(c.lunesDeSemana('2026-10-12'), '2026-10-12');
  assert.equal(c.clavePeriodo('2026-10-16', 'mes'), '2026-10');
  assert.equal(c.etiquetaPeriodo('2026-10', 'mes'), 'Oct 2026');
  assert.equal(c.etiquetaPeriodo('2026-10-12', 'semana'), 'Sem. 12/10');
  assert.equal(c.etiquetaPeriodo('2026-10-12', 'dia'), '12/10');
});

test('agruparPorPeriodo completa los días sin venta con cero', () => {
  const serie = plano(
    c.agruparPorPeriodo('2026-10-01', '2026-10-03', 'dia', [{ fecha: '2026-10-03', total: 10.1 }, { fecha: '2026-10-03', total: 0.2 }], {
      total: (f) => f.total,
    }),
  );
  assert.deepEqual(serie.map((p) => [p.clave, p.valores.total]), [
    ['2026-10-01', 0],
    ['2026-10-02', 0],
    ['2026-10-03', 10.3],
  ]);
});

test('agruparPorPeriodo por semana y por mes suma en el período correcto', () => {
  const filas = [
    { fecha: '2026-09-30', total: 5 },
    { fecha: '2026-10-04', total: 7 },
    { fecha: '2026-10-05', total: 11 },
  ];
  const semanas = plano(c.agruparPorPeriodo('2026-09-28', '2026-10-11', 'semana', filas, { total: (f) => f.total }));
  assert.deepEqual(semanas.map((p) => [p.clave, p.valores.total]), [
    ['2026-09-28', 12],
    ['2026-10-05', 11],
  ]);
  const meses = plano(c.agruparPorPeriodo('2026-09-28', '2026-10-11', 'mes', filas, { total: (f) => f.total }));
  assert.deepEqual(meses.map((p) => [p.clave, p.valores.total]), [
    ['2026-09', 5],
    ['2026-10', 18],
  ]);
});

test('flujoPorPeriodo junta ventas netas y todos los gastos del día', () => {
  const flujo = plano(
    c.flujoPorPeriodo({
      desde: '2026-10-01',
      hasta: '2026-10-02',
      granularidad: 'dia',
      por_dia: [{ fecha: '2026-10-01', cantidad: 2, total: 118, neto: 100 }],
      gastos_diarios: [{ fecha: '2026-10-01', total: 30 }],
      gastos_administrativos: [{ fecha: '2026-10-02', monto: 20 }],
      planilla: [{ fecha: '2026-10-02', monto: 50 }],
    }),
  );
  assert.deepEqual(
    flujo.map((p) => [p.clave, p.ingresos, p.gastos, p.utilidad]),
    [
      ['2026-10-01', 100, 30, 70],
      ['2026-10-02', 0, 70, -70],
    ],
  );
});

test('serieHoras rellena los huecos y serieDiasSemana devuelve los 7 días', () => {
  const horas = plano(c.serieHoras([{ hora: 12, cantidad: 1, total: 10 }, { hora: 14, cantidad: 2, total: 30 }]));
  assert.deepEqual(horas.map((h) => [h.hora, h.total]), [[12, 10], [13, 0], [14, 30]]);
  assert.deepEqual(plano(c.serieHoras([])), []);
  const dias = plano(c.serieDiasSemana([{ dia: 7, cantidad: 1, total: 99 }]));
  assert.equal(dias.length, 7);
  assert.equal(dias[0].nombre, 'Lunes');
  assert.equal(dias[6].total, 99);
  assert.equal(c.etiquetaHora(9), '09:00');
});

test('ventasPorCategoria suma productos y calcula el margen de la categoría', () => {
  const cats = plano(
    c.ventasPorCategoria([
      producto({ categoria: 'Bebidas', cantidad: 2, monto: 10, monto_neto: 8.47, costo_unitario: 2 }),
      producto({ categoria: 'Platos', cantidad: 1, monto: 25, monto_neto: 21.19, costo_unitario: 5 }),
      producto({ categoria: 'Bebidas', cantidad: 1, monto: 5, monto_neto: 4.24, costo_unitario: 3 }),
    ]),
  );
  assert.equal(cats[0].categoria, 'Platos', 'ordenado por venta');
  const bebidas = cats.find((x) => x.categoria === 'Bebidas');
  assert.equal(bebidas.productos, 2);
  assert.equal(bebidas.monto, 15);
  assert.equal(bebidas.costo, 7);
  assert.equal(bebidas.margen, 5.71);
});

test('topConOtros agrupa el resto en "Otros"', () => {
  const filas = [{ n: 'a', v: 5 }, { n: 'b', v: 50 }, { n: 'c', v: 1 }, { n: 'd', v: 2.5 }];
  assert.deepEqual(plano(c.topConOtros(filas, 2, (f) => f.v, (f) => f.n)), [
    { etiqueta: 'b', valor: 50 },
    { etiqueta: 'a', valor: 5 },
    { etiqueta: 'Otros', valor: 3.5 },
  ]);
  assert.equal(c.topConOtros(filas, 10, (f) => f.v, (f) => f.n).length, 4, 'sin resto no agrega "Otros"');
});

test('resumenCaja respeta el signo de la base: diferencia = sistema − declarado', () => {
  const turno = (estado_turno, monto_diferencia, total_ventas) => ({
    estado_turno,
    monto_diferencia,
    totales: { total_ventas, ventas_efectivo: total_ventas / 2 },
  });
  const r = c.resumenCaja([turno(2, 5, 100), turno(2, -2, 50), turno(1, null, 30)]);
  assert.equal(r.turnos, 3);
  assert.equal(r.abiertos, 1);
  assert.equal(r.faltantes, 5, 'positiva = faltó efectivo');
  assert.equal(r.sobrantes, 2);
  assert.equal(r.diferencia_neta, 3);
  assert.equal(r.ventas, 180);
  assert.equal(r.turnos_con_diferencia, 2);
});

test('resúmenes de cuentas, inventario, planilla y gastos administrativos', () => {
  const cuentas = c.resumenCuentas([
    { saldo: 100, cargos_periodo: 50, abonos_periodo: 20 },
    { saldo: 0, cargos_periodo: 0, abonos_periodo: 30 },
  ]);
  assert.deepEqual(plano(cuentas), { personas: 2, con_saldo: 1, saldo: 100, cargos: 50, abonos: 50 });

  const inv = plano(
    c.resumenInventario([
      { almacen: 'Cocina', valorizado: 10.5, bajo_minimo: true },
      { almacen: 'Barra', valorizado: 40, bajo_minimo: false },
      { almacen: 'Cocina', valorizado: 4.5, bajo_minimo: false },
    ]),
  );
  assert.equal(inv.valorizado, 55);
  assert.equal(inv.bajo_minimo, 1);
  assert.deepEqual(inv.por_almacen, [
    { almacen: 'Barra', items: 1, valorizado: 40 },
    { almacen: 'Cocina', items: 2, valorizado: 15 },
  ]);

  const planilla = plano(c.planillaPorTrabajador([
    { trabajador: 'Ana', monto: 900 },
    { trabajador: 'Ana', monto: 900 },
    { trabajador: 'Luis', monto: 1200 },
  ]));
  assert.deepEqual(planilla[0], { trabajador: 'Ana', pagos: 2, monto: 1800 });

  const gad = plano(c.gastosAdministrativosPorCategoria([
    { categoria: 'Servicios', tipo_gasto: 1, monto: 120 },
    { categoria: 'Servicios', tipo_gasto: 2, monto: 30 },
  ]));
  assert.deepEqual(gad, [{ categoria: 'Servicios', gastos: 2, monto: 150, fijos: 120, variables: 30 }]);
});

test('etiqueta de canal para los tipos de pedido', () => {
  assert.equal(c.etiquetaTipoPedido(1), 'Mesa');
  assert.equal(c.etiquetaTipoPedido(2), 'Para llevar');
  assert.equal(c.etiquetaTipoPedido(3), 'Delivery');
  assert.equal(c.etiquetaTipoPedido(9), 'Tipo 9');
});

test('topPlatos ordena por unidades y trae la venta y el costo de esas unidades', () => {
  const top = plano(
    c.topPlatos(
      [
        producto({ id_producto: 1, nombre: 'Ceviche', cantidad: 3, monto: 90, monto_neto: 76.27, costo_unitario: 10 }),
        producto({ id_producto: 2, nombre: 'Lomo', cantidad: 19, monto: 380, monto_neto: 322.03, costo_unitario: 5 }),
        producto({ id_producto: 3, nombre: 'Chicha', cantidad: 3, monto: 30, monto_neto: 25.42, costo_unitario: 1 }),
      ],
      2,
    ),
  );
  assert.deepEqual(top.map((p) => p.nombre), ['Lomo', 'Ceviche'], 'empate en unidades: gana la mayor venta');
  assert.equal(top[0].costo_total, 95, '19 unidades × S/ 5');
  assert.equal(top[0].margen, 227.03);
});

test('topMozosPorMesas cuenta mesas atendidas y deja fuera a quien no atendió mesa', () => {
  const top = plano(
    c.topMozosPorMesas(
      [
        { id_mozo: 1, nombre: 'Ana', cantidad: 10, total: 500, mesas: 8, comensales: 20 },
        { id_mozo: 2, nombre: 'Luis', cantidad: 9, total: 900, mesas: 8, comensales: 30 },
        { id_mozo: 3, nombre: 'Caja', cantidad: 4, total: 80, mesas: 0, comensales: 4 },
      ],
      10,
    ),
  );
  assert.deepEqual(top.map((m) => m.nombre), ['Luis', 'Ana'], 'empate en mesas: gana la mayor venta');
  assert.equal(top[0].ticket_promedio, 100);
  assert.equal(top[0].comensales_por_mesa, 3.8);
  const once = Array.from({ length: 12 }, (_, i) => ({ id_mozo: i, nombre: `M${i}`, cantidad: 1, total: 1, mesas: i + 1, comensales: 1 }));
  assert.equal(c.topMozosPorMesas(once, 10).length, 10, 'solo los 10 primeros');
});

test('gastosPorPeriodo separa compras, administrativos y planilla por período', () => {
  const serie = plano(
    c.gastosPorPeriodo({
      desde: '2026-10-01',
      hasta: '2026-10-02',
      granularidad: 'dia',
      gastos_diarios: [{ fecha: '2026-10-01', total: 30 }],
      gastos_administrativos: [{ fecha: '2026-10-02', monto: 20 }],
      planilla: [{ fecha: '2026-10-02', monto: 900 }],
    }),
  );
  assert.deepEqual(serie.map((p) => [p.clave, p.valores.compras, p.valores.administrativos, p.valores.planilla]), [
    ['2026-10-01', 30, 0, 0],
    ['2026-10-02', 0, 20, 900],
  ]);
});
