import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const hookReporte = leer('../../src/modules/reportes/hooks/use-reporte.ts');
const hookDashboard = leer('../../src/modules/dashboard/hooks/use-dashboard.ts');
const servicio = leer('../../src/modules/reportes/services/reportes.service.ts');
const shell = leer('../../src/modules/reportes/components/reporte-shell.tsx');
const catalogo = leer('../../src/modules/reportes/utils/catalogo.ts');
const banderas = leer('../../src/shared/constants/permiso-banderas.ts');
const sidebar = leer('../../src/layout/AppSidebar.tsx');
const estilos = leer('../../src/app/globals.css');
const dashboard = leer('../../src/modules/dashboard/components/dashboard-view.tsx');

const TIPOS = ['ventas', 'gastos', 'caja', 'cuentas', 'planilla', 'inventario'];

test('cada cambio de rango vuelve a pedir el reporte y cancela la respuesta anterior', () => {
  assert.match(hookReporte, /getReporte\(tipo, \{ fecha_desde: rango\.desde, fecha_hasta: rango\.hasta \}, controller\.signal\)/);
  assert.match(hookReporte, /return \(\) => controller\.abort\(\);/);
  assert.match(hookReporte, /\[tipo, rango\.desde, rango\.hasta, completo, clave\]/);
  assert.match(hookReporte, /respuesta\?\.clave === clave/, 'solo se muestra la respuesta de la consulta vigente');
});

test('el dashboard pide al backend en cada rango y no consulta sin permiso', () => {
  assert.match(hookDashboard, /getDashboard\(\{ fecha_desde: rango\.desde, fecha_hasta: rango\.hasta \}, controller\.signal\)/);
  assert.match(hookDashboard, /if \(permitido !== true \|\| !completo\) return;/);
  assert.match(hookDashboard, /useTienePermiso\(PermisoBanderas\.DASHBOARD_VER\)/);
  assert.match(hookDashboard, /controller\.abort\(\)/);
});

test('el servicio usa la ruta de cada reporte con los dos parámetros de fecha', () => {
  assert.match(servicio, /`\/reportes\/\$\{tipo\}`/);
  assert.match(servicio, /"\/reportes\/dashboard"/);
  assert.match(servicio, /fecha_desde: filtro\.fecha_desde,\s*fecha_hasta: filtro\.fecha_hasta,/);
});

test('cada reporte tiene su página protegida por su propio permiso', () => {
  for (const tipo of TIPOS) {
    const ruta = `../../src/app/(dashboard)/reportes/${tipo}/page.tsx`;
    assert.ok(existsSync(new URL(ruta, import.meta.url)), `falta la página de ${tipo}`);
    const pagina = leer(ruta);
    assert.match(pagina, new RegExp(`PermisoBanderas\\.REPORTES_${tipo.toUpperCase()}`));
  }
  assert.match(leer('../../src/app/(dashboard)/reportes/page.tsx'), /PermisoBanderas\.REPORTES_GENERAL/);
});

test('los permisos del front coinciden con los de la API y el seed', () => {
  const api = leer('../../../api-sistema-inga/src/common/constants/permiso-banderas.ts');
  const seed = leer('../../../api-sistema-inga/database_sql/seeds/permisos/14_reportes.sql');
  for (const codigo of ['dashboard.ver', ...TIPOS.map((t) => `reportes.${t}`), 'reportes.general']) {
    assert.ok(banderas.includes(`'${codigo}'`), `front sin ${codigo}`);
    assert.ok(api.includes(`'${codigo}'`), `API sin ${codigo}`);
    assert.ok(seed.includes(`'${codigo}'`), `seed sin ${codigo}`);
  }
});

