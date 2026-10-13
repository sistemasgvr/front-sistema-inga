import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

const modal = leer('../../src/modules/recetas/components/receta-form-modal.tsx');
const hook = leer('../../src/modules/recetas/hooks/use-recetas.tsx');
const service = leer('../../src/modules/recetas/services/recetas.service.ts');

test('el modal ofrece los tres desplegables de filtro', () => {
  assert.match(modal, /<Label>Tipo<\/Label>/);
  assert.match(modal, /<Label>Categoría<\/Label>/);
  assert.match(modal, /<Label>Subcategoría<\/Label>/);
});

test('cada desplegable pide sus opciones al abrirse', () => {
  // Regla del proyecto: cargar opciones al abrir, no al montar el modal.
  const aperturas = modal.match(/onOpen=\{\(\) => void cargarFiltros\(\)\}/g) || [];
  assert.equal(aperturas.length, 3);
});

test('cambiar de categoría vuelve a pedir las subcategorías y limpia la elegida', () => {
  // Reutilizar la lista anterior mostraría subcategorías del contexto previo.
  assert.match(hook, /setFiltroSubcategoria\(null\)/);
  assert.match(hook, /cargarSubcategorias\(idCategoria\)/);
  assert.match(hook, /id_categoria: idCategoria/);
});

test('la subcategoría queda deshabilitada sin categoría', () => {
  assert.match(modal, /disabled=\{!filtroCategoria\}/);
});

test('escribir en el buscador conserva los filtros aplicados', () => {
  assert.match(hook, /id_tipo_producto: parcial\.id_tipo_producto \?\? vigentes\.id_tipo_producto/);
  assert.match(hook, /id_categoria: parcial\.id_categoria \?\? vigentes\.id_categoria/);
  assert.match(hook, /id_subcategoria: parcial\.id_subcategoria \?\? vigentes\.id_subcategoria/);
});

test('buscarInsumos no depende de los filtros, para no recargar el modal', () => {
  // Si dependiera de ellos, cambiar un filtro cambiaría su identidad y el
  // efecto que carga la receta volvería a pedirla, recargando el modal entero.
  const cuerpo = hook.slice(hook.indexOf('const buscarInsumos = useCallback'));
  const fin = cuerpo.indexOf('buscarInsumosRef.current = buscarInsumos;');
  const deps = cuerpo.slice(0, fin);
  assert.match(deps, /\[\s*\],?\s*\n\s*\);/);
  assert.doesNotMatch(
    deps.slice(deps.indexOf('async (filtros')),
    /filtroTipo|filtroCategoria|filtroSubcategoria/
  );
});

test('los filtros se leen de una ref sincronizada con el estado', () => {
  assert.match(hook, /filtrosRef\.current\s*=\s*\{/);
  assert.match(hook, /id_categoria: filtroCategoria/);
});

test('cada desplegable muestra lo elegido', () => {
  // Select es no controlado: sin defaultValue el key lo remontaba y volvía al
  // placeholder en vez de mostrar la alternativa escogida.
  assert.match(modal, /defaultValue=\{filtroTipo \? String\(filtroTipo\) : ""\}/);
  assert.match(modal, /defaultValue=\{filtroCategoria \? String\(filtroCategoria\) : ""\}/);
  assert.match(modal, /defaultValue=\{\s*filtroSubcategoria \? String\(filtroSubcategoria\) : ""\s*\}/);
  assert.doesNotMatch(modal, /key=\{`tipo-/);
});

test('los filtros ocupan una fila propia de ancho completo', () => {
  // Los filtros van en su propia grilla de tres columnas, antes del selector,
  // y el selector ocupa todo el ancho: si quedaran en la misma fila, los tres
  // desplegables se apretarían.
  const grillaFiltros = modal.indexOf('grid grid-cols-1 gap-3 sm:grid-cols-3');
  const etiquetaSelector = modal.indexOf('<Label>Insumo o sub-plato');
  const filaCantidad = modal.indexOf('grid grid-cols-2 gap-3 sm:grid-cols-12');

  assert.ok(grillaFiltros !== -1, 'falta la grilla de tres columnas del filtro');
  assert.ok(etiquetaSelector !== -1, 'falta el selector de insumos');
  assert.ok(grillaFiltros < etiquetaSelector, 'los filtros van antes del selector');
  assert.ok(
    etiquetaSelector < filaCantidad,
    'el selector va en su propia fila, fuera de la grilla de cantidad',
  );
  assert.doesNotMatch(modal, /sm:col-span-5/);
});

test('el servicio envía los tres filtros al backend', () => {
  for (const filtro of [
    'id_tipo_producto',
    'id_categoria',
    'id_subcategoria',
  ]) {
    assert.match(service, new RegExp(filtro));
  }
});

test('se avisa cuando el sub-plato no puede anticiparse', () => {
  // prod_preparar rechaza la producción anticipada con grupos de sustitución.
  assert.match(modal, /tiene_grupos_sustitucion/);
  assert.match(modal, /avisoSustitucion/);
  assert.match(modal, /variant="warning"/);
  assert.match(modal, /Preparación solo por pedido/);
  // El tipo debe declararlo o TypeScript no avisaría si el backend no lo manda.
  const tipos = leer('../../src/modules/recetas/types/recetas.types.ts');
  assert.match(tipos, /tiene_grupos_sustitucion\?:/);
});

test('el aviso nombra el producto y explica la consecuencia', () => {
  assert.match(modal, /insumoSeleccionado\.nombre/);
  assert.match(modal, /No podrá anticiparse en el almacén/);
});

test('los sub-platos se distinguen de los insumos crudos en el selector', () => {
  assert.match(modal, /sub-plato/);
  assert.match(modal, /i\.tiene_receta/);
});

test('los filtros se limpian al cerrar el modal', () => {
  // Reabrir no debe heredar el filtro de la sesión anterior.
  assert.match(modal, /limpiarFiltros\(\)/);
  assert.match(modal, /!isOpen/);
});