import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import ExcelJS from 'exceljs';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const cargar = (ruta) => {
  const code = ts.transpileModule(leer(ruta), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const compiled = { exports: {} };
  // Se comparte Date con el contexto: ExcelJS reconoce las fechas con instanceof.
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, Date });
  return compiled.exports;
};

const { construirLibro, nombreHoja, aFechaExcel, formatoExcel, valorExcel, anchoColumna, FILA_CABECERA } =
  cargar('../../src/modules/reportes/utils/excel.ts');
const { nombreArchivo } = cargar('../../src/modules/reportes/utils/nombre-archivo.ts');

const columnasPlatos = [
  { clave: 'nombre', titulo: 'Producto', valor: (f) => f.nombre },
  { clave: 'fecha', titulo: 'Cobro', valor: (f) => f.fecha, formato: 'fecha' },
  { clave: 'cantidad', titulo: 'Cantidad', valor: (f) => f.cantidad, formato: 'numero' },
  { clave: 'monto', titulo: 'Venta', valor: (f) => f.monto, formato: 'moneda' },
  { clave: 'pct', titulo: 'Margen %', valor: (f) => f.pct, formato: 'porcentaje' },
  { clave: 'ok', titulo: 'Bajo mínimo', valor: (f) => f.ok },
];

const datos = {
  empresa: 'Restaurante Ingá',
  titulo: 'Ventas y platos',
  periodo: '01/10/2026 — 16/10/2026',
  generado: '16/10/2026 13:00',
  secciones: [
    {
      titulo: 'Resumen de ventas',
      columnas: [
        { clave: 'concepto', titulo: 'Concepto', valor: (f) => f.concepto },
        { clave: 'valor', titulo: 'Valor', valor: (f) => f.valor, formato: (f) => f.formato ?? 'moneda' },
      ],
      filas: [
        { concepto: 'Pedidos cobrados', valor: 11, formato: 'numero' },
        { concepto: 'Ventas', valor: 608.5 },
      ],
    },
    {
      titulo: 'Platos y productos vendidos',
      columnas: columnasPlatos,
      filas: [
        { nombre: 'Arroz con pato', fecha: '2026-10-15 10:54', cantidad: 19, monto: 380, pct: 59.9, ok: false },
        { nombre: 'Ceviche, de piña', fecha: '2026-10-12', cantidad: 1, monto: 100, pct: -328.3, ok: true },
      ],
      totales: { cantidad: 20, monto: 480 },
    },
    { titulo: 'Detalle de ventas', columnas: columnasPlatos, filas: [] },
  ],
};

const releer = async () => {
  const buffer = await construirLibro(ExcelJS, datos).xlsx.writeBuffer();
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(buffer);
  return libro;
};

test('una hoja por sección, con el encabezado de la empresa y el período', async () => {
  const libro = await releer();
  assert.deepEqual(libro.worksheets.map((h) => h.name), ['Resumen de ventas', 'Platos y productos vendidos', 'Detalle de ventas']);
  const hoja = libro.getWorksheet('Platos y productos vendidos');
  assert.equal(hoja.getCell('A1').value, 'Restaurante Ingá');
  assert.equal(hoja.getCell('A2').value, 'Platos y productos vendidos');
  assert.match(hoja.getCell('A3').value, /Período: 01\/10\/2026 — 16\/10\/2026/);
  assert.equal(hoja.getCell('A1').font.bold, true);
});

test('la cabecera va en la fila 5, resaltada, con filtro y fija al desplazarse', async () => {
  const hoja = (await releer()).getWorksheet('Platos y productos vendidos');
  assert.equal(FILA_CABECERA, 5);
  assert.deepEqual(hoja.getRow(5).values.slice(1), ['Producto', 'Cobro', 'Cantidad', 'Venta', 'Margen %', 'Bajo mínimo']);
  assert.equal(hoja.getCell('A5').font.bold, true);
  assert.equal(hoja.getCell('A5').fill.fgColor.argb, 'FF344054');
  assert.equal(hoja.views[0].state, 'frozen');
  assert.equal(hoja.views[0].ySplit, 5);
  assert.ok(hoja.autoFilter, 'con más de una fila la cabecera lleva filtro');
});

test('montos, cantidades y porcentajes quedan como números con formato', async () => {
  const hoja = (await releer()).getWorksheet('Platos y productos vendidos');
  assert.equal(hoja.getCell('C6').value, 19);
  assert.equal(hoja.getCell('C6').numFmt, '#,##0', 'una columna de enteros no muestra decimales');
  assert.equal(hoja.getCell('D6').value, 380);
  assert.equal(hoja.getCell('D6').numFmt, '"S/" #,##0.00;[Red]-"S/" #,##0.00');
  assert.equal(hoja.getCell('E7').value, -328.3);
  assert.equal(hoja.getCell('E7').numFmt, '0.0" %"');
  assert.equal(hoja.getCell('F7').value, 'Sí');
  assert.equal(hoja.getCell('A7').value, 'Ceviche, de piña', 'el texto con comas no se parte');
});