test('las pestañas y el menú solo muestran los reportes permitidos', () => {
  assert.match(shell, /REPORTES\.filter\(\(r\) => user\?\.es_super_admin \|\| user\?\.permisos\?\.includes\(r\.permiso\)\)/);
  for (const tipo of TIPOS) {
    assert.match(sidebar, new RegExp(`path: "/reportes/${tipo}"[^}]*permission: PermisoBanderas\\.REPORTES_${tipo.toUpperCase()}`));
    assert.match(catalogo, new RegExp(`tipo: "${tipo}"`));
  }
});

test('el reporte exporta a Excel (.xlsx) cargando ExcelJS solo al exportar', () => {
  const descarga = leer('../../src/modules/reportes/utils/descarga.ts');
  const excel = leer('../../src/modules/reportes/utils/excel.ts');
  const paquete = JSON.parse(leer('../../package.json'));
  assert.equal(paquete.dependencies.exceljs, '4.4.0', 'versión fija');
  assert.match(descarga, /await import\("exceljs"\)/, 'import dinámico: no pesa en las páginas');
  assert.doesNotMatch(excel, /^import (?!type)[^\n]*exceljs/m, 'excel.ts solo importa tipos de ExcelJS');
  assert.match(shell, /Exportar Excel/);
  assert.match(shell, /exportarExcel\(nombreArchivo\(reporte\.titulo, rango\.desde, rango\.hasta\)/);
});

test('la impresión usa su propio diseño: sin menú, A4 horizontal y tablas con cabecera repetida', () => {
  assert.match(shell, /window\.print\(\)/);
  assert.match(shell, /data-imprimir-reporte/);
  assert.match(shell, /document\.title = nombreArchivo\(/, 'el PDF se guarda con el nombre del reporte');
  assert.match(estilos, /body:has\(\[data-imprimir-reporte\]\) aside/);
  assert.match(estilos, /@page reporte \{\s*size: A4 landscape;/);
  assert.match(estilos, /counter\(page\) " de " counter\(pages\)/);
  assert.match(estilos, /\.tabla-reporte thead \{\s*display: table-header-group;/);
  assert.match(estilos, /\.reporte-imprimible \{\s*page: reporte;/);
});

test('cada vista arma sus secciones una vez para la tabla y el Excel', () => {
  for (const tipo of [...TIPOS, 'general']) {
    const vista = leer(`../../src/modules/reportes/components/reporte-${tipo}-view.tsx`);
    assert.match(vista, /function armarSecciones\(/, `${tipo}: sin armarSecciones`);
    assert.match(vista, /<TablaSeccion seccion=\{s\./, `${tipo}: la tabla no usa la sección exportada`);
    assert.match(vista, /exportar=\{s \? \(\) => \[/, `${tipo}: la exportación no usa las secciones`);
  }
});

test('el dashboard usa el selector de rango compartido sin fechas futuras', () => {
  assert.match(dashboard, /<DateRangePicker label="Período" value=\{d\.rango\} onChange=\{d\.cambiarRango\} max=\{hoy\} \/>/);
  assert.doesNotMatch(dashboard, /BarChartOne|LineChartOne/, 'ya no muestra los gráficos de ejemplo');
});

test('la sesión se lee sin romper la hidratación (servidor y navegador renderizan igual)', () => {
  const sesion = leer('../../src/modules/reportes/hooks/use-sesion-cliente.ts');
  assert.match(sesion, /useSyncExternalStore\(sinCambios, leer, \(\) => enServidor\)/);
  assert.match(sesion, /\}, null\);/, 'el permiso es null hasta leer la sesión');
  // Regresión: leer localStorage en useMemo daba "Hydration failed" en /dashboard.
  assert.doesNotMatch(hookDashboard, /getStoredUser|useMemo/);
  assert.doesNotMatch(shell, /useMemo\(\(\) => \{\s*const user = getStoredUser\(\)/);
  assert.match(shell, /useSesionCliente\(\(\) => \{\s*const user = getStoredUser\(\);/);
  assert.match(dashboard, /d\.permitido === null \?/);
  assert.match(dashboard, /\{d\.permitido === true && \(/);
});