test('las fechas son fechas de Excel sin correrse de día ni de hora', async () => {
  const hoja = (await releer()).getWorksheet('Platos y productos vendidos');
  const conHora = hoja.getCell('B6');
  assert.ok(conHora.value instanceof Date);
  assert.equal(conHora.value.toISOString(), '2026-10-15T10:54:00.000Z');
  assert.equal(conHora.numFmt, 'dd/mm/yyyy hh:mm');
  assert.equal(hoja.getCell('B7').value.toISOString(), '2026-10-12T00:00:00.000Z');
  assert.equal(hoja.getCell('B7').numFmt, 'dd/mm/yyyy');
});

test('la fila de totales va al final, en negrita, con la etiqueta Total', async () => {
  const hoja = (await releer()).getWorksheet('Platos y productos vendidos');
  const fila = hoja.getRow(8);
  assert.equal(fila.getCell(1).value, 'Total');
  assert.equal(fila.getCell(3).value, 20);
  assert.equal(fila.getCell(4).value, 480);
  assert.equal(fila.getCell(4).font.bold, true);
  assert.equal(fila.getCell(2).value, null, 'columna sin total queda vacía');
});

test('el formato puede cambiar por fila en los resúmenes', async () => {
  const hoja = (await releer()).getWorksheet('Resumen de ventas');
  assert.equal(hoja.getCell('B6').numFmt, '#,##0');
  assert.equal(hoja.getCell('B7').numFmt, '"S/" #,##0.00;[Red]-"S/" #,##0.00');
});

test('una sección sin filas lo dice en vez de quedar en blanco', async () => {
  const hoja = (await releer()).getWorksheet('Detalle de ventas');
  assert.equal(hoja.getCell('A6').value, 'Sin registros en el período.');
});

test('la hoja se imprime en A4, ajustada al ancho y con la cabecera repetida', async () => {
  const hoja = (await releer()).getWorksheet('Platos y productos vendidos');
  assert.equal(hoja.pageSetup.paperSize, 9);
  assert.equal(hoja.pageSetup.orientation, 'landscape');
  assert.equal(hoja.pageSetup.fitToWidth, 1);
  assert.equal(hoja.pageSetup.printTitlesRow, '5:5');
  assert.match(hoja.headerFooter.oddFooter, /Página &P de &N/);
  const resumen = (await releer()).getWorksheet('Resumen de ventas');
  assert.equal(resumen.pageSetup.orientation, 'portrait', 'pocas columnas: vertical');
});

test('nombres de hoja válidos para Excel y sin repetir', () => {
  const usados = new Set();
  assert.equal(nombreHoja('Ventas / mozo: [hoy]?', usados), 'Ventas mozo hoy');
  assert.equal(nombreHoja('Movimientos de almacén del período', usados), 'Movimientos de almacén del perí');
  assert.equal(nombreHoja('Movimientos de almacén del período', usados), 'Movimientos de almacén del (2)');
  assert.ok([...usados].every((n) => n.length <= 31));
});

test('conversiones de celda', () => {
  assert.equal(aFechaExcel('2026-02-31'), null, 'día inexistente');
  assert.equal(aFechaExcel('Abierto'), null);
  assert.equal(valorExcel('Abierto', 'fecha'), 'Abierto', 'un texto en columna de fecha queda como texto');
  assert.equal(valorExcel(null, 'moneda'), null);
  assert.equal(valorExcel('12.5', 'moneda'), 12.5);
  assert.equal(valorExcel(true, 'texto'), 'Sí');
  assert.equal(formatoExcel('numero'), '#,##0.00');
  assert.equal(formatoExcel('texto'), undefined);
  assert.equal(anchoColumna(['abc']), 10, 'ancho mínimo');
  assert.equal(anchoColumna(['x'.repeat(200)]), 48, 'ancho máximo');
  assert.equal(anchoColumna(['Arroz con pato blanco']), 23);
});

test('el nombre del archivo no lleva tildes ni espacios', () => {
  assert.equal(nombreArchivo('Ventas y platos', '2026-10-01', '2026-10-31'), 'ventas_y_platos_2026-10-01_2026-10-31.xlsx');
  assert.equal(nombreArchivo('Caja', '2026-10-16', '2026-10-16', 'pdf'), 'caja_2026-10-16.pdf');
  assert.equal(nombreArchivo('Cuentas por cobrar y pagar', '2026-10-01', '2026-10-02'), 'cuentas_por_cobrar_y_pagar_2026-10-01_2026-10-02.xlsx');
});
